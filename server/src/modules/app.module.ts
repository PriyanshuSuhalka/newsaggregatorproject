import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ExternalApiModule } from './externalapi/externalapi.module'
import { NotificationModule } from './notifications/notification.module';

import { User } from "@modules/users/user.entity";
import { Category } from "@modules/categories/category.entity";
import { AuthModule } from "./auth/auth.module";
import { ExternalAPI } from "@modules/externalapi/external-api.entity";
import { Article } from "@modules/articles/article.entity";
import { SavedArticle } from "@modules/savedarticles/saved-article.entity";
import { Notification } from "@modules/notifications/notification.entity";

import { NotificationConfiguration } from '@modules/notificationconfig/notification-config.entity';
import { Keyword } from '@modules/keywords/keyword.entity';
import { ExternalServerController } from "@modules/externalapi/external-server.controller";
import { CategoryController } from "@modules/categories/category.controller";
import { CategoryService } from "@modules/categories/category.service";
import { ExternalServerService } from "@modules/externalapi/externalserver.service";
import { UserModule } from "@modules/users/user.module";
import { ArticleService } from "@modules/articles/article.service";
import { ArticleController } from "@modules/articles/article.controller";
import { SavedArticleModule } from "@modules/savedarticles/saved-article.module";

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
        NotificationConfiguration
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
    ]),
    AuthModule,
    ScheduleModule.forRoot(),
    ExternalApiModule,
    NotificationModule,
    SavedArticleModule,
    UserModule,
  ],
  controllers: [ArticleController, ExternalServerController, CategoryController],
  providers: [ArticleService, ExternalServerService, CategoryService],
})
export class AppModule {}
