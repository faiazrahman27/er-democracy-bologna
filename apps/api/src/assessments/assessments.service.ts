import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssessmentCountryDto,
  AssessmentRegionDto,
  UpsertAssessmentDto,
} from './dto/upsert-assessment.dto';
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
  yearsOfExperience: true,
  studyLevel: true,
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
  yearsOfExperience: true,
  studyLevel: true,
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
        assessmentCompleted: true,
        completedAt: true,
      },
    });

    const normalizedAssessment = this.normalizeAssessmentDto(dto);

    const completedAt = normalizedAssessment.assessmentCompleted
      ? (existing?.completedAt ?? new Date())
      : null;

    if (existing) {
      return this.prisma.assessment.update({
        where: { userId },
        data: {
          ageRange: normalizedAssessment.ageRange,
          gender: normalizedAssessment.gender,
          city: normalizedAssessment.city,
          region: normalizedAssessment.region,
          country: normalizedAssessment.country,
          stakeholderRole: normalizedAssessment.stakeholderRole,
          backgroundCategory: normalizedAssessment.backgroundCategory,
          experienceLevel: normalizedAssessment.experienceLevel,
          yearsOfExperience: normalizedAssessment.yearsOfExperience,
          studyLevel: normalizedAssessment.studyLevel,
          relationshipToArea: normalizedAssessment.relationshipToArea,
          assessmentCompleted: normalizedAssessment.assessmentCompleted,
          completedAt,
        },
        select: MY_ASSESSMENT_SELECT,
      });
    }

    return this.prisma.assessment.create({
      data: {
        userId,
        secretUserId: generateSecretUserId(),
        ageRange: normalizedAssessment.ageRange,
        gender: normalizedAssessment.gender,
        city: normalizedAssessment.city,
        region: normalizedAssessment.region,
        country: normalizedAssessment.country,
        stakeholderRole: normalizedAssessment.stakeholderRole,
        backgroundCategory: normalizedAssessment.backgroundCategory,
        experienceLevel: normalizedAssessment.experienceLevel,
        yearsOfExperience: normalizedAssessment.yearsOfExperience,
        studyLevel: normalizedAssessment.studyLevel,
        relationshipToArea: normalizedAssessment.relationshipToArea,
        assessmentCompleted: normalizedAssessment.assessmentCompleted,
        completedAt,
      },
      select: MY_ASSESSMENT_SELECT,
    });
  }

  async getAssessmentBySecretUserId(
    secretUserId: string,
    adminUserId?: string,
  ) {
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

  private normalizeAssessmentDto(
    dto: UpsertAssessmentDto,
  ): UpsertAssessmentDto {
    return {
      ...dto,
      country: AssessmentCountryDto.ITALY,
      region: AssessmentRegionDto.EMILIA_ROMAGNA,
    };
  }
}
