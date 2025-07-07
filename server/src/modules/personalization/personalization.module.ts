import { Module, forwardRef } from '@nestjs/common';
import { PersonalizationService } from './personalization.service';
import { ArticleModule } from '../articles/article.module';
import { KeywordModule } from '../keywords/keyword.module';
import { SavedArticleModule } from '../savedarticles/saved-article.module';
import { UserHistoryModule } from '../userhistory/user-history.module';
import { ArticleLikeModule } from '../articlelikes/article-like.module';
import { NotificationConfigModule } from '../notificationconfig/notification-config.module';

@Module({
  imports: [
    forwardRef(() => ArticleModule),
    KeywordModule,
    SavedArticleModule,
    UserHistoryModule,
    ArticleLikeModule,
    NotificationConfigModule,
  ],
  providers: [PersonalizationService],
  exports: [PersonalizationService],
})
export class PersonalizationModule {}
