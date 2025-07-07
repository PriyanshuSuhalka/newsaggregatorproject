import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './article.entity';
import { ArticleService } from './article.service';
import { ArticleController, AdminArticleController } from './article.controller';
import { Category } from '../categories/category.entity';
import { ExternalAPI } from '../externalapi/external-api.entity';
import { User } from '../users/user.entity';
import { PersonalizationService } from '../personalization/personalization.service';
import { KeywordModule } from '../keywords/keyword.module';
import { SavedArticleModule } from '../savedarticles/saved-article.module';
import { UserHistoryModule } from '../userhistory/user-history.module';
import { ArticleLikeModule } from '../articlelikes/article-like.module';
import { NotificationConfigModule } from '../notificationconfig/notification-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, Category, ExternalAPI, User]),
    KeywordModule,
    SavedArticleModule,
    forwardRef(() => UserHistoryModule),
    ArticleLikeModule,
    NotificationConfigModule,
  ],
  providers: [ArticleService, PersonalizationService],
  controllers: [ArticleController, AdminArticleController],
  exports: [ArticleService],
})
export class ArticleModule {}
