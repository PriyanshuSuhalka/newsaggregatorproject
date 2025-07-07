import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { NotificationConfiguration } from '@modules/notificationconfig/notification-config.entity';
import { User } from '@modules/users/user.entity';
import { Category } from '@modules/categories/category.entity';
import { UpdateNotificationConfigDto } from './dto/update-notification-config.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

/**
 * Service responsible for notification CRUD operations and configuration management.
 * Business logic for matching and orchestrating notifications is handled by separate services.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,

    @InjectRepository(NotificationConfiguration)
    private configRepo: Repository<NotificationConfiguration>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  /**
   * Get all notifications for a specific user
   */
  async getNotificationsForUser(userId: number): Promise<Notification[]> {
    const user = await this.userRepo.findOne({ where: { userID: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.notificationRepo.find({
      where: { user: { userID: userId } },
      order: { createdAt: 'DESC' },
      relations: ['user']
    });
  }

  /**
   * Get notification configuration for a user (creates default if none exists)
   */
  async getNotificationConfig(userId: number): Promise<NotificationConfiguration | null> {
    const user = await this.userRepo.findOne({ where: { userID: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let config = await this.configRepo.findOne({
      where: { user: { userID: userId } },
      relations: ['user']
    });

    if (!config) {
      // Create default configuration
      config = this.configRepo.create({
        user,
        enabledCategoryIds: [],
        keywords: [],
        emailNotificationsEnabled: true
      });
      
      config = await this.configRepo.save(config);
    }

    return config;
  }

  /**
   * Update notification configuration for a user
   */
  async updateNotificationConfig(updateDto: UpdateNotificationConfigDto): Promise<NotificationConfiguration> {
    const user = await this.userRepo.findOne({ where: { userID: updateDto.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let config = await this.configRepo.findOne({
      where: { user: { userID: updateDto.userId } },
      relations: ['user']
    });

    if (config) {
      // Update existing configuration
      if (updateDto.enabledCategoryIds !== undefined) {
        config.enabledCategoryIds = updateDto.enabledCategoryIds;
      }
      if (updateDto.keywords !== undefined) {
        config.keywords = updateDto.keywords;
      }
      if (updateDto.emailNotificationsEnabled !== undefined) {
        config.emailNotificationsEnabled = updateDto.emailNotificationsEnabled;
      }
    } else {
      // Create new configuration
      config = this.configRepo.create({
        user,
        enabledCategoryIds: updateDto.enabledCategoryIds || [],
        keywords: updateDto.keywords || [],
        emailNotificationsEnabled: updateDto.emailNotificationsEnabled !== undefined ? updateDto.emailNotificationsEnabled : true
      });
    }

    return this.configRepo.save(config);
  }

  /**
   * Send a notification to a user
   */
  async sendNotification(sendDto: SendNotificationDto): Promise<Notification> {
    const user = await this.userRepo.findOne({ where: { userID: sendDto.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const notification = this.notificationRepo.create({
      user,
      message: sendDto.message,
      articleId: sendDto.articleId
    });

    return this.notificationRepo.save(notification);
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: number, userId: number): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, user: { userID: userId } },
      relations: ['user']
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }

  /**
   * Get all categories (for UI purposes)
   */
  async getAllCategories(): Promise<Category[]> {
    return this.categoryRepo.find({
      where: { isHidden: false },
      order: { categoryName: 'ASC' }
    });
  }

  /**
   * Create a notification record (internal helper)
   */
  async createNotification(user: User, message: string, articleId?: number): Promise<Notification> {
    const notification = this.notificationRepo.create({
      user,
      message,
      articleId
    });

    return this.notificationRepo.save(notification);
  }

  /**
   * Get all user configurations (for admin/debugging purposes)
   */
  async getAllUserConfigurations(): Promise<NotificationConfiguration[]> {
    return this.configRepo
      .createQueryBuilder('config')
      .leftJoinAndSelect('config.user', 'user')
      .getMany();
  }
}
