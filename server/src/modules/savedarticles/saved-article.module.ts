import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedArticle } from './saved-article.entity';
import { Article } from '@modules/articles/article.entity';
import { User } from '@modules/users/user.entity';
import { SavedArticleController } from './saved-article.controller';
import { SavedArticleService } from './saved-article.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavedArticle, User, Article]),
  ],
  providers: [SavedArticleService],
  controllers: [SavedArticleController],
  exports: [SavedArticleService],
})
export class SavedArticleModule {}
