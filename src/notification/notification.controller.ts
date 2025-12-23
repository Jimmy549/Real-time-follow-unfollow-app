import { Controller, Get, Put, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  async getUserNotifications(@Request() req) {
    return this.notificationService.getUserNotifications(req.user.userId);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    return this.notificationService.getUnreadCount(req.user.userId);
  }

  @Put(':notificationId/read')
  async markAsRead(@Request() req, @Param('notificationId') notificationId: string) {
    return this.notificationService.markAsRead(notificationId, req.user.userId);
  }

  @Put('mark-all-read')
  async markAllAsRead(@Request() req) {
    return this.notificationService.markAllAsRead(req.user.userId);
  }
}