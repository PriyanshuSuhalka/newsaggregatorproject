import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from '@modules/articles/article.entity';
import { Category } from '@modules/categories/category.entity';
import { ExternalApiService } from '@modules/externalapi/externalapi.service';
import { NewsApiAdapter } from '@modules/externalapi/adapters/newsapi.adapter';
import { TheNewsApiAdapter } from '@modules/externalapi/adapters/thenewsapi.adapter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Article, Category])],
  providers: [ExternalApiService, NewsApiAdapter, TheNewsApiAdapter],
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
