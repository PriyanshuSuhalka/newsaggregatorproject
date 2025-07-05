import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { NotificationConfiguration } from '@modules/notificationconfig/notification-config.entity';
import { User } from '@modules/users/user.entity';
import { Article } from '@modules/articles/article.entity';
import { MailHelperService } from '@modules/mailer/mailer.service'; 

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,

    @InjectRepository(NotificationConfiguration)
    private configRepo: Repository<NotificationConfiguration>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    private readonly mailHelper: MailHelperService // ✅ Use injected mail helper
  ) {}

  async notifyUsersForArticle(article: Article): Promise<void> {
    const categoryName = article.category?.categoryName;

    if (!categoryName) {
      this.logger.warn(
        `Category not found for article: ${article.articleTitle}`
      );
      return;
    }

    const configs = await this.configRepo
      .createQueryBuilder('config')
      .leftJoinAndSelect('config.user', 'user')
      .where('LOWER(config.categories) LIKE :category', {
        category: `%${categoryName.toLowerCase()}%`,
      })
      .orWhere('LOWER(config.keywords) LIKE :category', {
        category: `%${categoryName.toLowerCase()}%`,
      })
      .getMany();

    if (configs.length === 0) {
      this.logger.log(`No users configured for category: ${categoryName}`);
      return;
    }

    for (const config of configs) {
      const user = config.user;
      if (!user?.email) continue;

      const message = `📰 New article in "${categoryName}": ${article.articleTitle}`;

      // Save in-app notification
      const notification = this.notificationRepo.create({ user, message });
      await this.notificationRepo.save(notification);

      // Send email using boundary-safe MailHelperService
      try {
        await this.mailHelper.sendArticleNotification(user, article);
        this.logger.log(
          `📧 Email sent to ${user.email} for article: ${article.articleTitle}`
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          this.logger.error(
            `❌ Failed to send email to ${user.email}: ${err.message}`
          );
        } else {
          this.logger.error(
            `❌ Failed to send email to ${user.email}: Unknown error`,
            err
          );
        }
      }

      this.logger.log(`🔔 Notification saved for ${user.email} → ${message}`);
    }
  }
}
