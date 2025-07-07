import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleReport } from './article-report.entity';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';
import { MailHelperService } from '../mailer/mailer.service';

@Injectable()
export class ArticleReportService {
  constructor(
    @InjectRepository(ArticleReport)
    private articleReportRepository: Repository<ArticleReport>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private mailHelperService: MailHelperService,
  ) {}

  async createReport(articleId: number, userId: number): Promise<ArticleReport> {
    const user = await this.userRepository.findOne({ where: { userID: userId } });
    const article = await this.articleRepository.findOne({ 
      where: { articleID: articleId },
      relations: ['category']
    });

    if (!user || !article) {
      throw new Error('User or Article not found');
    }

    // Check if report already exists
    const existingReport = await this.articleReportRepository.findOne({
      where: { user: { userID: userId }, article: { articleID: articleId } }
    });

    if (existingReport) {
      throw new Error('You have already reported this article');
    }

    const report = this.articleReportRepository.create({
      user,
      article,
    });

    const savedReport = await this.articleReportRepository.save(report);

    // Get current report count after saving
    const reportCount = await this.getReportCount(articleId);

    // Send email notification to all admins
    try {
      await this.sendAdminNotification(article, user, reportCount);
    } catch (error) {
      console.error('Failed to send admin notification email:', error);
      // Don't throw error - we don't want email failure to block reporting
    }

    // Check if article should be auto-hidden (threshold: 5 reports)
    await this.checkAutoHide(articleId);

    return savedReport;
  }

  async getReportCount(articleId: number): Promise<number> {
    return this.articleReportRepository.count({
      where: { article: { articleID: articleId } }
    });
  }

  async getAllReports(): Promise<ArticleReport[]> {
    return this.articleReportRepository.find({
      relations: ['user', 'article'],
      order: { createdAt: 'DESC' }
    });
  }

  private async checkAutoHide(articleId: number): Promise<void> {
    const reportCount = await this.getReportCount(articleId);
    
    if (reportCount >= 5) {
      await this.articleRepository.update(articleId, {
        isHidden: true,
        hiddenAt: new Date(),
      });
    }
  }

  private async sendAdminNotification(article: Article, reportedBy: User, reportCount: number): Promise<void> {
    // Get all admin users
    const admins = await this.userRepository.find({
      where: { role: 'admin' }
    });

    if (admins.length === 0) {
      console.log('No admin users found in the system');
      return;
    }

    console.log(`Sending article report notification to ${admins.length} admin(s)`);
    
    const emailResults = await this.mailHelperService.sendArticleReportNotification(
      admins,
      article,
      reportedBy,
      reportCount
    );

    // Log email sending results
    emailResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✓ Email sent successfully to admin: ${admins[index].email}`);
      } else {
        console.error(`✗ Failed to send email to admin: ${admins[index].email}`, result.reason);
      }
    });
  }
}
