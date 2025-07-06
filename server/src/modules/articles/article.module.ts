import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './article.entity';
import { ArticleService } from './article.service';
import { ArticleController, AdminArticleController } from './article.controller';
import { Category } from '../categories/category.entity';
import { ExternalAPI } from '../externalapi/external-api.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article, Category, ExternalAPI, User])],
  providers: [ArticleService],
  controllers: [ArticleController, AdminArticleController],
  exports: [ArticleService],
})
export class ArticleModule {}
