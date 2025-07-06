import { Controller, Post, Delete, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ArticleLikeService, LikeStatsDto } from './article-like.service';
import { ArticleLike } from './article-like.entity';

@Controller('articles')
export class ArticleLikeController {
  constructor(private readonly articleLikeService: ArticleLikeService) {}

  @Post(':id/like')
  async likeArticle(
    @Param('id', ParseIntPipe) articleId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<{ message: string; like: ArticleLike }> {
    const like = await this.articleLikeService.likeArticle(userId, articleId);
    return {
      message: 'Article liked successfully',
      like
    };
  }

  @Post(':id/dislike')
  async dislikeArticle(
    @Param('id', ParseIntPipe) articleId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<{ message: string; dislike: ArticleLike }> {
    const dislike = await this.articleLikeService.dislikeArticle(userId, articleId);
    return {
      message: 'Article disliked successfully',
      dislike
    };
  }

  @Delete(':id/like')
  async removeVote(
    @Param('id', ParseIntPipe) articleId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<{ message: string }> {
    await this.articleLikeService.removeVote(userId, articleId);
    return {
      message: 'Vote removed successfully'
    };
  }

  @Get(':id/likes')
  async getArticleLikeStats(
    @Param('id', ParseIntPipe) articleId: number,
    @Query('userId') userId?: string,
  ): Promise<LikeStatsDto> {
    const userIdNumber = userId ? parseInt(userId) : undefined;
    return await this.articleLikeService.getArticleLikeStats(articleId, userIdNumber);
  }
}
