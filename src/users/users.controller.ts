import { Controller, Get, Put, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Put('profile')
  async updateProfile(@Request() req, @Body() updateData: any) {
    return this.usersService.updateProfile(req.user.userId, updateData);
  }

  @Post('follow/:userId')
  async followUser(@Request() req, @Param('userId') targetUserId: string) {
    return this.usersService.followUser(req.user.userId, targetUserId);
  }

  @Post('unfollow/:userId')
  async unfollowUser(@Request() req, @Param('userId') targetUserId: string) {
    return this.usersService.unfollowUser(req.user.userId, targetUserId);
  }

  @Get()
  async getAllUsers(@Request() req) {
    return this.usersService.getAllUsers(req.user.userId);
  }

  @Get(':userId')
  async getUserById(@Param('userId') userId: string) {
    return this.usersService.getUserById(userId);
  }
}