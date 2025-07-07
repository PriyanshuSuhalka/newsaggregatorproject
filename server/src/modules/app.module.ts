import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ExternalApiModule } from './externalapi/externalapi.module'
import { NotificationModule } from './notifications/notification.module';
import { ArticleLikeModule } from './articlelikes/article-like.module';
import { ArticleReportModule } from './articlereports/article-report.module';
import { BlockedKeywordModule } from './blockedkeywords/blocked-keyword.module';

import { User } from "@modules/users/user.entity";
import { Category } from "@modules/categories/category.entity";
import { AuthModule } from "./auth/auth.module";
import { ExternalAPI } from "@modules/externalapi/external-api.entity";
import { Article } from "@modules/articles/article.entity";
import { SavedArticle } from "@modules/savedarticles/saved-article.entity";
import { Notification } from "@modules/notifications/notification.entity";
import { ArticleLike } from "@modules/articlelikes/article-like.entity";
import { ArticleReport } from "@modules/articlereports/article-report.entity";
import { BlockedKeyword } from "@modules/blockedkeywords/blocked-keyword.entity";

import { NotificationConfiguration } from '@modules/notificationconfig/notification-config.entity';
import { Keyword } from '@modules/keywords/keyword.entity';
import { UserHistory } from './userhistory/user-history.entity';
import { ExternalServerController } from "@modules/externalapi/external-server.controller";
import { ExternalServerService } from "@modules/externalapi/externalserver.service";
import { UserModule } from "@modules/users/user.module";
import { ArticleModule } from "@modules/articles/article.module";
import { CategoryModule } from "@modules/categories/category.module";
import { SavedArticleModule } from "@modules/savedarticles/saved-article.module";
import { UserHistoryModule } from "./userhistory/user-history.module";
import { PersonalizationModule } from "./personalization/personalization.module";
import { KeywordModule } from "./keywords/keyword.module";
import { NotificationConfigModule } from "./notificationconfig/notification-config.module";

@Module({
  imports: [
    // Load .env variables globally
    ConfigModule.forRoot({ isGlobal: true }),

    // Database Connection
    TypeOrmModule.forRoot({
      type: "mysql",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "3306"),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: true,
      entities: [
        User,
        Article,
        Category,
        SavedArticle,
        Notification,
        ExternalAPI,
        Keyword,
        NotificationConfiguration,
        ArticleLike,
        ArticleReport,
        BlockedKeyword,
        UserHistory
      ],
    }),

    // Register repositories for DI
    TypeOrmModule.forFeature([
      User,
      Article,
      Category,
      SavedArticle,
      Notification,
      ExternalAPI,
      Keyword,
      NotificationConfiguration,
      ArticleLike,
      ArticleReport,
      BlockedKeyword,
      UserHistory,
    ]),
    AuthModule,
    ScheduleModule.forRoot(),
    ExternalApiModule,
    NotificationModule,
    ArticleLikeModule,
    ArticleReportModule,
    BlockedKeywordModule,
    ArticleModule,
    CategoryModule,
    SavedArticleModule,
    UserModule,
    UserHistoryModule,
    PersonalizationModule,
    KeywordModule,
    NotificationConfigModule,
  ],
  controllers: [ExternalServerController],
  providers: [ExternalServerService],
})
export class AppModule {}
