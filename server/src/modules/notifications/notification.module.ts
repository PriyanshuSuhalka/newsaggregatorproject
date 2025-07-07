import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '@modules/notifications/notification.entity';
import { NotificationConfiguration } from '@modules/notificationconfig/notification-config.entity';
import { User } from '@modules/users/user.entity';
import { Category } from '@modules/categories/category.entity';
import { Article } from '@modules/articles/article.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationOrchestrationService } from './notification-orchestration.service';
import { MatchingModule } from '@modules/matching/matching.module';
import { ExternalApiModule } from '@modules/externalapi/externalapi.module';
import { MailerModule } from '@modules/mailer/mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationConfiguration, User, Category, Article]),
    MatchingModule, // Import the new matching module
    forwardRef(() => ExternalApiModule),
    MailerModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationOrchestrationService, // Add the orchestration service
  ],
  exports: [
    NotificationService,
    NotificationOrchestrationService, // Export for use by external API service
  ],
})
export class NotificationModule {}
