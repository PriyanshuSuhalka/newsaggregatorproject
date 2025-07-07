import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from '@modules/articles/article.entity';
import { Category } from '@modules/categories/category.entity';
import { ExternalApiService } from '@modules/externalapi/externalapi.service';
import { NewsApiAdapter } from '@modules/externalapi/adapters/newsapi.adapter';
import { TheNewsApiAdapter } from '@modules/externalapi/adapters/thenewsapi.adapter';
import { ExternalAPI } from '@modules/externalapi/external-api.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationModule } from '@modules/notifications/notification.module';
import { ExternalApiCron } from './external-api.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, Category, ExternalAPI]),
    forwardRef(() => NotificationModule),
  ],
  providers: [ExternalApiService, NewsApiAdapter, TheNewsApiAdapter, ExternalApiCron],
  exports: [ExternalApiService],
})
export class ExternalApiModule {
  constructor(
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,

    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,

    private readonly newsApiAdapter: NewsApiAdapter,
    private readonly theNewsApiAdapter: TheNewsApiAdapter,
  ) {}
}
