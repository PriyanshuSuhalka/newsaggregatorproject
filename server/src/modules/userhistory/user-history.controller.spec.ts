import { Test, TestingModule } from '@nestjs/testing';
import { UserHistoryController } from './user-history.controller';
import { UserHistoryService } from './user-history.service';
import { ArticleService } from '../articles/article.service';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';
import { UserHistory } from './user-history.entity';

describe('UserHistoryController', () => {
  let controller: UserHistoryController;
  let userHistoryService: UserHistoryService;
  let articleService: ArticleService;

  const mockUserHistoryService = {
    addArticleToHistory: jest.fn(),
    getHistoryForUser: jest.fn(),
  };

  const mockArticleService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserHistoryController],
      providers: [
        {
          provide: UserHistoryService,
          useValue: mockUserHistoryService,
        },
        {
          provide: ArticleService,
          useValue: mockArticleService,
        },
      ],
    }).compile();

    controller = module.get<UserHistoryController>(UserHistoryController);
    userHistoryService = module.get<UserHistoryService>(UserHistoryService);
    articleService = module.get<ArticleService>(ArticleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addArticleToHistory', () => {
    it('should add an article to user history successfully', async () => {
      // Arrange
      const articleId = 1;
      const mockUser = new User();
      mockUser.userID = 1;
      mockUser.name = 'Test User';
      mockUser.email = 'test@example.com';

      const mockArticle = new Article();
      mockArticle.articleID = articleId;
      mockArticle.articleTitle = 'Test Article';

      const mockHistoryEntry = new UserHistory();
      mockHistoryEntry.id = 1;
      mockHistoryEntry.user = mockUser;
      mockHistoryEntry.article = mockArticle;

      const mockRequest = { user: mockUser };

      mockArticleService.findOne.mockResolvedValue(mockArticle);
      mockUserHistoryService.addArticleToHistory.mockResolvedValue(mockHistoryEntry);

      // Act
      const result = await controller.addArticleToHistory(articleId, mockRequest);

      // Assert
      expect(mockArticleService.findOne).toHaveBeenCalledWith(articleId);
      expect(mockUserHistoryService.addArticleToHistory).toHaveBeenCalledWith(mockUser, mockArticle);
      expect(result).toBe(mockHistoryEntry);
    });

    it('should throw error when article is not found', async () => {
      // Arrange
      const articleId = 999;
      const mockUser = new User();
      const mockRequest = { user: mockUser };

      mockArticleService.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.addArticleToHistory(articleId, mockRequest))
        .rejects.toThrow('Article not found');

      expect(mockArticleService.findOne).toHaveBeenCalledWith(articleId);
      expect(mockUserHistoryService.addArticleToHistory).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      const articleId = 1;
      const mockUser = new User();
      const mockArticle = new Article();
      const mockRequest = { user: mockUser };

      mockArticleService.findOne.mockResolvedValue(mockArticle);
      mockUserHistoryService.addArticleToHistory.mockRejectedValue(new Error('Service error'));

      // Act & Assert
      await expect(controller.addArticleToHistory(articleId, mockRequest))
        .rejects.toThrow('Service error');
    });

    it('should handle invalid article ID', async () => {
      // Arrange
      const invalidArticleId = 'invalid' as any;
      const mockUser = new User();
      const mockRequest = { user: mockUser };

      // Act & Assert
      await expect(controller.addArticleToHistory(invalidArticleId, mockRequest))
        .rejects.toThrow();
    });

    it('should handle missing user in request', async () => {
      // Arrange
      const articleId = 1;
      const mockArticle = new Article();
      const mockRequest = { user: undefined };

      mockArticleService.findOne.mockResolvedValue(mockArticle);

      // Act & Assert
      await expect(controller.addArticleToHistory(articleId, mockRequest))
        .rejects.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle concurrent requests for the same user', async () => {
      // Arrange
      const articleId1 = 1;
      const articleId2 = 2;
      const mockUser = new User();
      const mockRequest = { user: mockUser };

      const mockArticle1 = new Article();
      mockArticle1.articleID = articleId1;
      const mockArticle2 = new Article();
      mockArticle2.articleID = articleId2;

      const mockHistoryEntry1 = new UserHistory();
      const mockHistoryEntry2 = new UserHistory();

      mockArticleService.findOne
        .mockResolvedValueOnce(mockArticle1)
        .mockResolvedValueOnce(mockArticle2);
      
      mockUserHistoryService.addArticleToHistory
        .mockResolvedValueOnce(mockHistoryEntry1)
        .mockResolvedValueOnce(mockHistoryEntry2);

      // Act
      const [result1, result2] = await Promise.all([
        controller.addArticleToHistory(articleId1, mockRequest),
        controller.addArticleToHistory(articleId2, mockRequest),
      ]);

      // Assert
      expect(result1).toBe(mockHistoryEntry1);
      expect(result2).toBe(mockHistoryEntry2);
      expect(mockUserHistoryService.addArticleToHistory).toHaveBeenCalledTimes(2);
    });

    it('should handle duplicate article history addition', async () => {
      // Arrange
      const articleId = 1;
      const mockUser = new User();
      const mockArticle = new Article();
      const mockRequest = { user: mockUser };

      mockArticleService.findOne.mockResolvedValue(mockArticle);
      mockUserHistoryService.addArticleToHistory.mockResolvedValue(new UserHistory());

      // Act - Add the same article twice
      await controller.addArticleToHistory(articleId, mockRequest);
      await controller.addArticleToHistory(articleId, mockRequest);

      // Assert
      expect(mockUserHistoryService.addArticleToHistory).toHaveBeenCalledTimes(2);
      expect(mockUserHistoryService.addArticleToHistory).toHaveBeenCalledWith(mockUser, mockArticle);
    });
  });
});
