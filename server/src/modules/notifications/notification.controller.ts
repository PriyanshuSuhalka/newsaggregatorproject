import { Controller, Get, Post, Body, Query, Param, ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { UpdateNotificationConfigDto } from './dto/update-notification-config.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(@Query('userId', ParseIntPipe) userId: number) {
    return this.notificationService.getNotificationsForUser(userId);
  }

  @Get('config')
  async getConfig(@Query('userId', ParseIntPipe) userId: number) {
    const config = await this.notificationService.getNotificationConfig(userId);
    const categories = await this.notificationService.getAllCategories();
    
    return {
      config,
      availableCategories: categories
    };
  }

  @Post('config')
  async updateConfig(@Body(ValidationPipe) configDto: UpdateNotificationConfigDto) {
    return this.notificationService.updateNotificationConfig(configDto);
  }

  @Post('send')
  async sendNotification(@Body(ValidationPipe) sendDto: SendNotificationDto) {
    return this.notificationService.sendNotification(sendDto);
  }

  @Post(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) notificationId: number,
    @Query('userId', ParseIntPipe) userId: number
  ) {
    return this.notificationService.markAsRead(notificationId, userId);
  }

  @Get('categories')
  async getCategories() {
    return this.notificationService.getAllCategories();
  }
}
