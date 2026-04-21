import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

type RefreshTokenPayload = {
  sub: string;
  type: string;
  iat?: number;
  exp?: number;
};

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  getRefreshTokenExpiryDays(): number {
    return Number(
      this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN_DAYS') ?? 30,
    );
  }

  getRefreshTokenMaxAgeMs(): number {
    return this.getRefreshTokenExpiryDays() * 24 * 60 * 60 * 1000;
  }

  getCookieSecure(): boolean {
    const value = this.configService.get<string | boolean>('COOKIE_SECURE');
    return value === true || value === 'true';
  }

  getCookieDomain(): string {
    return this.configService.get<string>('COOKIE_DOMAIN') ?? '';
  }

  async createPlainRefreshToken(userId: string): Promise<string> {
    const refreshSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    );

    if (!refreshSecret) {
      throw new Error('REFRESH_TOKEN_SECRET is not set');
    }

    return this.jwtService.signAsync(
      { sub: userId, type: 'refresh' },
      {
        secret: refreshSecret,
        expiresIn: `${this.getRefreshTokenExpiryDays()}d` as unknown as number,
      },
    );
  }

  async verifyRefreshToken(
    refreshToken: string,
    options?: {
      ignoreExpiration?: boolean;
    },
  ): Promise<RefreshTokenPayload> {
    const refreshSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    );

    if (!refreshSecret) {
      throw new Error('REFRESH_TOKEN_SECRET is not set');
    }

    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: refreshSecret,
          ignoreExpiration: options?.ignoreExpiration ?? false,
        },
      );

      if (!payload?.sub || payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 12);
  }

  async storeRefreshToken(userId: string, plainToken: string) {
    const tokenHash = await this.hashToken(plainToken);
    const expiresAt = new Date(Date.now() + this.getRefreshTokenMaxAgeMs());

    return this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async revokeAllUserRefreshTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async findValidTokenRecord(userId: string, plainToken: string) {
    const candidates = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        userId: true,
        tokenHash: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

    for (const candidate of candidates) {
      const matches = await bcrypt.compare(plainToken, candidate.tokenHash);
      if (matches) {
        return candidate;
      }
    }

    return null;
  }

  async revokeTokenById(tokenId: string) {
    return this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: {
        revokedAt: new Date(),
      },
      select: {
        id: true,
      },
    });
  }

  async rotateRefreshToken(userId: string, oldTokenId: string) {
    await this.revokeTokenById(oldTokenId);

    const newPlainToken = await this.createPlainRefreshToken(userId);
    await this.storeRefreshToken(userId, newPlainToken);

    return newPlainToken;
  }

  assertRefreshTokenPresent(refreshToken?: string | null): string {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    return refreshToken;
  }
}
