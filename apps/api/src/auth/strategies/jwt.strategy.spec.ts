import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: {
    findByIdForAuth: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      findByIdForAuth: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('jwt-test-secret'),
          },
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('rejects unverified users even with a valid access token payload', async () => {
    usersService.findByIdForAuth.mockResolvedValue({
      id: 'user-1',
      fullName: 'Unverified User',
      email: 'user@example.com',
      role: 'USER',
      emailVerified: false,
      isActive: true,
    });

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'user@example.com',
        role: 'USER',
      }),
    ).rejects.toThrow(
      new UnauthorizedException(
        'Please verify your email address before signing in',
      ),
    );
  });
});
