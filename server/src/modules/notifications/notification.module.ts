import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '@modules/notifications/notification.entity';
import { NotificationConfiguration } from '@modules/notificationconfig/notification-config.entity';
import { User } from '@modules/users/user.entity';
import { NotificationService } from './notification.service';
import { ExternalApiModule } from '@modules/externalapi/externalapi.module';
import { MailerModule } from '@modules/mailer/mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationConfiguration, User]),
    forwardRef(() => ExternalApiModule),
    MailerModule,
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
