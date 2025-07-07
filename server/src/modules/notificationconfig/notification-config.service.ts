import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationConfiguration } from './notification-config.entity';
import { User } from '../users/user.entity';

@Injectable()
export class NotificationConfigService {
  constructor(
    @InjectRepository(NotificationConfiguration)
    private readonly notificationConfigRepository: Repository<NotificationConfiguration>,
  ) {}

  async getNotificationConfigForUser(user: User): Promise<NotificationConfiguration | null> {
    return this.notificationConfigRepository.findOne({ where: { user } });
  }
}
