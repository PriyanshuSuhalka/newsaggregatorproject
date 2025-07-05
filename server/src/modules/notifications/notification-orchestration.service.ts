import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '@modules/articles/article.entity';
import { NotificationConfiguration } from '@modules/notificationconfig/notification-config.entity';
import { User } from '@modules/users/user.entity';
import { Notification } from '@modules/notifications/notification.entity';
import { ArticleMatchingService, MatchResult } from '@modules/matching/article-matching.service';
import { MailHelperService } from '@modules/mailer/mailer.service';

export interface NotificationResult {
  totalNotificationsSent: number;
  totalEmailsSent: number;
  userNotifications: Array<{
    userId: number;
    email: string;
    matchScore: number;
    matchReasons: string[];
    notificationSent: boolean;
    emailSent: boolean;
  }>;
}

@Injectable()
export class NotificationOrchestrationService {
  private readonly logger = new Logger(NotificationOrchestrationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,

    @InjectRepository(NotificationConfiguration)
    private configRepo: Repository<NotificationConfiguration>,

    private readonly articleMatchingService: ArticleMatchingService,
    private readonly mailHelper: MailHelperService
  ) {}

  /**
   * Main orchestration method to notify users about a new article
   */
  async notifyUsersForArticle(article: Article): Promise<NotificationResult> {
    const categoryId = article.category?.categoryID;
    const categoryName = article.category?.categoryName;

    if (!categoryId || !categoryName) {
      this.logger.warn(`Category not found for article: ${article.articleTitle}`);
      return this.createEmptyResult();
    }

    this.logger.log(`🔍 Processing notifications for article: "${article.articleTitle}" in category "${categoryName}"`);

    // Get all user configurations
    const userConfigs = await this.getAllUserConfigurations();
    
    if (userConfigs.length === 0) {
      this.logger.log(`📭 No user configurations found`);
      return this.createEmptyResult();
    }

    this.logger.log(`📊 Checking ${userConfigs.length} user configurations for matches`);

    // Find matching users using the dedicated matching service
    const matchingUsers = await this.findMatchingUsers(article, userConfigs);

    if (matchingUsers.length === 0) {
      this.logger.log(`📭 No users matched for article: ${article.articleTitle}`);
      return this.createEmptyResult();
    }

    // Sort by match score (highest first) for better user experience
    matchingUsers.sort((a, b) => b.matchResult.score - a.matchResult.score);

    this.logger.log(`🔔 Sending notifications to ${matchingUsers.length} users (sorted by relevance)`);

    // Send notifications to matching users
    return await this.sendNotificationsToUsers(article, matchingUsers);
  }

  /**
   * Find users whose configurations match the given article
   */
  private async findMatchingUsers(
    article: Article,
    userConfigs: NotificationConfiguration[]
  ): Promise<Array<{ config: NotificationConfiguration; matchResult: MatchResult }>> {
    const matchingUsers: Array<{ config: NotificationConfiguration; matchResult: MatchResult }> = [];

    for (const config of userConfigs) {
      const matchResult = await this.articleMatchingService.matchArticle(article, config);
      
      if (matchResult.matched && matchResult.score > 0) {
        matchingUsers.push({ config, matchResult });
        
        this.logger.log(
          `✅ User ${config.user.email} matched with score ${matchResult.score}: ${matchResult.reasons.join(', ')}`
        );
      }
    }

    return matchingUsers;
  }

  /**
   * Send notifications to all matching users
   */
  private async sendNotificationsToUsers(
    article: Article,
    matchingUsers: Array<{ config: NotificationConfiguration; matchResult: MatchResult }>
  ): Promise<NotificationResult> {
    const result: NotificationResult = {
      totalNotificationsSent: 0,
      totalEmailsSent: 0,
      userNotifications: []
    };

    for (const { config, matchResult } of matchingUsers) {
      const user = config.user;
      
      if (!user?.email) {
        this.logger.warn(`⚠️ User ${user?.userID} has no email address`);
        continue;
      }

      const userResult = await this.sendNotificationToUser(article, user, matchResult);
      result.userNotifications.push(userResult);

      if (userResult.notificationSent) {
        result.totalNotificationsSent++;
      }

      if (userResult.emailSent) {
        result.totalEmailsSent++;
      }
    }

    this.logger.log(
      `✅ Notification summary for "${article.articleTitle}": ${result.totalNotificationsSent} notifications sent, ${result.totalEmailsSent} emails sent`
    );

    return result;
  }

  /**
   * Send notification to a single user
   */
  private async sendNotificationToUser(
    article: Article,
    user: User,
    matchResult: MatchResult
  ): Promise<{
    userId: number;
    email: string;
    matchScore: number;
    matchReasons: string[];
    notificationSent: boolean;
    emailSent: boolean;
  }> {
    const userResult = {
      userId: user.userID,
      email: user.email,
      matchScore: matchResult.score,
      matchReasons: matchResult.reasons,
      notificationSent: false,
      emailSent: false
    };

    // Create notification message
    const message = this.createNotificationMessage(article, matchResult);

    try {
      // Save in-app notification
      await this.saveInAppNotification(user, article, message);
      userResult.notificationSent = true;
      
      this.logger.log(`🔔 Notification saved for ${user.email} (score: ${matchResult.score})`);

      // Send email if user has email notifications enabled
      const userConfig = await this.getUserConfiguration(user.userID);
      if (userConfig?.emailNotificationsEnabled) {
        const emailSent = await this.sendEmailNotification(user, article);
        userResult.emailSent = emailSent;
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Failed to send notification to ${user.email}: ${errorMessage}`);
    }

    return userResult;
  }

  /**
   * Save in-app notification
   */
  private async saveInAppNotification(user: User, article: Article, message: string): Promise<void> {
    const notification = this.notificationRepo.create({ 
      user, 
      message,
      articleId: article.articleID 
    });
    
    await this.notificationRepo.save(notification);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(user: User, article: Article): Promise<boolean> {
    try {
      await this.mailHelper.sendArticleNotification(user, article);
      this.logger.log(`📧 Email sent to ${user.email}`);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Failed to send email to ${user.email}: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Create notification message based on match result
   */
  private createNotificationMessage(article: Article, matchResult: MatchResult): string {
    const scorePercentage = Math.min(100, Math.round(matchResult.score));
    return `📰 New article (${scorePercentage}% match): ${article.articleTitle} - ${matchResult.reasons.join(', ')}`;
  }

  /**
   * Get all user configurations with their users
   */
  private async getAllUserConfigurations(): Promise<NotificationConfiguration[]> {
    return this.configRepo
      .createQueryBuilder('config')
      .leftJoinAndSelect('config.user', 'user')
      .getMany();
  }

  /**
   * Get user configuration by user ID
   */
  private async getUserConfiguration(userId: number): Promise<NotificationConfiguration | null> {
    return this.configRepo.findOne({
      where: { user: { userID: userId } },
      relations: ['user']
    });
  }

  /**
   * Create empty notification result
   */
  private createEmptyResult(): NotificationResult {
    return {
      totalNotificationsSent: 0,
      totalEmailsSent: 0,
      userNotifications: []
    };
  }
}
