import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ArticleReportService } from './article-report.service';

@Controller('articles')
export class ArticleReportController {
  constructor(private readonly articleReportService: ArticleReportService) {}

  @Post(':id/report')
  async reportArticle(
    @Param('id') articleId: number,
    @Body('userId') userId: number,
  ) {
    try {
      const report = await this.articleReportService.createReport(articleId, userId);
      return { success: true, message: 'Article reported successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  @Get(':id/reports/count')
  async getReportCount(@Param('id') articleId: number) {
    const count = await this.articleReportService.getReportCount(articleId);
    return { count };
  }
}

@Controller('admin/reports')
export class AdminReportController {
  constructor(private readonly articleReportService: ArticleReportService) {}

  @Get()
  async getAllReports() {
    return this.articleReportService.getAllReports();
  }
}
