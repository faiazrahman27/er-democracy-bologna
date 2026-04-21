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

type AuthAuditLogInput = {
  userId?: string | null;
  attemptedEmail?: string | null;
  eventType: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
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
          input.beforeJson !== undefined
            ? (input.beforeJson as object)
            : undefined,
        afterJson:
          input.afterJson !== undefined
            ? (input.afterJson as object)
            : undefined,
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

  async logAuthEvent(input: AuthAuditLogInput) {
    return this.prisma.authAuditLog.create({
      data: {
        userId: input.userId ?? undefined,
        attemptedEmail: input.attemptedEmail ?? undefined,
        eventType: input.eventType,
        ipAddress: input.ipAddress ?? undefined,
        userAgent: input.userAgent ?? undefined,
        metadataJson:
          input.metadata !== undefined ? (input.metadata as object) : undefined,
      },
      select: {
        id: true,
        userId: true,
        attemptedEmail: true,
        eventType: true,
        ipAddress: true,
        createdAt: true,
      },
    });
  }
}
