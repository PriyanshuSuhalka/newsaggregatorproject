import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationOrchestrationService, NotificationResult } from './notification-orchestration.service';
import { Notification } from './notification.entity';
import { NotificationConfiguration } from '@modules/notificationconfig/notification-config.entity';
import { User } from '@modules/users/user.entity';
import { Article } from '@modules/articles/article.entity';
import { Category } from '@modules/categories/category.entity';
import { ArticleMatchingService, MatchResult } from '@modules/matching/article-matching.service';
import { MailHelperService } from '@modules/mailer/mailer.service';

describe('NotificationOrchestrationService', () => {
  let service: NotificationOrchestrationService;
  let notificationRepo: Repository<Notification>;
  let configRepo: Repository<NotificationConfiguration>;
  let userRepo: Repository<User>;
  let matchingService: ArticleMatchingService;
  let mailHelper: MailHelperService;

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

  const mockArticle = {
    articleID: 1,
    articleTitle: 'AI Technology Breakthrough',
    articleContent: 'New artificial intelligence breakthrough in machine learning technology.',
    source: 'TechNews',
    URL: 'https://example.com/ai-news',
    publishDate: new Date(),
    category: mockCategory
  } as Article;

  const mockConfig = {
    id: 1,
    user: mockUser,
    enabledCategoryIds: [1],
    keywords: ['AI', 'technology'],
    emailNotificationsEnabled: true
  } as NotificationConfiguration;

  const mockMatchResult: MatchResult = {
    matched: true,
    score: 75,
    reasons: ['Category match', 'Keyword match'],
    matchedCategories: ['Technology'],
    matchedKeywords: ['AI', 'technology']
  };

  const mockNotificationRepo = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockConfigRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getMany: jest.fn()
    })
  };

  const mockUserRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockMatchingService = {
    matchArticle: jest.fn(),
    matchArticles: jest.fn(),
  };

  const mockMailHelper = {
    sendArticleNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationOrchestrationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepo,
        },
        {
          provide: getRepositoryToken(NotificationConfiguration),
          useValue: mockConfigRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: ArticleMatchingService,
          useValue: mockMatchingService,
        },
        {
          provide: MailHelperService,
          useValue: mockMailHelper,
        },
      ],
    }).compile();

    service = module.get<NotificationOrchestrationService>(NotificationOrchestrationService);
    notificationRepo = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    configRepo = module.get<Repository<NotificationConfiguration>>(getRepositoryToken(NotificationConfiguration));
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    matchingService = module.get<ArticleMatchingService>(ArticleMatchingService);
    mailHelper = module.get<MailHelperService>(MailHelperService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('notifyUsersForArticle', () => {
    beforeEach(() => {
      // Set up the query builder chain for getAllUserConfigurations
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockConfig])
      };
      mockConfigRepo.createQueryBuilder.mockReturnValue(queryBuilder);
    });

    it('should process new article and send notifications', async () => {
      mockMatchingService.matchArticle.mockResolvedValue(mockMatchResult);
      mockNotificationRepo.save.mockResolvedValue({});
      mockConfigRepo.findOne.mockResolvedValue(mockConfig); // For getUserConfiguration
      mockMailHelper.sendArticleNotification.mockResolvedValue(undefined);

      const result: NotificationResult = await service.notifyUsersForArticle(mockArticle);

      expect(result.totalNotificationsSent).toBe(1);
      expect(result.totalEmailsSent).toBe(1);
      expect(result.userNotifications).toHaveLength(1);
      expect(result.userNotifications[0].userId).toBe(mockUser.userID);
      expect(result.userNotifications[0].notificationSent).toBe(true);
      expect(result.userNotifications[0].emailSent).toBe(true);
    });

    it('should skip users with no matching configuration', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]) // No configs
      };
      mockConfigRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      const result: NotificationResult = await service.notifyUsersForArticle(mockArticle);

      expect(result.totalNotificationsSent).toBe(0);
      expect(result.totalEmailsSent).toBe(0);
      expect(result.userNotifications).toHaveLength(0);
    });

    it('should skip users when article does not match', async () => {
      const noMatchResult: MatchResult = {
        matched: false,
        score: 0,
        reasons: [],
        matchedCategories: [],
        matchedKeywords: []
      };

      mockMatchingService.matchArticle.mockResolvedValue(noMatchResult);

      const result: NotificationResult = await service.notifyUsersForArticle(mockArticle);

      expect(result.totalNotificationsSent).toBe(0);
      expect(result.totalEmailsSent).toBe(0);
      expect(result.userNotifications).toHaveLength(0);
    });

    it('should handle notification creation failure gracefully', async () => {
      mockMatchingService.matchArticle.mockResolvedValue(mockMatchResult);
      mockNotificationRepo.save.mockRejectedValue(new Error('Database error'));
      mockConfigRepo.findOne.mockResolvedValue(mockConfig); // For getUserConfiguration
      mockMailHelper.sendArticleNotification.mockResolvedValue(undefined);

      const result: NotificationResult = await service.notifyUsersForArticle(mockArticle);

      expect(result.totalNotificationsSent).toBe(0);
      expect(result.totalEmailsSent).toBe(1); // Email should still be sent
      expect(result.userNotifications[0].notificationSent).toBe(false);
      expect(result.userNotifications[0].emailSent).toBe(true);
    });

    it('should handle email sending failure gracefully', async () => {
      mockMatchingService.matchArticle.mockResolvedValue(mockMatchResult);
      mockNotificationRepo.save.mockResolvedValue({});
      mockMailHelper.sendArticleNotification.mockRejectedValue(new Error('Email error'));

      const result: NotificationResult = await service.notifyUsersForArticle(mockArticle);

      expect(result.totalNotificationsSent).toBe(1);
      expect(result.totalEmailsSent).toBe(0);
      expect(result.userNotifications[0].notificationSent).toBe(true);
      expect(result.userNotifications[0].emailSent).toBe(false);
    });

    it('should respect user email notification preferences', async () => {
      const configWithEmailDisabled = {
        ...mockConfig,
        emailNotificationsEnabled: false
      };

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([configWithEmailDisabled])
      };
      mockConfigRepo.createQueryBuilder.mockReturnValue(queryBuilder);
      
      mockMatchingService.matchArticle.mockResolvedValue(mockMatchResult);
      mockNotificationRepo.save.mockResolvedValue({});
      mockConfigRepo.findOne.mockResolvedValue(configWithEmailDisabled); // For getUserConfiguration

      const result: NotificationResult = await service.notifyUsersForArticle(mockArticle);

      expect(result.totalNotificationsSent).toBe(1);
      expect(result.totalEmailsSent).toBe(0);
      expect(result.userNotifications[0].notificationSent).toBe(true);
      expect(result.userNotifications[0].emailSent).toBe(false);
      expect(mockMailHelper.sendArticleNotification).not.toHaveBeenCalled();
    });

    it('should handle articles without category', async () => {
      const articleWithoutCategory = {
        ...mockArticle,
        category: undefined
      } as any;

      const result: NotificationResult = await service.notifyUsersForArticle(articleWithoutCategory);

      expect(result.totalNotificationsSent).toBe(0);
      expect(result.totalEmailsSent).toBe(0);
      expect(result.userNotifications).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle null article gracefully', async () => {
      const result = await service.notifyUsersForArticle(null as any);

      expect(result.totalNotificationsSent).toBe(0);
      expect(result.totalEmailsSent).toBe(0);
      expect(result.userNotifications).toHaveLength(0);
    });

    it('should handle database connection errors', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      };
      mockConfigRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.notifyUsersForArticle(mockArticle);

      expect(result.totalNotificationsSent).toBe(0);
      expect(result.totalEmailsSent).toBe(0);
    });

    it('should handle matching service errors', async () => {
      mockConfigRepo.find.mockResolvedValue([mockConfig]);
      mockMatchingService.matchArticle.mockRejectedValue(new Error('Matching service error'));

      const result = await service.notifyUsersForArticle(mockArticle);

      expect(result.totalNotificationsSent).toBe(0);
      expect(result.totalEmailsSent).toBe(0);
    });

    it('should handle multiple users with different match scores', async () => {
      const user2 = { ...mockUser, userID: 2, email: 'user2@example.com' };
      const config2 = { ...mockConfig, id: 2, user: user2 };
      
      const highMatchResult = { ...mockMatchResult, score: 85 };
      const lowMatchResult = { ...mockMatchResult, score: 35 };

      // Set up query builder to return both configs
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockConfig, config2])
      };
      mockConfigRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      mockMatchingService.matchArticle
        .mockResolvedValueOnce(highMatchResult)
        .mockResolvedValueOnce(lowMatchResult);
      mockNotificationRepo.save.mockResolvedValue({});
      mockConfigRepo.findOne
        .mockResolvedValueOnce(mockConfig) // For first getUserConfiguration call
        .mockResolvedValueOnce(config2); // For second getUserConfiguration call
      mockMailHelper.sendArticleNotification.mockResolvedValue(undefined);

      const result = await service.notifyUsersForArticle(mockArticle);

      expect(result.totalNotificationsSent).toBe(2);
      expect(result.totalEmailsSent).toBe(2);
      expect(result.userNotifications).toHaveLength(2);
      expect(result.userNotifications[0].matchScore).toBe(85);
      expect(result.userNotifications[1].matchScore).toBe(35);
    });

    it('should handle users without valid email addresses', async () => {
      const userWithInvalidEmail = {
        ...mockUser,
        email: 'invalid-email'
      };
      const configWithInvalidEmail = {
        ...mockConfig,
        user: userWithInvalidEmail
      };

      // Set up query builder to return config with invalid email
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([configWithInvalidEmail])
      };
      mockConfigRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      mockMatchingService.matchArticle.mockResolvedValue(mockMatchResult);
      mockNotificationRepo.save.mockResolvedValue({});
      mockConfigRepo.findOne.mockResolvedValue(configWithInvalidEmail);

      const result = await service.notifyUsersForArticle(mockArticle);

      expect(result.totalNotificationsSent).toBe(1);
      expect(result.totalEmailsSent).toBe(0); // Should be 0 due to invalid email
      expect(result.userNotifications[0].emailSent).toBe(false);
    });
  });
});
