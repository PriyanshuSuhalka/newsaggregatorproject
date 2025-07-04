import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Notification } from './notification.entity';
import { NotificationConfiguration } from '@modules/notificationconfig/notification-config.entity';
import { User } from '@modules/users/user.entity';
import { Article } from '@modules/articles/article.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,

    @InjectRepository(NotificationConfiguration)
    private configRepo: Repository<NotificationConfiguration>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async notifyUsersForArticle(article: Article): Promise<void> {
    const categoryName = article.category?.categoryName;

    if (!categoryName) {
      console.warn(`Category not found for article: ${article.articleTitle}`);
      return;
    }

    // Assuming `categories` in NotificationConfiguration is a comma-separated string like: "Politics,Technology"
    const configs = await this.configRepo.find({
      relations: ['user'],
      where: {
        categories: ILike(`%${categoryName}%`), // Case-insensitive partial match
      },
    });

    if (configs.length === 0) {
      console.log(`No users configured for category: ${categoryName}`);
      return;
    }

    for (const config of configs) {
      const user = config.user;
      if (!user?.email) continue;

      const message = `📰 New article in "${categoryName}": ${article.articleTitle}`;

      const notification = this.notificationRepo.create({
        user,
        message,
      });

      await this.notificationRepo.save(notification);

      // TODO: Replace with actual email sender service later
      console.log(`🔔 Notification created for ${user.email} -> ${message}`);
    }
  }
}
