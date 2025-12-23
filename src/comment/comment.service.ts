import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from '../schemas/comment.schema';
import { User } from '../schemas/user.schema';
import { Notification, NotificationType } from '../schemas/notification.schema';
import { CreateCommentDto } from './comment.dto';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    private webSocketGateway: WebSocketGatewayService,
  ) {}

  async createComment(userId: string, createCommentDto: CreateCommentDto) {
    const { content, parentComment } = createCommentDto;
    
    const comment = new this.commentModel({
      content,
      author: userId,
      parentComment: parentComment || null,
    });

    await comment.save();

    // If it's a reply, add to parent's replies and notify parent author
    if (parentComment) {
      const parent = await this.commentModel.findById(parentComment).populate('author');
      if (parent) {
        parent.replies.push(comment._id);
        await parent.save();

        // Notify parent comment author
        if (!parent.author._id.equals(userId)) {
          const user = await this.userModel.findById(userId);
          const notification = await this.notificationModel.create({
            recipient: parent.author._id,
            sender: userId,
            type: NotificationType.NEW_REPLY,
            message: `${user.username} replied to your comment`,
            relatedComment: comment._id,
          });
          
          // Emit real-time notification
          this.webSocketGateway.emitCommentReply(parent.author._id.toString(), notification);
        }
      }
    } else {
      // Notify all users about new comment
      const users = await this.userModel.find({ _id: { $ne: userId } });
      const user = await this.userModel.findById(userId);
      
      const notifications = users.map(u => ({
        recipient: u._id,
        sender: userId,
        type: NotificationType.NEW_COMMENT,
        message: `${user.username} posted a new comment`,
        relatedComment: comment._id,
      }));

      await this.notificationModel.insertMany(notifications);
      
      // Emit real-time new comment notification
      const populatedComment = await this.commentModel
        .findById(comment._id)
        .populate('author', 'username profilePicture');
      this.webSocketGateway.emitNewComment(populatedComment);
    }

    return this.commentModel
      .findById(comment._id)
      .populate('author', 'username profilePicture')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'username profilePicture' }
      });
  }

  async getAllComments() {
    return this.commentModel
      .find({ parentComment: null })
      .populate('author', 'username profilePicture')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'username profilePicture' }
      })
      .sort({ createdAt: -1 });
  }

  async getCommentById(commentId: string) {
    const comment = await this.commentModel
      .findById(commentId)
      .populate('author', 'username profilePicture')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'username profilePicture' }
      });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  async likeComment(userId: string, commentId: string) {
    const comment = await this.commentModel.findById(commentId).populate('author');
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const userLiked = comment.likes.includes(userId as any);
    
    if (userLiked) {
      comment.likes = comment.likes.filter(id => !id.equals(userId));
      comment.likesCount = Math.max(0, comment.likesCount - 1);
    } else {
      comment.likes.push(userId as any);
      comment.likesCount += 1;

      // Notify comment author about like
      if (!comment.author._id.equals(userId)) {
        const user = await this.userModel.findById(userId);
        const notification = await this.notificationModel.create({
          recipient: comment.author._id,
          sender: userId,
          type: NotificationType.COMMENT_LIKED,
          message: `${user.username} liked your comment`,
          relatedComment: commentId,
        });
        
        // Emit real-time like notification
        this.webSocketGateway.emitCommentLike(comment.author._id.toString(), notification);
      }
    }

    await comment.save();
    
    // Emit real-time like update
    this.webSocketGateway.emitLikeUpdate(commentId, { liked: !userLiked, likesCount: comment.likesCount });
    
    return { liked: !userLiked, likesCount: comment.likesCount };
  }
}