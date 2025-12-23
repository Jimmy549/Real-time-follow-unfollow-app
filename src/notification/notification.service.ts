import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from '../schemas/notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
  ) {}

  async getUserNotifications(userId: string) {
    return this.notificationModel
      .find({ recipient: userId })
      .populate('sender', 'username profilePicture')
      .populate('relatedComment', 'content')
      .sort({ createdAt: -1 })
      .limit(50);
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.notificationModel.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId: string) {
    return this.notificationModel.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationModel.countDocuments({
      recipient: userId,
      isRead: false,
    });
    return { unreadCount: count };
  }
}