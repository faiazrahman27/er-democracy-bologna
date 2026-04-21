import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
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

    expect(prismaService.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fullName: 'Test User',
          email: 'user@example.com',
          passwordHash: 'hash',
          emailVerified: false,
        }),
      }),
    );
  });
});
