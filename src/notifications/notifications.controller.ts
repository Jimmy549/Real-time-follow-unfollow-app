import { Controller, Get, Put, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(@Request() req) {
    return this.notificationsService.getUserNotifications(req.user.userId);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.userId);
  }

  @Put(':notificationId/read')
  async markAsRead(@Request() req, @Param('notificationId') notificationId: string) {
    return this.notificationsService.markAsRead(notificationId, req.user.userId);
  }

  @Put('mark-all-read')
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Delete(':notificationId')
  async deleteNotification(@Request() req, @Param('notificationId') notificationId: string) {
    return this.notificationsService.deleteNotification(notificationId, req.user.userId);
  }
}