import { Controller, Get, Post, Body, Param, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCommentDto } from './comment.dto';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Post()
  async createComment(@Request() req, @Body(ValidationPipe) createCommentDto: CreateCommentDto) {
    return this.commentService.createComment(req.user.userId, createCommentDto);
  }

  @Get()
  async getAllComments() {
    return this.commentService.getAllComments();
  }

  @Get(':commentId')
  async getCommentById(@Param('commentId') commentId: string) {
    return this.commentService.getCommentById(commentId);
  }

  @Post(':commentId/like')
  async likeComment(@Request() req, @Param('commentId') commentId: string) {
    return this.commentService.likeComment(req.user.userId, commentId);
  }
}