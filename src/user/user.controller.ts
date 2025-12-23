import { Controller, Get, Put, Post, Body, Param, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.userService.getProfile(req.user.userId);
  }

  @Put('profile')
  async updateProfile(@Request() req, @Body(ValidationPipe) updateProfileDto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Post('follow/:userId')
  async followUser(@Request() req, @Param('userId') targetUserId: string) {
    return this.userService.followUser(req.user.userId, targetUserId);
  }

  @Post('unfollow/:userId')
  async unfollowUser(@Request() req, @Param('userId') targetUserId: string) {
    return this.userService.unfollowUser(req.user.userId, targetUserId);
  }

  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get(':userId')
  async getUserById(@Param('userId') userId: string) {
    return this.userService.getProfile(userId);
  }
}