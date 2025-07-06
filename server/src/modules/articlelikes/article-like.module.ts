import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleLike } from './article-like.entity';
import { ArticleLikeService } from './article-like.service';
import { ArticleLikeController } from './article-like.controller';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleLike, User, Article])],
  providers: [ArticleLikeService],
  controllers: [ArticleLikeController],
  exports: [ArticleLikeService],
})
export class ArticleLikeModule {}
