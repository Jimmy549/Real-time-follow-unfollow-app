import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { Notification, NotificationType } from '../schemas/notification.schema';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    private webSocketGateway: WebSocketGatewayService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture');
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, updateData: any) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
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

    const [follower, targetUser] = await Promise.all([
      this.userModel.findById(followerId),
      this.userModel.findById(targetUserId)
    ]);

    if (!follower || !targetUser) {
      throw new NotFoundException('User not found');
    }

    if (!follower.following.includes(targetUser._id)) {
      follower.following.push(targetUser._id);
      follower.followingCount += 1;
      
      targetUser.followers.push(follower._id);
      targetUser.followersCount += 1;

      await Promise.all([follower.save(), targetUser.save()]);

      // Create notification
      const notification = await this.notificationModel.create({
        recipient: targetUserId,
        sender: followerId,
        type: NotificationType.NEW_FOLLOWER,
        message: `${follower.username} started following you`,
      });

      // Emit follower notification
      this.webSocketGateway.emitNewFollower(targetUserId, notification);

      return { 
        message: 'User followed successfully',
        notification,
        followersCount: targetUser.followersCount 
      };
    }

    return { message: 'Already following this user' };
  }

  async unfollowUser(followerId: string, targetUserId: string) {
    const [follower, targetUser] = await Promise.all([
      this.userModel.findById(followerId),
      this.userModel.findById(targetUserId)
    ]);

    if (!follower || !targetUser) {
      throw new NotFoundException('User not found');
    }

    follower.following = follower.following.filter(id => !id.equals(targetUser._id));
    follower.followingCount = Math.max(0, follower.followingCount - 1);
    
    targetUser.followers = targetUser.followers.filter(id => !id.equals(follower._id));
    targetUser.followersCount = Math.max(0, targetUser.followersCount - 1);

    await Promise.all([follower.save(), targetUser.save()]);

    return { 
      message: 'User unfollowed successfully',
      followersCount: targetUser.followersCount 
    };
  }

  async getAllUsers(currentUserId?: string) {
    return this.userModel
      .find({ _id: { $ne: currentUserId } })
      .select('-password')
      .sort({ followersCount: -1 })
      .limit(50);
  }

  async getUserById(userId: string) {
    return this.getProfile(userId);
  }
}