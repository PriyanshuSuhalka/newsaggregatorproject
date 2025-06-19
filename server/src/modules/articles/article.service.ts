import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { Category } from '@modules/categories/category.entity';
import { ExternalAPI } from '@modules/externalapi/external-api.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,

    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,

    @InjectRepository(ExternalAPI)
    private externalRepo: Repository<ExternalAPI>,
  ) {}

  findAll() {
    return this.articleRepo.find();
  }

    async create(dto: CreateArticleDto) {
    const category = await this.categoryRepo.findOneBy({ categoryID: dto.categoryId });
    if (!category) throw new Error('Category not found');

    const api = await this.externalRepo.findOneBy({ externalAPIID: dto.externalAPIId });
    if (!api) throw new Error('External API not found');

    const article = new Article();
    article.articleContent = dto.articleContent;
    article.source = dto.source;
    article.URL = dto.URL;
    article.publishDate = dto.publishDate;
    article.category = category;
    article.externalAPI = api;

    return this.articleRepo.save(article);
    }
}
