import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleReport } from './article-report.entity';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';

@Injectable()
export class ArticleReportService {
  constructor(
    @InjectRepository(ArticleReport)
    private articleReportRepository: Repository<ArticleReport>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createReport(articleId: number, userId: number): Promise<ArticleReport> {
    const user = await this.userRepository.findOne({ where: { userID: userId } });
    const article = await this.articleRepository.findOne({ where: { articleID: articleId } });

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
}
