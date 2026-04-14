import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertAssessmentDto } from './dto/upsert-assessment.dto';
import { generateSecretUserId } from '../common/utils/secret-user-id.util';
import { AuditService } from '../audit/audit.service';

const MY_ASSESSMENT_SELECT = {
  id: true,
  userId: true,
  secretUserId: true,
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
} as const;

const PSEUDONYMOUS_ASSESSMENT_SELECT = {
  id: true,
  secretUserId: true,
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
} as const;

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getMyAssessment(userId: string) {
    return this.prisma.assessment.findUnique({
      where: { userId },
      select: MY_ASSESSMENT_SELECT,
    });
  }

  async upsertMyAssessment(userId: string, dto: UpsertAssessmentDto) {
    const existing = await this.prisma.assessment.findUnique({
      where: { userId },
      select: {
        id: true,
        secretUserId: true,
      },
    });

    const completedAt = dto.assessmentCompleted ? new Date() : null;

    if (existing) {
      return this.prisma.assessment.update({
        where: { userId },
        data: {
          ageRange: dto.ageRange?.trim(),
          gender: dto.gender?.trim(),
          city: dto.city?.trim(),
          region: dto.region?.trim(),
          country: dto.country?.trim(),
          stakeholderRole: dto.stakeholderRole?.trim(),
          backgroundCategory: dto.backgroundCategory?.trim(),
          experienceLevel: dto.experienceLevel?.trim(),
          relationshipToArea: dto.relationshipToArea?.trim(),
          assessmentCompleted: dto.assessmentCompleted,
          completedAt,
        },
        select: MY_ASSESSMENT_SELECT,
      });
    }

    return this.prisma.assessment.create({
      data: {
        userId,
        secretUserId: generateSecretUserId(),
        ageRange: dto.ageRange?.trim(),
        gender: dto.gender?.trim(),
        city: dto.city?.trim(),
        region: dto.region?.trim(),
        country: dto.country?.trim(),
        stakeholderRole: dto.stakeholderRole?.trim(),
        backgroundCategory: dto.backgroundCategory?.trim(),
        experienceLevel: dto.experienceLevel?.trim(),
        relationshipToArea: dto.relationshipToArea?.trim(),
        assessmentCompleted: dto.assessmentCompleted,
        completedAt,
      },
      select: MY_ASSESSMENT_SELECT,
    });
  }

  async getAssessmentBySecretUserId(secretUserId: string, adminUserId?: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { secretUserId },
      select: PSEUDONYMOUS_ASSESSMENT_SELECT,
    });

    if (!assessment) {
      throw new NotFoundException(
        `No pseudonymous assessment found for secret user ID "${secretUserId}"`,
      );
    }

    if (adminUserId) {
      await this.auditService.logAdminAction({
        adminUserId,
        actionType: 'ASSESSMENT_SECRET_LOOKUP',
        targetType: 'Assessment',
        targetId: assessment.id,
        afterJson: {
          secretUserId: assessment.secretUserId,
          assessmentCompleted: assessment.assessmentCompleted,
          lookedUpAt: new Date().toISOString(),
        },
      });
    }

    return assessment;
  }
}
