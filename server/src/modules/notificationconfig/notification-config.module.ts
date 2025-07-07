import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationConfiguration } from './notification-config.entity';
import { NotificationConfigService } from './notification-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationConfiguration])],
  providers: [NotificationConfigService],
  exports: [NotificationConfigService],
})
export class NotificationConfigModule {}
