import { Test, TestingModule } from '@nestjs/testing';
import { PersonalizationService } from './personalization.service';
import { KeywordService } from '../keywords/keyword.service';
import { SavedArticleService } from '../savedarticles/saved-article.service';
import { UserHistoryService } from '../userhistory/user-history.service';
import { ArticleLikeService } from '../articlelikes/article-like.service';
import { NotificationConfigService } from '../notificationconfig/notification-config.service';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';
import { Category } from '../categories/category.entity';
import { ExternalAPI } from '../externalapi/external-api.entity';
import { NotificationConfiguration } from '../notificationconfig/notification-config.entity';
import { ArticleLike, LikeType } from '../articlelikes/article-like.entity';
import { SavedArticle } from '../savedarticles/saved-article.entity';
import { UserHistory } from '../userhistory/user-history.entity';

describe('PersonalizationService', () => {
  let service: PersonalizationService;
  let keywordService: KeywordService;
  let savedArticleService: SavedArticleService;
  let userHistoryService: UserHistoryService;
  let articleLikeService: ArticleLikeService;
  let notificationConfigService: NotificationConfigService;

  const mockKeywordService = {
    getKeywordsForUser: jest.fn(),
  };

  const mockSavedArticleService = {
    getSavedArticles: jest.fn(),
  };

  const mockUserHistoryService = {
    getHistoryForUser: jest.fn(),
  };

  const mockArticleLikeService = {
    getLikesForUser: jest.fn(),
  };

  const mockNotificationConfigService = {
    getNotificationConfigForUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalizationService,
        {
          provide: KeywordService,
          useValue: mockKeywordService,
        },
        {
          provide: SavedArticleService,
          useValue: mockSavedArticleService,
        },
        {
          provide: UserHistoryService,
          useValue: mockUserHistoryService,
        },
        {
          provide: ArticleLikeService,
          useValue: mockArticleLikeService,
        },
        {
          provide: NotificationConfigService,
          useValue: mockNotificationConfigService,
        },
      ],
    }).compile();

    service = module.get<PersonalizationService>(PersonalizationService);
    keywordService = module.get<KeywordService>(KeywordService);
    savedArticleService = module.get<SavedArticleService>(SavedArticleService);
    userHistoryService = module.get<UserHistoryService>(UserHistoryService);
    articleLikeService = module.get<ArticleLikeService>(ArticleLikeService);
    notificationConfigService = module.get<NotificationConfigService>(NotificationConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create mock objects
  const createMockUser = (id: number = 1): User => {
    const user = new User();
    user.userID = id;
    user.name = 'Test User';
    user.email = 'test@example.com';
    return user;
  };

  const createMockCategory = (id: number = 1, name: string = 'Technology'): Category => {
    const category = new Category();
    category.categoryID = id;
    category.categoryName = name;
    return category;
  };

  const createMockExternalAPI = (id: number = 1): ExternalAPI => {
    const api = new ExternalAPI();
    api.externalAPIID = id;
    api.name = 'Test API';
    return api;
  };

  const createMockArticle = (
    id: number = 1,
    title: string = 'Test Article',
    content: string = 'Test content',
    source: string = 'Test Source',
    category?: Category
  ): Article => {
    const article = new Article();
    article.articleID = id;
    article.articleTitle = title;
    article.articleContent = content;
    article.source = source;
    article.URL = 'http://test.com';
    article.publishDate = new Date();
    article.isHidden = false;
    article.category = category || createMockCategory();
    article.externalAPI = createMockExternalAPI();
    return article;
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculatePersonalizationScore', () => {
    describe('category matching', () => {
      it('should give 10 points for matching category', async () => {
        // Arrange
        const user = createMockUser();
        const category = createMockCategory(1, 'Technology');
        const article = createMockArticle(1, 'Tech Article', 'Tech content', 'TechSource', category);

        const mockConfig = new NotificationConfiguration();
        mockConfig.enabledCategoryIds = [1]; // Matching category
        mockConfig.keywords = [];

        mockNotificationConfigService.getNotificationConfigForUser.mockResolvedValue(mockConfig);
        mockArticleLikeService.getLikesForUser.mockResolvedValue([]);
        mockSavedArticleService.getSavedArticles.mockResolvedValue([]);
        mockUserHistoryService.getHistoryForUser.mockResolvedValue([]);

        // Act
        const score = await service.calculatePersonalizationScore(article, user);

        // Assert
        expect(score).toBe(10);
      });

      it('should give 0 points for non-matching category', async () => {
        // Arrange
        const user = createMockUser();
        const category = createMockCategory(2, 'Sports');
        const article = createMockArticle(1, 'Sports Article', 'Sports content', 'SportsSource', category);

        const mockConfig = new NotificationConfiguration();
        mockConfig.enabledCategoryIds = [1]; // Different category
        mockConfig.keywords = [];

        mockNotificationConfigService.getNotificationConfigForUser.mockResolvedValue(mockConfig);
        mockArticleLikeService.getLikesForUser.mockResolvedValue([]);
        mockSavedArticleService.getSavedArticles.mockResolvedValue([]);
        mockUserHistoryService.getHistoryForUser.mockResolvedValue([]);

        // Act
        const score = await service.calculatePersonalizationScore(article, user);

        // Assert
        expect(score).toBe(0);
      });
    });

    describe('keyword matching', () => {
      it('should give 5 points per keyword match in title', async () => {
        // Arrange
        const user = createMockUser();
        const article = createMockArticle(1, 'Machine Learning Article', 'Content about AI');

        const mockConfig = new NotificationConfiguration();
        mockConfig.enabledCategoryIds = [];
        mockConfig.keywords = ['machine', 'learning'];

        mockNotificationConfigService.getNotificationConfigForUser.mockResolvedValue(mockConfig);
        mockArticleLikeService.getLikesForUser.mockResolvedValue([]);
        mockSavedArticleService.getSavedArticles.mockResolvedValue([]);
        mockUserHistoryService.getHistoryForUser.mockResolvedValue([]);

        // Act
        const score = await service.calculatePersonalizationScore(article, user);

        // Assert
        expect(score).toBe(10); // 5 points each for 'machine' and 'learning'
      });

      it('should give 5 points per keyword match in content', async () => {
        // Arrange
        const user = createMockUser();
        const article = createMockArticle(1, 'AI Article', 'This article discusses artificial intelligence and neural networks');

        const mockConfig = new NotificationConfiguration();
        mockConfig.enabledCategoryIds = [];
        mockConfig.keywords = ['artificial', 'neural'];

        mockNotificationConfigService.getNotificationConfigForUser.mockResolvedValue(mockConfig);
        mockArticleLikeService.getLikesForUser.mockResolvedValue([]);
        mockSavedArticleService.getSavedArticles.mockResolvedValue([]);
        mockUserHistoryService.getHistoryForUser.mockResolvedValue([]);

        // Act
        const score = await service.calculatePersonalizationScore(article, user);

        // Assert
        expect(score).toBe(10); // 5 points each for 'artificial' and 'neural'
      });

      it('should not double count keywords found in both title and content', async () => {
        // Arrange
        const user = createMockUser();
        const article = createMockArticle(1, 'AI Article', 'This article about AI is interesting');

        const mockConfig = new NotificationConfiguration();
        mockConfig.enabledCategoryIds = [];
        mockConfig.keywords = ['AI'];

        mockNotificationConfigService.getNotificationConfigForUser.mockResolvedValue(mockConfig);
        mockArticleLikeService.getLikesForUser.mockResolvedValue([]);
        mockSavedArticleService.getSavedArticles.mockResolvedValue([]);
        mockUserHistoryService.getHistoryForUser.mockResolvedValue([]);

        // Act
        const score = await service.calculatePersonalizationScore(article, user);

        // Assert
        expect(score).toBe(5); // Should not double count - only 5 points for one keyword
      });
    });

    describe('liked articles matching', () => {
      it('should give 15 points for articles from liked sources', async () => {
        // Arrange
        const user = createMockUser();
        const article = createMockArticle(1, 'Test Article', 'Content', 'TechCrunch');

        const mockLikedArticle = createMockArticle(2, 'Previous Article', 'Previous content', 'TechCrunch');
        const mockArticleLike = new ArticleLike();
        mockArticleLike.article = mockLikedArticle;
        mockArticleLike.likeType = LikeType.LIKE;

        mockNotificationConfigService.getNotificationConfigForUser.mockResolvedValue(null);
        mockArticleLikeService.getLikesForUser.mockResolvedValue([mockArticleLike]);
        mockSavedArticleService.getSavedArticles.mockResolvedValue([]);
        mockUserHistoryService.getHistoryForUser.mockResolvedValue([]);

        // Act
        const score = await service.calculatePersonalizationScore(article, user);

        // Assert
        expect(score).toBe(15);
      });

      it('should give 0 points for articles from non-liked sources', async () => {
        // Arrange
        const user = createMockUser();
        const article = createMockArticle(1, 'Test Article', 'Content', 'CNN');

        const mockLikedArticle = createMockArticle(2, 'Previous Article', 'Previous content', 'TechCrunch');
        const mockArticleLike = new ArticleLike();
        mockArticleLike.article = mockLikedArticle;

        mockNotificationConfigService.getNotificationConfigForUser.mockResolvedValue(null);
        mockArticleLikeService.getLikesForUser.mockResolvedValue([mockArticleLike]);
        mockSavedArticleService.getSavedArticles.mockResolvedValue([]);
        mockUserHistoryService.getHistoryForUser.mockResolvedValue([]);

        // Act
        const score = await service.calculatePersonalizationScore(article, user);

        // Assert
        expect(score).toBe(0);
      });
    });

    describe('saved articles matching', () => {
      it('should give 15 points for articles from saved sources', async () => {
        // Arrange
        const user = createMockUser();
        const article = createMockArticle(1, 'Test Article', 'Content', 'BBC');

        const mockSavedArticle = new SavedArticle();
        mockSavedArticle.article = createMockArticle(2, 'Saved Article', 'Saved content', 'BBC');

        mockNotificationConfigService.getNotificationConfigForUser.mockResolvedValue(null);
        mockArticleLikeService.getLikesForUser.mockResolvedValue([]);
        mockSavedArticleService.getSavedArticles.mockResolvedValue([mockSavedArticle]);
        mockUserHistoryService.getHistoryForUser.mockResolvedValue([]);

        // Act
        const score = await service.calculatePersonalizationScore(article, user);

        // Assert
        expect(score).toBe(15);
      });
    });

    describe('user history matching', () => {
      it('should give 5 points for articles from previously read sources', async () => {
        // Arrange
        const user = createMockUser();
        const article = createMockArticle(1, 'Test Article', 'Content', 'Reuters');

        const mockHistoryEntry = new UserHistory();
        mockHistoryEntry.article = createMockArticle(2, 'Read Article', 'Read content', 'Reuters');

        mockNotificationConfigService.getNotificationConfigForUser.mockResolvedValue(null);
        mockArticleLikeService.getLikesForUser.mockResolvedValue([]);
        mockSavedArticleService.getSavedArticles.mockResolvedValue([]);
        mockUserHistoryService.getHistoryForUser.mockResolvedValue([mockHistoryEntry]);

        // Act
        const score = await service.calculatePersonalizationScore(article, user);

        // Assert
        expect(score).toBe(5);
      });
    });

    describe('combined scoring', () => {
      it('should combine all scoring factors correctly', async () => {
        // Arrange
        const user = createMockUser();
        const category = createMockCategory(1, 'Technology');
        const article = createMockArticle(1, 'AI Machine Learning', 'Artificial intelligence content', 'TechCrunch', category);

        // Mock notification config with matching category and keywords
        const mockConfig = new NotificationConfiguration();
        mockConfig.enabledCategoryIds = [1]; // +10 points
        mockConfig.keywords = ['AI', 'machine']; // +10 points (5 each)

        // Mock liked article from same source
        const mockLikedArticle = createMockArticle(2, 'Previous', 'Content', 'TechCrunch');
        const mockArticleLike = new ArticleLike();
        mockArticleLike.article = mockLikedArticle;

        // Mock saved article from same source
        const mockSavedArticle = new SavedArticle();
        mockSavedArticle.article = createMockArticle(3, 'Saved', 'Content', 'TechCrunch');

        // Mock history from same source
        const mockHistoryEntry = new UserHistory();
        mockHistoryEntry.article = createMockArticle(4, 'Read', 'Content', 'TechCrunch');

        mockNotificationConfigService.getNotificationConfigForUser.mockResolvedValue(mockConfig);
        mockArticleLikeService.getLikesForUser.mockResolvedValue([mockArticleLike]);
        mockSavedArticleService.getSavedArticles.mockResolvedValue([mockSavedArticle]);
        mockUserHistoryService.getHistoryForUser.mockResolvedValue([mockHistoryEntry]);

        // Act
        const score = await service.calculatePersonalizationScore(article, user);

        // Assert
        // 10 (category) + 10 (keywords) + 15 (liked) + 15 (saved) + 5 (history) = 55
        expect(score).toBe(55);
      });

      it('should return 0 for new user with no preferences', async () => {
        // Arrange
        const user = createMockUser();
        const article = createMockArticle();

        mockNotificationConfigService.getNotificationConfigForUser.mockResolvedValue(null);
        mockArticleLikeService.getLikesForUser.mockResolvedValue([]);
        mockSavedArticleService.getSavedArticles.mockResolvedValue([]);
        mockUserHistoryService.getHistoryForUser.mockResolvedValue([]);

        // Act
        const score = await service.calculatePersonalizationScore(article, user);

        // Assert
        expect(score).toBe(0);
      });
    });

    describe('error handling', () => {
      it('should handle null notification config gracefully', async () => {
        // Arrange
        const user = createMockUser();
        const article = createMockArticle();

        mockNotificationConfigService.getNotificationConfigForUser.mockResolvedValue(null);
        mockArticleLikeService.getLikesForUser.mockResolvedValue([]);
        mockSavedArticleService.getSavedArticles.mockResolvedValue([]);
        mockUserHistoryService.getHistoryForUser.mockResolvedValue([]);

        // Act
        const score = await service.calculatePersonalizationScore(article, user);

        // Assert
        expect(score).toBe(0);
      });

      it('should handle service errors gracefully', async () => {
        // Arrange
        const user = createMockUser();
        const article = createMockArticle();

        mockNotificationConfigService.getNotificationConfigForUser.mockRejectedValue(new Error('Service error'));

        // Act & Assert
        await expect(service.calculatePersonalizationScore(article, user))
          .rejects.toThrow('Service error');
      });

      it('should handle empty arrays from services', async () => {
        // Arrange
        const user = createMockUser();
        const article = createMockArticle();

        const mockConfig = new NotificationConfiguration();
        mockConfig.enabledCategoryIds = [];
        mockConfig.keywords = [];

        mockNotificationConfigService.getNotificationConfigForUser.mockResolvedValue(mockConfig);
        mockArticleLikeService.getLikesForUser.mockResolvedValue([]);
        mockSavedArticleService.getSavedArticles.mockResolvedValue([]);
        mockUserHistoryService.getHistoryForUser.mockResolvedValue([]);

        // Act
        const score = await service.calculatePersonalizationScore(article, user);

        // Assert
        expect(score).toBe(0);
      });
    });

    describe('performance considerations', () => {
      it('should handle large numbers of user preferences efficiently', async () => {
        // Arrange
        const user = createMockUser();
        const article = createMockArticle(1, 'Test Article', 'Test content with many keywords like AI machine learning deep neural networks', 'TechSource');

        const mockConfig = new NotificationConfiguration();
        mockConfig.enabledCategoryIds = [1];
        // Create many keywords
        mockConfig.keywords = Array.from({ length: 100 }, (_, i) => `keyword${i}`);
        mockConfig.keywords.push('AI', 'machine', 'learning'); // Add some that match

        mockNotificationConfigService.getNotificationConfigForUser.mockResolvedValue(mockConfig);
        mockArticleLikeService.getLikesForUser.mockResolvedValue([]);
        mockSavedArticleService.getSavedArticles.mockResolvedValue([]);
        mockUserHistoryService.getHistoryForUser.mockResolvedValue([]);

        // Act
        const startTime = Date.now();
        const score = await service.calculatePersonalizationScore(article, user);
        const endTime = Date.now();

        // Assert
        expect(score).toBeGreaterThan(0); // Should get points for matching keywords
        expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
      });
    });
  });
});
