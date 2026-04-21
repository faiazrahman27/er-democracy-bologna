import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from './refresh-token.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let prismaService: {
    refreshToken: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      refreshToken: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('matches valid refresh tokens even when they are older than the newest 10 sessions', async () => {
    const candidates = Array.from({ length: 12 }, (_, index) => ({
      id: `token-${index + 1}`,
      userId: 'user-1',
      tokenHash: `hash-${index + 1}`,
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      revokedAt: null,
    }));

    prismaService.refreshToken.findMany.mockResolvedValue(candidates);
    const compareMock = bcrypt.compare as unknown as jest.Mock;
    compareMock.mockImplementation((_plainToken: string, tokenHash: string) =>
      Promise.resolve(tokenHash === 'hash-12'),
    );

    const result = await service.findValidTokenRecord(
      'user-1',
      'plain-refresh-token',
    );

    const [[findManyArgs]] = prismaService.refreshToken.findMany.mock.calls as [
      [
        {
          where: {
            userId: string;
            revokedAt: null;
          };
          orderBy: {
            createdAt: string;
          };
        },
      ],
    ];

    expect(findManyArgs.where.userId).toBe('user-1');
    expect(findManyArgs.where.revokedAt).toBeNull();
    expect(findManyArgs.orderBy.createdAt).toBe('desc');
    expect(result?.id).toBe('token-12');
  });
});
