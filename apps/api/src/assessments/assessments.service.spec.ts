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
    voteSubmission: {
      findMany: jest.Mock;
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
      voteSubmission: {
        findMany: jest.fn(),
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

  it('includes specialized weighted-question answers in secret lookup responses', async () => {
    prismaService.assessment.findUnique.mockResolvedValue({
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
      completedAt: new Date('2026-04-01T12:00:00.000Z'),
      createdAt: new Date('2026-03-01T12:00:00.000Z'),
      updatedAt: new Date('2026-04-02T12:00:00.000Z'),
    });
    prismaService.voteSubmission.findMany.mockResolvedValue([
      {
        id: 'submission-1',
        submittedAt: new Date('2026-04-10T12:00:00.000Z'),
        weightUsed: 1.45,
        specializedBaseWeightUsed: 1.1,
        specializedQuestionModifierTotal: 0.35,
        selectedOption: {
          id: 'option-1',
          optionText: 'Option A',
        },
        vote: {
          id: 'vote-1',
          slug: 'mobility-plan',
          title: 'Mobility Plan',
        },
        weightedQuestionAnswers: [
          {
            questionId: 'question-2',
            optionId: 'answer-2',
            modifierUsed: -0.2,
            weightedQuestion: {
              prompt: 'How deeply are you affected by this topic?',
              displayOrder: 2,
            },
            selectedAnswerOption: {
              optionText: 'Somewhat affected',
              displayOrder: 2,
            },
          },
          {
            questionId: 'question-1',
            optionId: 'answer-1',
            modifierUsed: 0.35,
            weightedQuestion: {
              prompt: 'How closely does this topic match your expertise?',
              displayOrder: 1,
            },
            selectedAnswerOption: {
              optionText: 'Directly relevant',
              displayOrder: 1,
            },
          },
        ],
      },
    ]);

    const result = await service.getAssessmentBySecretUserId(
      'secret-1',
      'admin-1',
    );

    expect(result).toMatchObject({
      secretUserId: 'secret-1',
      specializedVoteSubmissions: [
        {
          submissionId: 'submission-1',
          selectedOptionId: 'option-1',
          selectedOptionText: 'Option A',
          weightUsed: 1.45,
          specializedBaseWeightUsed: 1.1,
          specializedQuestionModifierTotal: 0.35,
          weightedQuestionAnswers: [
            {
              questionId: 'question-1',
              questionPrompt: 'How closely does this topic match your expertise?',
              questionDisplayOrder: 1,
              selectedOptionId: 'answer-1',
              selectedOptionText: 'Directly relevant',
              optionDisplayOrder: 1,
              modifierUsed: 0.35,
            },
            {
              questionId: 'question-2',
              questionPrompt: 'How deeply are you affected by this topic?',
              questionDisplayOrder: 2,
              selectedOptionId: 'answer-2',
              selectedOptionText: 'Somewhat affected',
              optionDisplayOrder: 2,
              modifierUsed: -0.2,
            },
          ],
        },
      ],
    });
    expect(auditService.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        adminUserId: 'admin-1',
        actionType: 'ASSESSMENT_SECRET_LOOKUP',
        targetId: 'assessment-1',
      }),
    );
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
