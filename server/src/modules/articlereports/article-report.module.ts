import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleReport } from './article-report.entity';
import { ArticleReportService } from './article-report.service';
import { ArticleReportController, AdminReportController } from './article-report.controller';
import { Article } from '../articles/article.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleReport, Article, User])],
  providers: [ArticleReportService],
  controllers: [ArticleReportController, AdminReportController],
  exports: [ArticleReportService],
})
export class ArticleReportModule {}
