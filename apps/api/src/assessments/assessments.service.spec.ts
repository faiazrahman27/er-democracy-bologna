import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentsService } from './assessments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  AssessmentAgeRangeDto,
  AssessmentBackgroundCategoryDto,
  AssessmentCityDto,
  AssessmentCountryDto,
  AssessmentExperienceLevelDto,
  AssessmentGenderDto,
  AssessmentRegionDto,
  AssessmentRelationshipToAreaDto,
  AssessmentStakeholderRoleDto,
  AssessmentStudyLevelDto,
} from './dto/upsert-assessment.dto';

describe('AssessmentsService', () => {
  let service: AssessmentsService;
  let prismaService: {
    assessment: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let auditService: {
    logAdminAction: jest.Mock;
  };

  beforeEach(async () => {
    prismaService = {
      assessment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    auditService = {
      logAdminAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentsService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
      ],
    }).compile();

    service = module.get<AssessmentsService>(AssessmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('preserves the original completedAt timestamp on later completed saves', async () => {
    const originalCompletedAt = new Date('2026-04-01T12:00:00.000Z');

    prismaService.assessment.findUnique.mockResolvedValue({
      id: 'assessment-1',
      secretUserId: 'secret-1',
      assessmentCompleted: true,
      completedAt: originalCompletedAt,
    });
    prismaService.assessment.update.mockResolvedValue({
      id: 'assessment-1',
      userId: 'user-1',
      secretUserId: 'secret-1',
      ageRange: AssessmentAgeRangeDto.AGE_25_34,
      gender: AssessmentGenderDto.FEMALE,
      city: AssessmentCityDto.BOLOGNA,
      region: AssessmentRegionDto.EMILIA_ROMAGNA,
      country: AssessmentCountryDto.ITALY,
      stakeholderRole: AssessmentStakeholderRoleDto.UNIVERSITY_STUDENT,
      backgroundCategory: AssessmentBackgroundCategoryDto.EDUCATION,
      experienceLevel: AssessmentExperienceLevelDto.INTERMEDIATE,
      yearsOfExperience: 5,
      studyLevel: AssessmentStudyLevelDto.MASTER_DEGREE,
      relationshipToArea: AssessmentRelationshipToAreaDto.RESIDENT,
      assessmentCompleted: true,
      completedAt: originalCompletedAt,
      createdAt: new Date('2026-03-01T12:00:00.000Z'),
      updatedAt: new Date('2026-04-02T12:00:00.000Z'),
    });

    await service.upsertMyAssessment('user-1', buildAssessmentDto(true));

    const [[updateCall]] = prismaService.assessment.update.mock.calls as [
      [
        {
          data: {
            completedAt: Date | null;
          };
        },
      ],
    ];

    expect(updateCall.data.completedAt).toBe(originalCompletedAt);
  });

  it('clears completedAt when an assessment is saved back to draft', async () => {
    prismaService.assessment.findUnique.mockResolvedValue({
      id: 'assessment-1',
      secretUserId: 'secret-1',
      assessmentCompleted: true,
      completedAt: new Date('2026-04-01T12:00:00.000Z'),
    });
    prismaService.assessment.update.mockResolvedValue({});

    await service.upsertMyAssessment('user-1', buildAssessmentDto(false));

    const [[updateCall]] = prismaService.assessment.update.mock.calls as [
      [
        {
          data: {
            assessmentCompleted: boolean;
            completedAt: Date | null;
          };
        },
      ],
    ];

    expect(updateCall.data.assessmentCompleted).toBe(false);
    expect(updateCall.data.completedAt).toBeNull();
  });
});

function buildAssessmentDto(assessmentCompleted: boolean) {
  return {
    ageRange: AssessmentAgeRangeDto.AGE_25_34,
    gender: AssessmentGenderDto.FEMALE,
    city: AssessmentCityDto.BOLOGNA,
    region: AssessmentRegionDto.EMILIA_ROMAGNA,
    country: AssessmentCountryDto.ITALY,
    stakeholderRole: AssessmentStakeholderRoleDto.UNIVERSITY_STUDENT,
    backgroundCategory: AssessmentBackgroundCategoryDto.EDUCATION,
    experienceLevel: AssessmentExperienceLevelDto.INTERMEDIATE,
    yearsOfExperience: 5,
    studyLevel: AssessmentStudyLevelDto.MASTER_DEGREE,
    relationshipToArea: AssessmentRelationshipToAreaDto.RESIDENT,
    assessmentCompleted,
  };
}
