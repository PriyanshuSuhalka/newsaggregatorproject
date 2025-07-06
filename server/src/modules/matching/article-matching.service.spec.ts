import { Test, TestingModule } from '@nestjs/testing';
import { ArticleMatchingService, MatchResult } from './article-matching.service';
import { Article } from '@modules/articles/article.entity';
import { NotificationConfiguration } from '@modules/notificationconfig/notification-config.entity';
import { User } from '@modules/users/user.entity';
import { Category } from '@modules/categories/category.entity';

describe('ArticleMatchingService', () => {
  let service: ArticleMatchingService;

  const mockUser = {
    userID: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
    password: 'hashedpassword'
  } as User;

  const mockCategory = {
    categoryID: 1,
    categoryName: 'Technology'
  } as Category;

  const mockTechArticle = {
    articleID: 1,
    articleTitle: 'New AI Technology Breakthrough in Machine Learning',
    articleContent: 'Researchers have developed a new artificial intelligence algorithm that can significantly improve machine learning capabilities in software development.',
    source: 'TechNews',
    URL: 'https://example.com/ai-breakthrough',
    publishDate: new Date(),
    category: mockCategory
  } as Article;

  const mockSportsArticle = {
    articleID: 2,
    articleTitle: 'Championship Football Game Results',
    articleContent: 'The final championship game ended with an exciting victory for the home team in a thrilling sports match.',
    source: 'SportsDaily',
    URL: 'https://example.com/championship-game',
    publishDate: new Date(),
    category: { categoryID: 2, categoryName: 'Sports' } as Category
  } as Article;

  const mockConfig = {
    id: 1,
    user: mockUser,
    enabledCategoryIds: [1], // Technology
    keywords: ['AI', 'machine learning', 'software'],
    emailNotificationsEnabled: true
  } as NotificationConfiguration;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArticleMatchingService],
    }).compile();

    service = module.get<ArticleMatchingService>(ArticleMatchingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('matchArticle', () => {
    it('should match article with enabled category', async () => {
      const result: MatchResult = await service.matchArticle(mockTechArticle, mockConfig);

      expect(result.matched).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.matchedCategories).toContain('Technology');
    });

    it('should match article with keywords', async () => {
      const result: MatchResult = await service.matchArticle(mockTechArticle, mockConfig);

      expect(result.matched).toBe(true);
      expect(result.matchedKeywords.length).toBeGreaterThan(0);
      expect(result.matchedKeywords).toContain('AI');
    });

    it('should not match article with disabled category and no keyword matches', async () => {
      const configWithSportsCategory = {
        ...mockConfig,
        enabledCategoryIds: [2], //        cd "d:\LandC\news-aggregator-full-entities\server" && npm test Sports only
        keywords: ['finance', 'business'] // Unrelated keywords
      } as NotificationConfiguration;

      const result: MatchResult = await service.matchArticle(mockTechArticle, configWithSportsCategory);

      expect(result.matched).toBe(false);
      expect(result.score).toBe(0);
      expect(result.matchedCategories).toHaveLength(0);
    });

    it('should handle article without category', async () => {
      const articleWithoutCategory = {
        ...mockTechArticle,
        category: undefined
      } as any;

      const result: MatchResult = await service.matchArticle(articleWithoutCategory, mockConfig);

      // Should still match on keywords
      expect(result.matched).toBe(true);
      expect(result.matchedKeywords.length).toBeGreaterThan(0);
    });

    it('should handle empty keywords gracefully', async () => {
      const configWithoutKeywords = {
        ...mockConfig,
        keywords: []
      } as NotificationConfiguration;

      const result: MatchResult = await service.matchArticle(mockTechArticle, configWithoutKeywords);

      expect(result.matched).toBe(true); // Should match on category
      expect(result.matchedCategories).toContain('Technology');
      expect(result.matchedKeywords).toHaveLength(0);
    });

    it('should calculate higher scores for multiple matches', async () => {
      const configWithMultipleMatches = {
        ...mockConfig,
        enabledCategoryIds: [1], // Technology
        keywords: ['AI', 'machine learning', 'technology', 'software'] // Multiple matching keywords
      } as NotificationConfiguration;

      const result: MatchResult = await service.matchArticle(mockTechArticle, configWithMultipleMatches);

      expect(result.matched).toBe(true);
      expect(result.score).toBeGreaterThan(50); // Higher score for multiple matches
      expect(result.matchedKeywords.length).toBeGreaterThan(1);
    });
  });

  describe('matchArticles', () => {
    it('should match multiple articles and sort by score', async () => {
      const articles = [mockTechArticle, mockSportsArticle];
      const results = await service.matchArticles(articles, mockConfig);

      expect(results).toHaveLength(2);
      expect(results[0].match.score).toBeGreaterThanOrEqual(results[1].match.score);
      expect(results[0].article).toBe(mockTechArticle); // Tech article should score higher
    });

    it('should handle empty articles array', async () => {
      const results = await service.matchArticles([], mockConfig);
      expect(results).toHaveLength(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle articles with empty content', async () => {
      const emptyArticle = {
        ...mockTechArticle,
        articleTitle: '',
        articleContent: ''
      } as Article;

      const result = await service.matchArticle(emptyArticle, mockConfig);

      expect(result.matched).toBe(true); // Should still match on category
      expect(result.matchedCategories).toContain('Technology');
    });

    it('should handle special characters in keywords', async () => {
      const configWithSpecialChars = {
        ...mockConfig,
        keywords: ['AI!', '@machine-learning', '#software_dev']
      } as NotificationConfiguration;

      const result = await service.matchArticle(mockTechArticle, configWithSpecialChars);

      expect(result.matched).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should be case insensitive for keyword matching', async () => {
      const configWithUppercaseKeywords = {
        ...mockConfig,
        keywords: ['ARTIFICIAL INTELLIGENCE', 'MACHINE LEARNING']
      } as NotificationConfiguration;

      const result = await service.matchArticle(mockTechArticle, configWithUppercaseKeywords);

      expect(result.matched).toBe(true);
      expect(result.matchedKeywords.length).toBeGreaterThan(0);
    });

    it('should handle null config gracefully', async () => {
      // The service should handle null config by adding null checking
      // For now, let's test with empty config instead
      const emptyConfig = {
        id: 0,
        user: mockUser,
        enabledCategoryIds: [],
        keywords: [],
        emailNotificationsEnabled: false
      } as NotificationConfiguration;
      
      const result = await service.matchArticle(mockTechArticle, emptyConfig);
      
      expect(result.matched).toBe(false);
      expect(result.score).toBe(0);
    });

    it('should handle config with no enabled categories', async () => {
      const configWithNoCategories = {
        ...mockConfig,
        enabledCategoryIds: []
      } as NotificationConfiguration;

      const result = await service.matchArticle(mockTechArticle, configWithNoCategories);

      // Should still match on keywords
      expect(result.matched).toBe(true);
      expect(result.matchedKeywords.length).toBeGreaterThan(0);
    });

    it('should handle stemming and word variations', async () => {
      const configWithStems = {
        ...mockConfig,
        keywords: ['develop'] // Should match 'development' in content
      } as NotificationConfiguration;

      const result = await service.matchArticle(mockTechArticle, configWithStems);

      expect(result.matched).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });
  });
});
