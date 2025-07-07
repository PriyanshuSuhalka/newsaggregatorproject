import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserHistoryService } from './user-history.service';
import { UserHistory } from './user-history.entity';
import { User } from '../users/user.entity';
import { Article } from '../articles/article.entity';
import { Category } from '../categories/category.entity';
import { ExternalAPI } from '../externalapi/external-api.entity';

describe('UserHistoryService', () => {
  let service: UserHistoryService;
  let repository: Repository<UserHistory>;

  const mockUserHistoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserHistoryService,
        {
          provide: getRepositoryToken(UserHistory),
          useValue: mockUserHistoryRepository,
        },
      ],
    }).compile();

    service = module.get<UserHistoryService>(UserHistoryService);
    repository = module.get<Repository<UserHistory>>(getRepositoryToken(UserHistory));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addArticleToHistory', () => {
    it('should add an article to user history', async () => {
      // Arrange
      const mockUser = new User();
      mockUser.userID = 1;
      mockUser.name = 'Test User';
      mockUser.email = 'test@example.com';

      const mockCategory = new Category();
      mockCategory.categoryID = 1;
      mockCategory.categoryName = 'Technology';

      const mockExternalAPI = new ExternalAPI();
      mockExternalAPI.externalAPIID = 1;
      mockExternalAPI.name = 'Test API';

      const mockArticle = new Article();
      mockArticle.articleID = 1;
      mockArticle.articleTitle = 'Test Article';
      mockArticle.articleContent = 'Test content';
      mockArticle.source = 'Test Source';
      mockArticle.URL = 'http://test.com';
      mockArticle.publishDate = new Date();
      mockArticle.isHidden = false;
      mockArticle.category = mockCategory;
      mockArticle.externalAPI = mockExternalAPI;

      const mockHistoryEntry = new UserHistory();
      mockHistoryEntry.id = 1;
      mockHistoryEntry.user = mockUser;
      mockHistoryEntry.article = mockArticle;

      mockUserHistoryRepository.create.mockReturnValue(mockHistoryEntry);
      mockUserHistoryRepository.save.mockResolvedValue(mockHistoryEntry);

      // Act
      const result = await service.addArticleToHistory(mockUser, mockArticle);

      // Assert
      expect(mockUserHistoryRepository.create).toHaveBeenCalledWith({ 
        user: mockUser, 
        article: mockArticle 
      });
      expect(mockUserHistoryRepository.save).toHaveBeenCalledWith(mockHistoryEntry);
      expect(result).toBe(mockHistoryEntry);
    });

    it('should handle errors when saving fails', async () => {
      // Arrange
      const mockUser = new User();
      const mockArticle = new Article();
      const mockHistoryEntry = new UserHistory();

      mockUserHistoryRepository.create.mockReturnValue(mockHistoryEntry);
      mockUserHistoryRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.addArticleToHistory(mockUser, mockArticle))
        .rejects.toThrow('Database error');
    });
  });

  describe('getHistoryForUser', () => {
    it('should return user history for a given user', async () => {
      // Arrange
      const mockUser = new User();
      mockUser.userID = 1;

      const mockHistoryEntries = [
        { id: 1, user: mockUser, article: { articleID: 1 } },
        { id: 2, user: mockUser, article: { articleID: 2 } },
      ] as UserHistory[];

      mockUserHistoryRepository.find.mockResolvedValue(mockHistoryEntries);

      // Act
      const result = await service.getHistoryForUser(mockUser);

      // Assert
      expect(mockUserHistoryRepository.find).toHaveBeenCalledWith({ 
        where: { user: mockUser } 
      });
      expect(result).toBe(mockHistoryEntries);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when user has no history', async () => {
      // Arrange
      const mockUser = new User();
      mockUser.userID = 1;

      mockUserHistoryRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.getHistoryForUser(mockUser);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockUser = new User();
      mockUserHistoryRepository.find.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(service.getHistoryForUser(mockUser))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('edge cases', () => {
    it('should handle null user gracefully', async () => {
      // Arrange
      const mockArticle = new Article();
      
      // Act & Assert
      await expect(service.addArticleToHistory(null as any, mockArticle))
        .rejects.toThrow();
    });

    it('should handle null article gracefully', async () => {
      // Arrange
      const mockUser = new User();
      
      // Act & Assert
      await expect(service.addArticleToHistory(mockUser, null as any))
        .rejects.toThrow();
    });
  });
});
