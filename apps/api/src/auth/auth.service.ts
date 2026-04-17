import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Resend } from 'resend';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { RefreshTokenService } from './refresh-token.service';

type AccessTokenPayload = {
  sub: string;
  email: string;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    const user = await this.usersService.createUser({
      fullName: registerDto.fullName,
      email: registerDto.email,
      passwordHash,
    });

    const verificationToken = await this.createEmailVerificationToken(user.id);

    try {
      await this.sendVerificationEmail({
        email: user.email,
        fullName: user.fullName,
        token: verificationToken,
      });
    } catch {
      return {
        message:
          'User registered successfully, but we could not send the verification email. Please use resend verification.',
        user,
      };
    }

    return {
      message:
        'User registered successfully. Please verify your email before signing in.',
      user,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailForAuth(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenException('This account is inactive');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Please verify your email address before signing in',
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('This account is temporarily locked');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      const nextFailedLoginCount = user.failedLoginCount + 1;
      const shouldLockAccount = nextFailedLoginCount >= 5;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: nextFailedLoginCount,
          lockedUntil: shouldLockAccount
            ? new Date(Date.now() + 15 * 60 * 1000)
            : null,
        },
      });

      throw new UnauthorizedException('Invalid email or password');
    }

    await this.usersService.updateLastLogin(user.id);

    const accessToken = await this.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken =
      await this.refreshTokenService.createPlainRefreshToken(user.id);
    await this.refreshTokenService.storeRefreshToken(user.id, refreshToken);

    return {
      message: 'Login successful',
      accessToken,
      refreshToken,
      refreshTokenMaxAgeMs: this.refreshTokenService.getRefreshTokenMaxAgeMs(),
      cookieSecure: this.refreshTokenService.getCookieSecure(),
      cookieDomain: this.refreshTokenService.getCookieDomain(),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
    };
  }

  async refreshAccessTokenFromRefreshToken(refreshToken: string) {
    this.refreshTokenService.assertRefreshTokenPresent(refreshToken);

    const decoded = await this.jwtService.decode(refreshToken);
    if (!decoded || typeof decoded !== 'object' || !('sub' in decoded)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = String(decoded.sub);
    const tokenRecord = await this.refreshTokenService.findValidTokenRecord(
      userId,
      refreshToken,
    );

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const user = await this.usersService.findByIdForAuth(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is invalid or inactive');
    }

    const nextRefreshToken = await this.refreshTokenService.rotateRefreshToken(
      user.id,
      tokenRecord.id,
    );

    const accessToken = await this.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: 'Token refreshed successfully',
      accessToken,
      refreshToken: nextRefreshToken,
      refreshTokenMaxAgeMs: this.refreshTokenService.getRefreshTokenMaxAgeMs(),
      cookieSecure: this.refreshTokenService.getCookieSecure(),
      cookieDomain: this.refreshTokenService.getCookieDomain(),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
    };
  }

  async verifyEmail(token: string) {
    const normalizedToken = token.trim();

    if (!normalizedToken) {
      throw new UnauthorizedException('Invalid verification token');
    }

    const tokenHash = this.hashToken(normalizedToken);

    const tokenRecord = await this.prisma.emailVerificationToken.findFirst({
      where: {
        tokenHash,
        verifiedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException(
        'Verification token is invalid or expired',
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: tokenRecord.userId },
        data: {
          emailVerified: true,
        },
      }),
      this.prisma.emailVerificationToken.updateMany({
        where: {
          userId: tokenRecord.userId,
          verifiedAt: null,
        },
        data: {
          verifiedAt: new Date(),
        },
      }),
    ]);

    return {
      message: 'Email verified successfully',
      user: {
        id: tokenRecord.user.id,
        fullName: tokenRecord.user.fullName,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
        emailVerified: true,
        isActive: tokenRecord.user.isActive,
      },
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findByEmailForAuth(email);

    if (!user) {
      return {
        message:
          'If an account with that email exists, a verification email has been sent.',
      };
    }

    if (user.emailVerified) {
      return {
        message: 'This email address is already verified.',
      };
    }

    const verificationToken = await this.createEmailVerificationToken(user.id);

    await this.sendVerificationEmail({
      email: user.email,
      fullName: user.fullName,
      token: verificationToken,
    });

    return {
      message: 'Verification email sent successfully.',
    };
  }

  async requestPasswordReset(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return {
        message:
          'If an account with that email exists, a password reset email has been sent.',
      };
    }

    const user = await this.usersService.findByEmailForAuth(normalizedEmail);

    if (!user || !user.isActive) {
      return {
        message:
          'If an account with that email exists, a password reset email has been sent.',
      };
    }

    const resetToken = await this.createPasswordResetToken(user.id);

    await this.sendPasswordResetEmail({
      email: user.email,
      fullName: user.fullName,
      token: resetToken,
    });

    return {
      message:
        'If an account with that email exists, a password reset email has been sent.',
    };
  }

  async resetPassword(token: string, password: string) {
    const normalizedToken = token.trim();

    if (!normalizedToken) {
      throw new UnauthorizedException('Invalid password reset token');
    }

    if (!password || password.trim().length < 8) {
      throw new ForbiddenException(
        'Password must be at least 8 characters long',
      );
    }

    const tokenHash = this.hashToken(normalizedToken);

    const tokenRecord = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException(
        'Password reset token is invalid or expired',
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: tokenRecord.userId },
        data: {
          passwordHash,
          failedLoginCount: 0,
          lockedUntil: null,
        },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: {
          userId: tokenRecord.userId,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      }),
      this.prisma.refreshToken.updateMany({
        where: {
          userId: tokenRecord.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);

    return {
      message: 'Password reset successfully. You can sign in now.',
    };
  }

  async logout(userId: string) {
    await this.refreshTokenService.revokeAllUserRefreshTokens(userId);

    return {
      message: 'Logout successful',
    };
  }

  async logoutWithRefreshToken(refreshToken?: string | null) {
    if (!refreshToken) {
      return {
        message: 'Logout successful',
      };
    }

    const decoded = await this.jwtService.decode(refreshToken);
    if (!decoded || typeof decoded !== 'object' || !('sub' in decoded)) {
      return {
        message: 'Logout successful',
      };
    }

    const userId = String(decoded.sub);
    await this.refreshTokenService.revokeAllUserRefreshTokens(userId);

    return {
      message: 'Logout successful',
    };
  }

  private async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  private async createEmailVerificationToken(userId: string): Promise<string> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.emailVerificationToken.updateMany({
      where: {
        userId,
        verifiedAt: null,
      },
      data: {
        verifiedAt: new Date(),
      },
    });

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
  }

  private async createPasswordResetToken(userId: string): Promise<string> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async sendVerificationEmail(input: {
    email: string;
    fullName: string;
    token: string;
  }) {
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const frontendUrl = process.env.FRONTEND_URL;

    if (!resendApiKey) {
      throw new InternalServerErrorException(
        'RESEND_API_KEY is not configured',
      );
    }

    if (!fromEmail) {
      throw new InternalServerErrorException(
        'RESEND_FROM_EMAIL is not configured',
      );
    }

    if (!frontendUrl) {
      throw new InternalServerErrorException(
        'FRONTEND_URL is not configured',
      );
    }

    const resend = new Resend(resendApiKey);
    const verificationUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(
      input.token,
    )}`;

    const result = await resend.emails.send({
      from: fromEmail,
      to: input.email,
      subject: 'Verify your ER Democracy Bologna account',
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2 style="margin-bottom: 16px;">Verify your email</h2>
          <p>Hello ${this.escapeHtml(input.fullName)},</p>
          <p>Thank you for creating an account on ER Democracy Bologna.</p>
          <p>Please verify your email address by clicking the button below:</p>
          <p style="margin: 24px 0;">
            <a
              href="${verificationUrl}"
              style="display: inline-block; background: #166534; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600;"
            >
              Verify email
            </a>
          </p>
          <p>If the button does not work, use this link:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This verification link expires in 24 hours.</p>
        </div>
      `,
    });

    if (result.error) {
      throw new InternalServerErrorException(
        `Failed to send verification email: ${result.error.message}`,
      );
    }
  }

  private async sendPasswordResetEmail(input: {
    email: string;
    fullName: string;
    token: string;
  }) {
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const frontendUrl = process.env.FRONTEND_URL;

    if (!resendApiKey) {
      throw new InternalServerErrorException(
        'RESEND_API_KEY is not configured',
      );
    }

    if (!fromEmail) {
      throw new InternalServerErrorException(
        'RESEND_FROM_EMAIL is not configured',
      );
    }

    if (!frontendUrl) {
      throw new InternalServerErrorException(
        'FRONTEND_URL is not configured',
      );
    }

    const resend = new Resend(resendApiKey);
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(
      input.token,
    )}`;

    const result = await resend.emails.send({
      from: fromEmail,
      to: input.email,
      subject: 'Reset your ER Democracy Bologna password',
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2 style="margin-bottom: 16px;">Reset your password</h2>
          <p>Hello ${this.escapeHtml(input.fullName)},</p>
          <p>We received a request to reset your password.</p>
          <p>Please use the button below to choose a new password:</p>
          <p style="margin: 24px 0;">
            <a
              href="${resetUrl}"
              style="display: inline-block; background: #166534; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600;"
            >
              Reset password
            </a>
          </p>
          <p>If the button does not work, use this link:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This reset link expires in 1 hour.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (result.error) {
      throw new InternalServerErrorException(
        `Failed to send password reset email: ${result.error.message}`,
      );
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
