import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: {
    $transaction: jest.Mock;
    authAuditLog: {
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
    emailVerificationToken: {
      deleteMany: jest.Mock;
    };
    passwordResetToken: {
      deleteMany: jest.Mock;
    };
    refreshToken: {
      deleteMany: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      $transaction: jest.fn(),
      authAuditLog: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      emailVerificationToken: {
        deleteMany: jest.fn(),
      },
      passwordResetToken: {
        deleteMany: jest.fn(),
      },
      refreshToken: {
        deleteMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates new users as unverified regardless of database defaults', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);
    prismaService.user.create.mockResolvedValue({
      id: 'user-1',
      fullName: 'Test User',
      email: 'user@example.com',
      role: 'USER',
      emailVerified: false,
      isActive: true,
      createdAt: new Date(),
      termsAcceptedAt: new Date('2026-04-21T00:00:00.000Z'),
    });

    await service.createUser({
      fullName: '  Test User  ',
      email: 'USER@EXAMPLE.COM',
      passwordHash: 'hash',
      termsAcceptedAt: new Date('2026-04-21T00:00:00.000Z'),
    });

    const [[createCall]] = prismaService.user.create.mock.calls as [
      [
        {
          data: {
            fullName: string;
            email: string;
            passwordHash: string;
            emailVerified: boolean;
          };
        },
      ],
    ];

    expect(createCall.data.fullName).toBe('Test User');
    expect(createCall.data.email).toBe('user@example.com');
    expect(createCall.data.passwordHash).toBe('hash');
    expect(createCall.data.emailVerified).toBe(false);
  });

  it('deactivates the account, anonymizes identifying data, and records the action', async () => {
    prismaService.$transaction.mockImplementation(
      (callback: (tx: typeof prismaService) => Promise<unknown>) =>
        callback(prismaService),
    );
    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
    });
    prismaService.user.update.mockResolvedValue({
      id: 'user-1',
    });
    prismaService.authAuditLog.create.mockResolvedValue({
      id: 'audit-1',
    });

    const result = await service.deactivateMyAccount('user-1');

    const [[updateCall]] = prismaService.user.update.mock.calls as [
      [
        {
          data: {
            fullName: string;
            isActive: boolean;
            emailVerified: boolean;
          };
        },
      ],
    ];
    const [[auditCall]] = prismaService.authAuditLog.create.mock.calls as [
      [
        {
          data: {
            userId: string;
            eventType: string;
          };
        },
      ],
    ];

    expect(updateCall.data.fullName).toBe('Anonymized User');
    expect(updateCall.data.isActive).toBe(false);
    expect(updateCall.data.emailVerified).toBe(false);
    expect(auditCall.data.userId).toBe('user-1');
    expect(auditCall.data.eventType).toBe('ACCOUNT_SELF_ANONYMIZED');
    expect(result.message).toContain('anonymized');
  });
});
