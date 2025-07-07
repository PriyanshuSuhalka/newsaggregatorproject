import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './article.entity';
import { ArticleService } from './article.service';
import { ArticleController, AdminArticleController } from './article.controller';
import { Category } from '../categories/category.entity';
import { ExternalAPI } from '../externalapi/external-api.entity';
import { User } from '../users/user.entity';
import { PersonalizationModule } from '../personalization/personalization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, Category, ExternalAPI, User]),
    forwardRef(() => PersonalizationModule),
  ],
  providers: [ArticleService],
  controllers: [ArticleController, AdminArticleController],
  exports: [ArticleService],
})
export class ArticleModule {}
