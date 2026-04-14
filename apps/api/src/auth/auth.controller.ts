import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  clearRefreshTokenCookie,
  REFRESH_TOKEN_COOKIE_NAME,
  setRefreshTokenCookie,
} from './utils/auth-cookie.util';

type AuthenticatedUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('verify-email')
  async verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Get('verify-email')
  async verifyEmailFromQuery(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('resend-verification')
  async resendVerification(@Body() body: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(body.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(token, password);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);

    setRefreshTokenCookie({
      response,
      refreshToken: result.refreshToken,
      cookieSecure: result.cookieSecure,
      cookieDomain: result.cookieDomain,
      maxAgeMs: result.refreshTokenMaxAgeMs,
    });

    return {
      message: result.message,
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    const result =
      await this.authService.refreshAccessTokenFromRefreshToken(refreshToken);

    setRefreshTokenCookie({
      response,
      refreshToken: result.refreshToken,
      cookieSecure: result.cookieSecure,
      cookieDomain: result.cookieDomain,
      maxAgeMs: result.refreshTokenMaxAgeMs,
    });

    return {
      message: result.message,
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    await this.authService.logoutWithRefreshToken(refreshToken);
    clearRefreshTokenCookie(
      response,
      process.env.COOKIE_SECURE === 'true',
      process.env.COOKIE_DOMAIN ?? '',
    );

    return this.authService.logout(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: unknown) {
    return {
      message: 'Authenticated user fetched successfully',
      user,
    };
  }
}
