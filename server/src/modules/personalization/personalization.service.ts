import { Injectable } from '@nestjs/common';
import { Article } from '../articles/article.entity';
import { User } from '../users/user.entity';
import { KeywordService } from '../keywords/keyword.service';
import { SavedArticleService } from '../savedarticles/saved-article.service';
import { UserHistoryService } from '../userhistory/user-history.service';
import { ArticleLikeService } from '../articlelikes/article-like.service';
import { NotificationConfigService } from '../notificationconfig/notification-config.service';
import { ArticleLike } from '../articlelikes/article-like.entity';
import { SavedArticle } from '../savedarticles/saved-article.entity';

@Injectable()
export class PersonalizationService {
  constructor(
    private readonly keywordService: KeywordService,
    private readonly savedArticlesService: SavedArticleService,
    private readonly userHistoryService: UserHistoryService,
    private readonly articleLikesService: ArticleLikeService,
    private readonly notificationConfigService: NotificationConfigService,
  ) {}

  async calculatePersonalizationScore(article: Article, user: User): Promise<number> {
    let score = 0;

    const notificationConfig = await this.notificationConfigService.getNotificationConfigForUser(user);
    if (notificationConfig && notificationConfig.enabledCategoryIds?.includes(article.category.categoryID)) {
      score += 10;
    }

    if (notificationConfig && notificationConfig.keywords) {
      for (const keyword of notificationConfig.keywords) {
        const keywordLower = keyword.toLowerCase();
        const titleLower = article.articleTitle.toLowerCase();
        const contentLower = article.articleContent.toLowerCase();
        
        if (titleLower.includes(keywordLower) || contentLower.includes(keywordLower)) {
          score += 5;
        }
      }
    }

    const likedArticles = await this.articleLikesService.getLikesForUser(user.userID);
    if (likedArticles.some((like: ArticleLike) => like.article.source === article.source)) {
      score += 15;
    }

    const savedArticles = await this.savedArticlesService.getSavedArticles(user.userID);
    if (savedArticles.some((saved: SavedArticle) => saved.article.source === article.source)) {
      score += 15;
    }

    const userHistory = await this.userHistoryService.getHistoryForUser(user);
    if (userHistory.some((history) => history.article.source === article.source)) {
      score += 5;
    }

    return score;
  }
}
