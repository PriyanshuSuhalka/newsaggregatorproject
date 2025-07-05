import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from './notification.entity';
import { NotificationConfiguration } from '@modules/notificationconfig/notification-config.entity';
import { User } from '@modules/users/user.entity';
import { Category } from '@modules/categories/category.entity';
import { Article } from '@modules/articles/article.entity';
import { MailHelperService } from '@modules/mailer/mailer.service';
import { UpdateNotificationConfigDto } from './dto/update-notification-config.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepo: Repository<Notification>;
  let configRepo: Repository<NotificationConfiguration>;
  let userRepo: Repository<User>;
  let categoryRepo: Repository<Category>;
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

  const mockNotification = {
    id: 1,
    message: 'Test notification',
    isRead: false,
    createdAt: new Date(),
    user: mockUser
  } as Notification;

  const mockConfig = {
    id: 1,
    user: mockUser,
    enabledCategoryIds: [1, 2],
    keywords: ['tech', 'ai'],
    emailNotificationsEnabled: true
  } as NotificationConfiguration;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn()
          },
        },
        {
          provide: getRepositoryToken(NotificationConfiguration),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn()
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: MailHelperService,
          useValue: {
            sendArticleNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepo = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    configRepo = module.get<Repository<NotificationConfiguration>>(getRepositoryToken(NotificationConfiguration));
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    categoryRepo = module.get<Repository<Category>>(getRepositoryToken(Category));
    mailHelper = module.get<MailHelperService>(MailHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNotificationsForUser', () => {
    it('should return notifications for a valid user', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(notificationRepo, 'find').mockResolvedValue([mockNotification]);

      const result = await service.getNotificationsForUser(1);

      expect(result).toEqual([mockNotification]);
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { userID: 1 } });
      expect(notificationRepo.find).toHaveBeenCalledWith({
        where: { user: { userID: 1 } },
        order: { createdAt: 'DESC' },
        relations: ['user']
      });
    });

    it('should throw NotFoundException for invalid user', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

      await expect(service.getNotificationsForUser(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getNotificationConfig', () => {
    it('should return existing config for user', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(configRepo, 'findOne').mockResolvedValue(mockConfig);

      const result = await service.getNotificationConfig(1);

      expect(result).toEqual(mockConfig);
    });

    it('should create default config if none exists', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(configRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(configRepo, 'create').mockReturnValue(mockConfig);
      jest.spyOn(configRepo, 'save').mockResolvedValue(mockConfig);

      const result = await service.getNotificationConfig(1);

      expect(configRepo.create).toHaveBeenCalledWith({
        user: mockUser,
        enabledCategoryIds: [],
        keywords: [],
        emailNotificationsEnabled: true
      });
      expect(configRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
    });

    it('should throw NotFoundException for invalid user', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

      await expect(service.getNotificationConfig(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateNotificationConfig', () => {
    const updateDto: UpdateNotificationConfigDto = {
      userId: 1,
      enabledCategoryIds: [1, 2, 3],
      keywords: ['tech', 'ai', 'science']
    };

    it('should update existing config', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(configRepo, 'findOne').mockResolvedValue(mockConfig);
      jest.spyOn(configRepo, 'save').mockResolvedValue({ ...mockConfig, ...updateDto });

      const result = await service.updateNotificationConfig(updateDto);

      expect(configRepo.save).toHaveBeenCalled();
      expect(result.enabledCategoryIds).toEqual(updateDto.enabledCategoryIds);
      expect(result.keywords).toEqual(updateDto.keywords);
    });

    it('should create new config if none exists', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(configRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(configRepo, 'create').mockReturnValue(mockConfig);
      jest.spyOn(configRepo, 'save').mockResolvedValue(mockConfig);

      const result = await service.updateNotificationConfig(updateDto);

      expect(configRepo.create).toHaveBeenCalledWith({
        user: mockUser,
        enabledCategoryIds: updateDto.enabledCategoryIds,
        keywords: updateDto.keywords,
        emailNotificationsEnabled: true
      });
      expect(result).toEqual(mockConfig);
    });

    it('should throw NotFoundException for invalid user', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

      await expect(service.updateNotificationConfig(updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendNotification', () => {
    const sendDto: SendNotificationDto = {
      userId: 1,
      articleId: 1,
      message: 'Test notification'
    };

    it('should create and save notification', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(notificationRepo, 'create').mockReturnValue(mockNotification);
      jest.spyOn(notificationRepo, 'save').mockResolvedValue(mockNotification);

      const result = await service.sendNotification(sendDto);

      expect(notificationRepo.create).toHaveBeenCalledWith({
        user: mockUser,
        message: sendDto.message,
        articleId: sendDto.articleId
      });
      expect(result).toEqual(mockNotification);
    });

    it('should throw NotFoundException for invalid user', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

      await expect(service.sendNotification(sendDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const updatedNotification = { ...mockNotification, isRead: true };
      jest.spyOn(notificationRepo, 'findOne').mockResolvedValue(mockNotification);
      jest.spyOn(notificationRepo, 'save').mockResolvedValue(updatedNotification);

      const result = await service.markAsRead(1, 1);

      expect(result.isRead).toBe(true);
      expect(notificationRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid notification', async () => {
      jest.spyOn(notificationRepo, 'findOne').mockResolvedValue(null);

      await expect(service.markAsRead(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      const categories = [mockCategory];
      jest.spyOn(categoryRepo, 'find').mockResolvedValue(categories);

      const result = await service.getAllCategories();

      expect(result).toEqual(categories);
      expect(categoryRepo.find).toHaveBeenCalled();
    });
  });

  // Note: The notifyUsersForArticle method tests have been removed
  // as this orchestration logic has been moved to NotificationOrchestrationService.
  // The NotificationService now only handles CRUD operations and configuration management.
});
