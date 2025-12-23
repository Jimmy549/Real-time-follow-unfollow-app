import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CommentModule } from './comment/comment.module';
import { NotificationModule } from './notification/notification.module';
import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/realtime-comments'),
    AuthModule,
    UserModule,
    CommentModule,
    NotificationModule,
    WebSocketModule,
  ],
})
export class AppModule {}