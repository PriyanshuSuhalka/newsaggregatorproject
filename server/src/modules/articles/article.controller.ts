import { Controller, Get, Post, Body, Query, BadRequestException } from '@nestjs/common';
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
  async searchArticles(@Query('keyword') keyword: string) {
    if (!keyword) {
      throw new BadRequestException('Keyword is required');
    }
    return this.articleService.searchByKeyword(keyword);
  }
}
