import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { Notification, NotificationType } from '../schemas/notification.schema';
import { UpdateProfileDto } from './user.dto';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    private webSocketGateway: WebSocketGatewayService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .populate('followers', 'username')
      .populate('following', 'username');
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, updateProfileDto, { new: true })
      .select('-password');
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async followUser(followerId: string, targetUserId: string) {
    if (followerId === targetUserId) {
      throw new Error('Cannot follow yourself');
    }

    const follower = await this.userModel.findById(followerId);
    const targetUser = await this.userModel.findById(targetUserId);

    if (!follower || !targetUser) {
      throw new NotFoundException('User not found');
    }

    if (!follower.following.includes(targetUser._id)) {
      follower.following.push(targetUser._id);
      targetUser.followers.push(follower._id);
      targetUser.followersCount += 1;

      await follower.save();
      await targetUser.save();

      // Create notification
      const notification = await this.notificationModel.create({
        recipient: targetUserId,
        sender: followerId,
        type: NotificationType.NEW_FOLLOWER,
        message: `${follower.username} started following you`,
      });
      
      // Emit real-time notification
      this.webSocketGateway.emitNewFollower(targetUserId, notification);
    }

    return { message: 'User followed successfully' };
  }

  async unfollowUser(followerId: string, targetUserId: string) {
    const follower = await this.userModel.findById(followerId);
    const targetUser = await this.userModel.findById(targetUserId);

    if (!follower || !targetUser) {
      throw new NotFoundException('User not found');
    }

    follower.following = follower.following.filter(id => !id.equals(targetUser._id));
    targetUser.followers = targetUser.followers.filter(id => !id.equals(follower._id));
    targetUser.followersCount = Math.max(0, targetUser.followersCount - 1);

    await follower.save();
    await targetUser.save();

    return { message: 'User unfollowed successfully' };
  }

  async getAllUsers() {
    return this.userModel.find().select('-password');
  }
}