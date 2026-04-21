import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RefreshTokenService } from './refresh-token.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmailForAuth: jest.Mock;
    findByIdForAuth: jest.Mock;
    updateLastLogin: jest.Mock;
  };
  let refreshTokenService: {
    assertRefreshTokenPresent: jest.Mock;
    verifyRefreshToken: jest.Mock;
    findValidTokenRecord: jest.Mock;
    rotateRefreshToken: jest.Mock;
    createPlainRefreshToken: jest.Mock;
    storeRefreshToken: jest.Mock;
    getRefreshTokenMaxAgeMs: jest.Mock;
    getCookieSecure: jest.Mock;
    getCookieDomain: jest.Mock;
    revokeAllUserRefreshTokens: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
  };
  let auditService: {
    logAuthEvent: jest.Mock;
  };

  beforeEach(async () => {
    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockReset();

    usersService = {
      findByEmailForAuth: jest.fn(),
      findByIdForAuth: jest.fn(),
      updateLastLogin: jest.fn(),
    };
    refreshTokenService = {
      assertRefreshTokenPresent: jest.fn(),
      verifyRefreshToken: jest.fn(),
      findValidTokenRecord: jest.fn(),
      rotateRefreshToken: jest.fn(),
      createPlainRefreshToken: jest.fn(),
      storeRefreshToken: jest.fn(),
      getRefreshTokenMaxAgeMs: jest.fn().mockReturnValue(2_592_000_000),
      getCookieSecure: jest.fn().mockReturnValue(false),
      getCookieDomain: jest.fn().mockReturnValue(''),
      revokeAllUserRefreshTokens: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
    };
    auditService = {
      logAuthEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: RefreshTokenService,
          useValue: refreshTokenService,
        },
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('blocks login for unverified users and revokes any existing refresh tokens', async () => {
    usersService.findByEmailForAuth.mockResolvedValue({
      id: 'user-1',
      fullName: 'Unverified User',
      email: 'user@example.com',
      passwordHash: 'stored-hash',
      role: 'USER',
      emailVerified: false,
      isActive: true,
      lockedUntil: null,
      failedLoginCount: 0,
    });

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(
      new ForbiddenException(
        'Please verify your email address before signing in',
      ),
    );

    expect(refreshTokenService.revokeAllUserRefreshTokens).toHaveBeenCalledWith(
      'user-1',
    );
    expect(refreshTokenService.createPlainRefreshToken).not.toHaveBeenCalled();
  });

  it('blocks refresh for unverified users and revokes refresh tokens', async () => {
    refreshTokenService.assertRefreshTokenPresent.mockReturnValue(
      'refresh-token',
    );
    refreshTokenService.verifyRefreshToken.mockResolvedValue({
      sub: 'user-1',
      type: 'refresh',
    });
    refreshTokenService.findValidTokenRecord.mockResolvedValue({
      id: 'refresh-record-1',
    });
    usersService.findByIdForAuth.mockResolvedValue({
      id: 'user-1',
      fullName: 'Unverified User',
      email: 'user@example.com',
      role: 'USER',
      emailVerified: false,
      isActive: true,
    });

    await expect(
      service.refreshAccessTokenFromRefreshToken('refresh-token'),
    ).rejects.toThrow(
      new ForbiddenException(
        'Please verify your email address before signing in',
      ),
    );

    expect(refreshTokenService.revokeAllUserRefreshTokens).toHaveBeenCalledWith(
      'user-1',
    );
    expect(refreshTokenService.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('still allows verified users to log in normally', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    usersService.findByEmailForAuth.mockResolvedValue({
      id: 'user-1',
      fullName: 'Verified User',
      email: 'verified@example.com',
      passwordHash: 'stored-hash',
      role: 'USER',
      emailVerified: true,
      isActive: true,
      lockedUntil: null,
      failedLoginCount: 0,
    });
    usersService.updateLastLogin.mockResolvedValue({
      id: 'user-1',
      lastLoginAt: new Date(),
    });
    jwtService.signAsync.mockResolvedValue('access-token');
    refreshTokenService.createPlainRefreshToken.mockResolvedValue(
      'refresh-token',
    );
    refreshTokenService.storeRefreshToken.mockResolvedValue(undefined);

    const result = await service.login({
      email: 'verified@example.com',
      password: 'password123',
    });

    expect(result.message).toBe('Login successful');
    expect(result.user.emailVerified).toBe(true);
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(
      refreshTokenService.revokeAllUserRefreshTokens,
    ).not.toHaveBeenCalled();
  });
});
