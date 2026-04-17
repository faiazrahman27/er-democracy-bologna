import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export type CreateUserInput = {
  fullName: string;
  email: string;
  passwordHash: string;
  termsAcceptedAt: Date;
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
        termsAcceptedAt: input.termsAcceptedAt,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        termsAcceptedAt: true,
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
        failedLoginCount: true,
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

  async exportMyData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
        lastLoginAt: true,
        termsAcceptedAt: true,
        createdAt: true,
        updatedAt: true,
        assessment: {
          select: {
            id: true,
            ageRange: true,
            gender: true,
            city: true,
            region: true,
            country: true,
            stakeholderRole: true,
            backgroundCategory: true,
            experienceLevel: true,
            relationshipToArea: true,
            assessmentCompleted: true,
            completedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        voteSubmissions: {
          select: {
            id: true,
            selfAssessmentScore: true,
            weightUsed: true,
            calculationType: true,
            submittedAt: true,
            createdAt: true,
            vote: {
              select: {
                id: true,
                slug: true,
                title: true,
                voteType: true,
                topicCategory: true,
                status: true,
                startAt: true,
                endAt: true,
                isPublished: true,
                publishedAt: true,
              },
            },
            selectedOption: {
              select: {
                id: true,
                optionText: true,
                displayOrder: true,
              },
            },
          },
        },
        createdVotes: {
          select: {
            id: true,
            slug: true,
            title: true,
            summary: true,
            methodologySummary: true,
            voteType: true,
            topicCategory: true,
            status: true,
            coverImageUrl: true,
            coverImageAlt: true,
            startAt: true,
            endAt: true,
            isPublished: true,
            publishedAt: true,
            lockedAt: true,
            createdAt: true,
            updatedAt: true,
            options: {
              select: {
                id: true,
                optionText: true,
                displayOrder: true,
                createdAt: true,
              },
            },
            displaySettings: {
              select: {
                id: true,
                resultVisibilityMode: true,
                showParticipationStats: true,
                showStakeholderBreakdown: true,
                showBackgroundBreakdown: true,
                showLocationBreakdown: true,
                showAgeRangeBreakdown: true,
                showGenderBreakdown: true,
                showExperienceLevelBreakdown: true,
                showRelationshipBreakdown: true,
                showAfterVotingOnly: true,
                showOnlyAfterVoteCloses: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        createdArticles: {
          select: {
            id: true,
            slug: true,
            title: true,
            summary: true,
            content: true,
            coverImageUrl: true,
            coverImageAlt: true,
            status: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        authAuditLogs: {
          select: {
            id: true,
            attemptedEmail: true,
            eventType: true,
            ipAddress: true,
            userAgent: true,
            metadataJson: true,
            createdAt: true,
          },
        },
        auditLogs: {
          select: {
            id: true,
            actionType: true,
            targetType: true,
            targetId: true,
            beforeJson: true,
            afterJson: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const {
      assessment,
      voteSubmissions,
      createdVotes,
      createdArticles,
      authAuditLogs,
      auditLogs,
      ...safeUser
    } = user;

    return {
      message: 'User data export successful',
      data: {
        user: safeUser,
        assessment,
        voteSubmissions,
        createdVotes,
        createdArticles,
        authAuditLogs,
        auditLogs,
      },
    };
  }

  async deleteMyAccount(userId: string) {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const deletedEmail = `deleted+${userId}@deleted.local`;
      const deletedPasswordHash = `deleted:${randomBytes(32).toString('hex')}`;

      await tx.refreshToken.deleteMany({
        where: { userId },
      });
      await tx.passwordResetToken.deleteMany({
        where: { userId },
      });
      await tx.emailVerificationToken.deleteMany({
        where: { userId },
      });
      await tx.authAuditLog.deleteMany({
        where: { userId },
      });

      // Keep rows referenced by Restrict relations, but remove direct account access.
      await tx.user.update({
        where: { id: userId },
        data: {
          fullName: 'Deleted User',
          email: deletedEmail,
          passwordHash: deletedPasswordHash,
          emailVerified: false,
          isActive: false,
          lastLoginAt: null,
          failedLoginCount: 0,
          lockedUntil: null,
          termsAcceptedAt: null,
        },
      });
    });

    return {
      message: 'Account deleted successfully',
    };
  }
}
