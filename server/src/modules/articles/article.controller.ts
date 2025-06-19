import { Controller, Get, Post, Body } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Articles')
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  findAll() {
    return this.articleService.findAll();
  }

  @Post()
  create(@Body() dto: CreateArticleDto) {
    return this.articleService.create(dto);
  }
}
