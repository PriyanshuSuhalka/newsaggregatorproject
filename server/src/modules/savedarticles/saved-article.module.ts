import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedArticle } from './saved-article.entity';
import { Article } from '@modules/articles/article.entity';
import { User } from '@modules/users/user.entity';
import { SavedArticleController } from './saved-article.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavedArticle, User, Article]),
  ],
  controllers: [SavedArticleController],
})
export class SavedArticleModule {}
