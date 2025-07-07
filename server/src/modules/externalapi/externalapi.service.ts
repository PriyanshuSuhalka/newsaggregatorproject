import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Article } from '@modules/articles/article.entity';
import { Category } from '@modules/categories/category.entity';
import { NewsApiAdapter } from './adapters/newsapi.adapter';
import { TheNewsApiAdapter } from './adapters/thenewsapi.adapter';
import { ExternalAPI } from './external-api.entity';
import { QueryFailedError } from 'typeorm';
import { NotificationOrchestrationService } from '@modules/notifications/notification-orchestration.service';

@Injectable()
export class ExternalApiService {
  private readonly logger = new Logger(ExternalApiService.name);

  constructor(
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(ExternalAPI)
    private externalRepo: Repository<ExternalAPI>,
    private dataSource: DataSource,
    private notificationOrchestrationService: NotificationOrchestrationService
  ) {}

  async fetchAndSaveArticles(): Promise<void> {
    await this.fetchFromAdapter('newsapi', new NewsApiAdapter(this.dataSource));
    await this.fetchFromAdapter('thenewsapi', new TheNewsApiAdapter(this.dataSource));
  }

  private async fetchFromAdapter(
    apiName: string,
    adapter: {
      fetchArticles: () => Promise<{
        title: string;
        content: string;
        url: string;
        source: string;
        publishedAt: Date;
        category: string;
      }[]>;
    }
  ) {
    const externalAPI = await this.externalRepo.findOne({
      where: { name: apiName },
    });

    if (!externalAPI) {
      this.logger.warn(`External API config not found for: ${apiName}`);
      return;
    }

    try {
      const articles = await adapter.fetchArticles();

      for (const a of articles) {
        const category = await this.saveOrFindCategory(a.category);

        const article = this.articleRepo.create({
          articleTitle: a.title,
          articleContent: a.content,
          source: a.source,
          URL: a.url,
          publishDate: a.publishedAt,
          category,
          externalAPI,
        });

        try {
          const savedArticle = await this.articleRepo.save(article);
          this.logger.log(`✅ Article saved from ${apiName}: ${a.title}`);

          // Notify users who are subscribed to this category or have matching keywords
          await this.notificationOrchestrationService.notifyUsersForArticle(savedArticle);
        } catch (error: any) {
          if (
            error instanceof QueryFailedError &&
            error.driverError?.code === 'ER_DUP_ENTRY'
          ) {
            this.logger.warn(`⏩ Duplicate URL skipped: ${a.url}`);
          } else {
            this.logger.error(`❌ Failed to save article from ${apiName}: ${a.title}`);
            this.logger.error(error.message || error);
          }
        }
      }

      externalAPI.APIStatus = 1;
      externalAPI.lastAccessed = new Date();
      await this.externalRepo.save(externalAPI);
    } catch (error: any) {
      this.logger.error(`❌ Failed to fetch from ${apiName}: ${error.message}`);
      externalAPI.APIStatus = 0;
      externalAPI.lastAccessed = new Date();
      await this.externalRepo.save(externalAPI);
    }
  }

  private async saveOrFindCategory(name: string): Promise<Category> {
    let category = await this.categoryRepo.findOne({ where: { categoryName: name } });

    if (!category) {
      category = await this.categoryRepo.findOne({ where: { categoryName: 'General' } });
      if (!category) {
        category = this.categoryRepo.create({ categoryName: 'General' });
        category = await this.categoryRepo.save(category);
        this.logger.warn(`Fallback category 'General' created.`);
      }
      this.logger.warn(`Category '${name}' not found. Using 'General'.`);
    }

    return category;
  }
}
