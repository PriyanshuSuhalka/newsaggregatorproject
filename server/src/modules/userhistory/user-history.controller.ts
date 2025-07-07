import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { UserHistoryService } from './user-history.service';
import { ArticleService } from '../articles/article.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Controller('user-history')
export class UserHistoryController {
  constructor(
    private readonly userHistoryService: UserHistoryService,
    private readonly articlesService: ArticleService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post('read/:articleId')
  async addArticleToHistory(
    @Param('articleId') articleId: number, 
    @Body('userId') userId: number
  ) {
    const article = await this.articlesService.findOne(articleId);
    if (!article) {
      throw new Error('Article not found');
    }
    
    const user = await this.userRepository.findOne({ where: { userID: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user has already read this article
    const existingHistory = await this.userHistoryService.hasUserReadArticle(user, article);
    if (existingHistory) {
      return { 
        message: 'Article already read',
        historyEntry: existingHistory
      };
    }
    
    // Add to history
    const historyEntry = await this.userHistoryService.addArticleToHistory(user, article);
    
    return { 
      message: 'Article marked as read successfully',
      historyEntry
    };
  }
}
