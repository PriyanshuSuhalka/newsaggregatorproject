import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';


import { User } from '@modules/users/user.entity';
import { Category } from '@modules/categories/category.entity';
import { AuthModule } from './auth/auth.module';
import { ExternalAPI } from '@modules/externalapi/external-api.entity';
import { Article } from '@modules/articles/article.entity';
import { SavedArticle } from '@modules/savedarticles/saved-article.entity';
import { Notification } from '@modules/notifications/notification.entity';


import { ArticleService } from '@modules/articles/article.service';
import { ArticleController } from '@modules/articles/article.controller';


@Module({
  imports: [
    // Load .env variables globally
    ConfigModule.forRoot({ isGlobal: true }),

    // Database Connection
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: true,
      entities: [User, Article, Category, SavedArticle,Notification],
    }),

    // Register repositories for DI
    TypeOrmModule.forFeature([User, Article, Category,SavedArticle,Notification]),
    AuthModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class AppModule {}
