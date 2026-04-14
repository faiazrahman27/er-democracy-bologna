import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async testDb() {
    const users = await this.prisma.user.count();

    return {
      message: 'Database connected successfully',
      userCount: users,
    };
  }
}
