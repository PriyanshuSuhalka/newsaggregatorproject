import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../articles/article.entity';
import { Category } from '../categories/category.entity';
import { NewsApiAdapter } from './adapters/newsapi.adapter';
import { ExternalApiCron } from './external-api.cron';


@Injectable()
export class ExternalApiService {
  private readonly logger = new Logger(ExternalApiService.name);

  constructor(
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,

    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async fetchAndSaveFromNewsApi() {
    const adapter = new NewsApiAdapter();
    const articles = await adapter.fetchArticles();

    for (const a of articles) {
      // Fallback to 'Unknown' if category not found
      const category = await this.saveOrFindCategory(a.category);

      const article = this.articleRepo.create({
        articleContent: a.title,
        source: a.source,
        URL: a.url,
        publishDate: new Date(a.publishedAt),
        category,
      });

      await this.articleRepo.save(article);
      this.logger.log(`Article saved: ${a.title}`);
    }
  }

  private async saveOrFindCategory(name: string): Promise<Category> {
    // Try finding existing category
    const existing = await this.categoryRepo.findOne({ where: { categoryName: name } });
    if (existing) return existing;

    // Use or create 'Unknown' category
    let unknown = await this.categoryRepo.findOne({ where: { categoryName: 'Unknown' } });
    if (!unknown) {
      unknown = this.categoryRepo.create({ categoryName: 'Unknown' });
      unknown = await this.categoryRepo.save(unknown);
      this.logger.warn(`Fallback category 'Unknown' created.`);
    }

    this.logger.warn(`Category '${name}' not found. Using 'Unknown'.`);
    return unknown;
  }
}
