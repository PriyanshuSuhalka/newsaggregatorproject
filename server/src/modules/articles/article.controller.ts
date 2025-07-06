import { Controller, Get, Post, Body, Query, BadRequestException, Param } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Articles')
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  create(@Body() dto: CreateArticleDto) {
    return this.articleService.create(dto);
  }

  @Get()
  async getArticles(
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('category') category?: string,
  ) {
    return this.articleService.getArticles(start, end, category);
  }

  @Get('search')
  async searchArticles(
    @Query('keyword') keyword: string,
    @Query('start') start?: string,
    @Query('end') end?: string
  ) {
    if (!keyword) {
      throw new BadRequestException('Keyword is required');
    }
    return this.articleService.searchArticles({
      keyword,
      start,
      end
    });
  }

  @Get('search/suggestions')
  async getSearchSuggestions(@Query('q') query: string) {
    if (!query || query.length < 2) {
      return [];
    }
    return this.articleService.getSearchSuggestions(query);
  }
}

@Controller('admin/articles')
export class AdminArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post(':id/hide')
  async hideArticle(
    @Param('id') articleId: number,
    @Body('adminId') adminId: number,
  ) {
    try {
      await this.articleService.hideArticle(articleId, adminId);
      return { success: true, message: 'Article hidden successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  @Post(':id/unhide')
  async unhideArticle(
    @Param('id') articleId: number,
    @Body('adminId') adminId: number,
  ) {
    try {
      await this.articleService.unhideArticle(articleId, adminId);
      return { success: true, message: 'Article unhidden successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
