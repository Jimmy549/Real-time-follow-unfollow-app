import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CommentsService, CreateCommentDto } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  async createComment(@Request() req, @Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.createComment(req.user.userId, createCommentDto);
  }

  @Get()
  async getAllComments() {
    return this.commentsService.getAllComments();
  }

  @Get(':commentId')
  async getCommentById(@Param('commentId') commentId: string) {
    return this.commentsService.getCommentById(commentId);
  }

  @Post(':commentId/like')
  async likeComment(@Request() req, @Param('commentId') commentId: string) {
    try {
      return await this.commentsService.likeComment(req.user.userId, commentId);
    } catch (error) {
      console.error('Controller like error:', error);
      throw error;
    }
  }
}