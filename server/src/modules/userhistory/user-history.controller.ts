import { Controller, Post, Param, Req, UseGuards } from '@nestjs/common';
import { UserHistoryService } from './user-history.service';
import { ArticleService } from '../articles/article.service';

@Controller('user-history')
export class UserHistoryController {
  constructor(
    private readonly userHistoryService: UserHistoryService,
    private readonly articlesService: ArticleService,
  ) {}

  @Post('read/:articleId')
  async addArticleToHistory(@Param('articleId') articleId: number, @Req() req: any) {
    const article = await this.articlesService.findOne(articleId);
    if (!article) {
      throw new Error('Article not found');
    }
    return this.userHistoryService.addArticleToHistory(req.user, article);
  }
}
