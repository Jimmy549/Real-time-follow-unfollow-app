import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebSocketGatewayService implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      
      this.connectedUsers.set(client.id, userId);
      client.join(`user_${userId}`);
      
      console.log(`User ${userId} connected with socket ${client.id}`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);
      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string }) {
    client.join(data.room);
  }

  // Emit new comment to all users
  emitNewComment(comment: any) {
    this.server.emit('new_comment', comment);
  }

  // Emit comment reply to specific user
  emitCommentReply(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('comment_reply', notification);
  }

  // Emit comment like to specific user
  emitCommentLike(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('comment_like', notification);
  }

  // Emit new follower notification
  emitNewFollower(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('new_follower', notification);
  }

  // Emit real-time like update
  emitLikeUpdate(commentId: string, likeData: any) {
    this.server.emit('like_update', { commentId, ...likeData });
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }
}