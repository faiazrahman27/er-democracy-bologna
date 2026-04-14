import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type CreateUserInput = {
  fullName: string;
  email: string;
  passwordHash: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(input: CreateUserInput) {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        fullName: input.fullName.trim(),
        email: normalizedEmail,
        passwordHash: input.passwordHash,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async findByEmailForAuth(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    return this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        fullName: true,
        email: true,
        passwordHash: true,
        role: true,
        emailVerified: true,
        isActive: true,
        lockedUntil: true,
      },
    });
  }

  async findByIdForAuth(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
      },
    });
  }

  async updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
      },
      select: {
        id: true,
        lastLoginAt: true,
      },
    });
  }
}
