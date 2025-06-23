import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Article } from "@modules/articles/article.entity";
import { Category } from "@modules/categories/category.entity";
import { ExternalApiService } from "./externalapi.service";
import { ExternalApiCron } from "./external-api.cron";
import { TheNewsApiAdapter } from './adapters/thenewsapi.adapter';
import { NewsApiAdapter } from "./adapters/newsapi.adapter";
import { ExternalAPI } from './external-api.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article, Category, ExternalAPI])],
  providers: [
    ExternalApiService,
    ExternalApiCron,
    NewsApiAdapter,
    TheNewsApiAdapter,
  ],
  exports: [ExternalApiService],
})
export class ExternalApiModule {}
