import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { UpdateNotificationConfigDto } from './dto/update-notification-config.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotificationService = {
    getNotificationsForUser: jest.fn(),
    getNotificationConfig: jest.fn(),
    updateNotificationConfig: jest.fn(),
    sendNotification: jest.fn(),
    markAsRead: jest.fn(),
    getAllCategories: jest.fn(),
  };

  const mockNotification = {
    id: 1,
    message: 'Test notification',
    isRead: false,
    createdAt: new Date(),
    user: { userID: 1, email: 'test@example.com' }
  };

  const mockConfig = {
    id: 1,
    user: { userID: 1, email: 'test@example.com' },
    enabledCategoryIds: [1, 2],
    keywords: ['tech', 'ai'],
    emailNotificationsEnabled: true
  };

  const mockCategories = [
    { categoryID: 1, categoryName: 'Technology' },
    { categoryID: 2, categoryName: 'Science' }
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNotifications', () => {
    it('should return notifications for a user', async () => {
      const userId = 1;
      const expectedNotifications = [mockNotification];

      mockNotificationService.getNotificationsForUser.mockResolvedValue(expectedNotifications);

      const result = await controller.getNotifications(userId);

      expect(result).toEqual(expectedNotifications);
      expect(service.getNotificationsForUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('getConfig', () => {
    it('should return config and available categories', async () => {
      const userId = 1;

      mockNotificationService.getNotificationConfig.mockResolvedValue(mockConfig);
      mockNotificationService.getAllCategories.mockResolvedValue(mockCategories);

      const result = await controller.getConfig(userId);

      expect(result).toEqual({
        config: mockConfig,
        availableCategories: mockCategories
      });
      expect(service.getNotificationConfig).toHaveBeenCalledWith(userId);
      expect(service.getAllCategories).toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    it('should update notification configuration', async () => {
      const updateDto: UpdateNotificationConfigDto = {
        userId: 1,
        enabledCategoryIds: [1, 2, 3],
        keywords: ['tech', 'ai', 'science']
      };

      const updatedConfig = { ...mockConfig, ...updateDto };
      mockNotificationService.updateNotificationConfig.mockResolvedValue(updatedConfig);

      const result = await controller.updateConfig(updateDto);

      expect(result).toEqual(updatedConfig);
      expect(service.updateNotificationConfig).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('sendNotification', () => {
    it('should send a notification', async () => {
      const sendDto: SendNotificationDto = {
        userId: 1,
        articleId: 1,
        message: 'Test notification'
      };

      mockNotificationService.sendNotification.mockResolvedValue(mockNotification);

      const result = await controller.sendNotification(sendDto);

      expect(result).toEqual(mockNotification);
      expect(service.sendNotification).toHaveBeenCalledWith(sendDto);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = 1;
      const userId = 1;
      const readNotification = { ...mockNotification, isRead: true };

      mockNotificationService.markAsRead.mockResolvedValue(readNotification);

      const result = await controller.markAsRead(notificationId, userId);

      expect(result).toEqual(readNotification);
      expect(service.markAsRead).toHaveBeenCalledWith(notificationId, userId);
    });
  });

  describe('getCategories', () => {
    it('should return all categories', async () => {
      mockNotificationService.getAllCategories.mockResolvedValue(mockCategories);

      const result = await controller.getCategories();

      expect(result).toEqual(mockCategories);
      expect(service.getAllCategories).toHaveBeenCalled();
    });
  });
});
