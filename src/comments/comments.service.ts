import { Injectable, NotFoundException, Inject, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from '../schemas/comment.schema';
import { User } from '../schemas/user.schema';
import { Notification, NotificationType } from '../schemas/notification.schema';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';

export class CreateCommentDto {
  content: string;
  parentComment?: string;
}

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @Optional() private webSocketGateway?: WebSocketGatewayService,
  ) {}

  async createComment(userId: string, createCommentDto: CreateCommentDto) {
    const { content, parentComment } = createCommentDto;
    
    const comment = new this.commentModel({
      content,
      author: userId,
      parentComment: parentComment || null,
      likes: [],
      likesCount: 0
    });

    await comment.save();

    if (parentComment) {
      // This is a reply
      const parent = await this.commentModel.findById(parentComment);
      if (parent) {
        parent.replies.push(comment._id);
        parent.repliesCount += 1;
        await parent.save();
      }
    }

    // Return populated comment
    return this.commentModel
      .findById(comment._id)
      .populate('author', 'username profilePicture');
  }

  async getAllComments() {
    const comments = await this.commentModel
      .find({ parentComment: null })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });

    // Manually populate replies for each comment
    for (const comment of comments) {
      if (comment.replies && comment.replies.length > 0) {
        const populatedReplies = await this.commentModel
          .find({ _id: { $in: comment.replies } })
          .populate('author', 'username profilePicture')
          .sort({ createdAt: 1 });
        
        // Ensure each reply has proper structure
        const formattedReplies = populatedReplies.map(reply => ({
          _id: reply._id,
          content: reply.content,
          author: reply.author,
          createdAt: reply.createdAt,
          likes: reply.likes || [],
          likesCount: reply.likesCount || 0
        }));
        
        comment.replies = formattedReplies as any;
      }
    }

    return comments;
  }

  async getCommentById(commentId: string) {
    const comment = await this.getPopulatedComment(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  async likeComment(userId: string, commentId: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Initialize likes array if it doesn't exist
    if (!comment.likes) {
      comment.likes = [];
    }

    const userIdStr = userId.toString();
    const hasLiked = comment.likes.some(id => id.toString() === userIdStr);
    
    if (hasLiked) {
      // Remove like
      comment.likes = comment.likes.filter(id => id.toString() !== userIdStr);
    } else {
      // Add like
      comment.likes.push(userId as any);
    }

    // Update count to match array length
    comment.likesCount = comment.likes.length;
    
    const savedComment = await comment.save();
    return { likesCount: savedComment.likesCount };
  }

  private async getPopulatedComment(commentId: string) {
    return this.commentModel
      .findById(commentId)
      .populate('author', 'username profilePicture')
      .populate({
        path: 'replies',
        populate: { 
          path: 'author', 
          select: 'username profilePicture' 
        }
      });
  }
}