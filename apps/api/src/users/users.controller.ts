import { Controller, Delete, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { clearRefreshTokenCookie } from '../auth/utils/auth-cookie.util';
import { UsersService } from './users.service';

type AuthenticatedUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
};

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me/export-data')
  async exportMyData(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.exportMyData(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteMyAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.usersService.deleteMyAccount(user.id);

    clearRefreshTokenCookie(
      response,
      process.env.COOKIE_SECURE === 'true',
      process.env.COOKIE_DOMAIN ?? '',
    );

    return result;
  }
}
