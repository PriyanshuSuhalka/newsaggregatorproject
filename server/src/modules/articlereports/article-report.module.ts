import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleReport } from './article-report.entity';
import { ArticleReportService } from './article-report.service';
import { ArticleReportController, AdminReportController } from './article-report.controller';
import { Article } from '../articles/article.entity';
import { User } from '../users/user.entity';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArticleReport, Article, User]),
    MailerModule
  ],
  providers: [ArticleReportService],
  controllers: [ArticleReportController, AdminReportController],
  exports: [ArticleReportService],
})
export class ArticleReportModule {}
