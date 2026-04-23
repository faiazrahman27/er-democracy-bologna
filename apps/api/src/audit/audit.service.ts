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
        adminUserId: this.truncateValue(input.adminUserId, 100),
        actionType: this.truncateValue(input.actionType, 100),
        targetType: this.truncateValue(input.targetType, 100),
        targetId: this.truncateValue(input.targetId, 100),
        beforeJson:
          input.beforeJson !== undefined
            ? (input.beforeJson as object)
            : undefined,
        afterJson:
          input.afterJson !== undefined
            ? (input.afterJson as object)
            : undefined,
        reason: this.truncateOptionalValue(input.reason, 500),
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
        attemptedEmail: this.truncateOptionalValue(input.attemptedEmail, 255),
        eventType: this.truncateValue(input.eventType, 100),
        ipAddress: this.truncateOptionalValue(input.ipAddress, 100),
        userAgent: this.truncateOptionalValue(input.userAgent, 500),
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

  private truncateValue(value: string, maxLength: number): string {
    return value.trim().slice(0, maxLength);
  }

  private truncateOptionalValue(
    value: string | null | undefined,
    maxLength: number,
  ): string | undefined {
    const normalized = value?.trim();

    if (!normalized) {
      return undefined;
    }

    return normalized.slice(0, maxLength);
  }
}
