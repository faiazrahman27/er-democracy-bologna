import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type AuditLogInput = {
  adminUserId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  reason?: string;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logAdminAction(input: AuditLogInput) {
    return this.prisma.adminAuditLog.create({
      data: {
        adminUserId: input.adminUserId,
        actionType: input.actionType,
        targetType: input.targetType,
        targetId: input.targetId,
        beforeJson:
          input.beforeJson !== undefined ? (input.beforeJson as object) : undefined,
        afterJson:
          input.afterJson !== undefined ? (input.afterJson as object) : undefined,
        reason: input.reason,
      },
      select: {
        id: true,
        adminUserId: true,
        actionType: true,
        targetType: true,
        targetId: true,
        createdAt: true,
      },
    });
  }
}
