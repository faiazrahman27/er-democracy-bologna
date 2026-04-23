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
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  clearRefreshTokenCookie,
  REFRESH_TOKEN_COOKIE_NAME,
  setRefreshTokenCookie,
} from './utils/auth-cookie.util';
import {
  assertStateChangingOriginAllowed,
  getAllowedOriginsFromConfig,
} from '../common/http/origin.util';

type RequestWithCookies = Request & {
  cookies?: Partial<Record<typeof REFRESH_TOKEN_COOKIE_NAME, string>>;
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
  async verifyEmail(@Body() body: VerifyEmailDto, @Req() request: Request) {
    return this.authService.verifyEmail(
      body.token,
      this.getRequestContext(request),
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Get('verify-email')
  async verifyEmailFromQuery(
    @Query() query: VerifyEmailDto,
    @Req() request: Request,
  ) {
    return this.authService.verifyEmail(
      query.token,
      this.getRequestContext(request),
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('resend-verification')
  async resendVerification(
    @Body() body: ResendVerificationDto,
    @Req() request: Request,
  ) {
    return this.authService.resendVerificationEmail(
      body.email,
      this.getRequestContext(request),
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
    @Req() request: Request,
  ) {
    return this.authService.requestPasswordReset(
      body.email,
      this.getRequestContext(request),
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto, @Req() request: Request) {
    return this.authService.resetPassword(
      body.token,
      body.password,
      this.getRequestContext(request),
    );
  }

  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertCookieOriginAllowed(request);

    const result = await this.authService.login(
      loginDto,
      this.getRequestContext(request),
    );

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
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertCookieOriginAllowed(request);

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

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('logout')
  async logout(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertCookieOriginAllowed(request);

    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE_NAME] ?? null;

    clearRefreshTokenCookie(
      response,
      process.env.COOKIE_SECURE === 'true',
      process.env.COOKIE_DOMAIN ?? '',
    );

    return this.authService.logoutWithRefreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: unknown) {
    return {
      message: 'Authenticated user fetched successfully',
      user,
    };
  }

  private assertCookieOriginAllowed(request: Request) {
    assertStateChangingOriginAllowed({
      origin: request.headers.origin,
      referer: request.headers.referer,
      allowedOrigins: getAllowedOriginsFromConfig(process.env.CORS_ORIGIN),
    });
  }

  private getRequestContext(request: Request) {
    return {
      ipAddress: request.ip ?? null,
      userAgent: request.get('user-agent') ?? null,
    };
  }
}
