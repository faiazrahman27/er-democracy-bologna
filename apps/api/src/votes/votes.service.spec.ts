import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import ExcelJS from 'exceljs';
import { VotesService } from './votes.service';
import { VoteStatusDto, VoteTypeDto } from './dto/create-vote.dto';
import { ResultVisibilityModeDto } from './dto/create-vote-display-settings.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as voteWeightUtil from '../common/voting/vote-weight.util';

describe('VotesService', () => {
  let service: VotesService;
  let prismaService: {
    vote: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    voteSubmission: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    assessment: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      vote: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      voteSubmission: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      assessment: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotesService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<VotesService>(VotesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('passes consultation metadata into SPECIALIZED weight calculation during submission', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      id: 'vote-1',
      title: 'University student housing and academic support',
      summary: 'Education consultation for campus services in Bologna',
      methodologySummary: 'Academic research and student participation',
      voteType: 'SPECIALIZED',
      topicCategory: 'governance',
      status: 'PUBLISHED',
      isPublished: true,
      startAt: new Date('2020-01-01T00:00:00.000Z'),
      endAt: new Date('2999-01-01T00:00:00.000Z'),
      options: [{ id: 'option-1' }],
    });
    prismaService.voteSubmission.findUnique.mockResolvedValue(null);
    prismaService.assessment.findUnique.mockResolvedValue({
      stakeholderRole: 'UNIVERSITY_STUDENT',
      backgroundCategory: 'EDUCATION',
      experienceLevel: 'EXPERT',
      yearsOfExperience: 12,
      studyLevel: 'MASTER_DEGREE',
      relationshipToArea: 'RESIDENT',
      city: 'BOLOGNA',
      region: 'EMILIA_ROMAGNA',
      country: 'ITALY',
      assessmentCompleted: true,
    });
    prismaService.voteSubmission.create.mockResolvedValue({
      id: 'submission-1',
      voteId: 'vote-1',
      userId: 'user-1',
      selectedOptionId: 'option-1',
      selfAssessmentScore: null,
      weightUsed: 1.75,
      calculationType: 'SPECIALIZED',
      submittedAt: new Date('2026-04-18T10:00:00.000Z'),
      createdAt: new Date('2026-04-18T10:00:00.000Z'),
    });

    const calculateVoteWeightSpy = jest.spyOn(
      voteWeightUtil,
      'calculateVoteWeight',
    );

    await service.submitVote('user-1', 'university-consultation', {
      selectedOptionId: 'option-1',
    });

    const [weightInput] = calculateVoteWeightSpy.mock.calls as [
      [Parameters<typeof voteWeightUtil.calculateVoteWeight>[0]],
    ];

    expect(weightInput[0]).toMatchObject({
      voteType: 'SPECIALIZED',
      topicCategory: 'governance',
      title: 'University student housing and academic support',
      summary: 'Education consultation for campus services in Bologna',
      methodologySummary: 'Academic research and student participation',
      assessment: {
        yearsOfExperience: 12,
        studyLevel: 'MASTER_DEGREE',
      },
    });
  });

  it('returns the friendly already-voted error when the unique vote submission constraint races', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      id: 'vote-1',
      title: 'Mobility Plan',
      summary: 'Summary',
      methodologySummary: null,
      voteType: 'GENERAL',
      topicCategory: 'mobility',
      status: 'PUBLISHED',
      isPublished: true,
      startAt: new Date('2020-01-01T00:00:00.000Z'),
      endAt: new Date('2999-01-01T00:00:00.000Z'),
      options: [{ id: 'option-1' }],
    });
    prismaService.voteSubmission.findUnique.mockResolvedValue(null);
    prismaService.voteSubmission.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.submitVote('user-1', 'mobility-plan', {
        selectedOptionId: 'option-1',
      }),
    ).rejects.toThrow(
      new ForbiddenException('You have already voted on this consultation'),
    );
  });

  it('rejects create requests that set isPublished on non-public workflow states', async () => {
    prismaService.vote.findUnique.mockResolvedValue(null);

    await expect(
      service.createVote('admin-1', {
        slug: 'mobility-plan',
        title: 'Mobility Plan',
        summary: 'Summary',
        voteType: VoteTypeDto.GENERAL,
        topicCategory: 'mobility',
        status: VoteStatusDto.APPROVED,
        startAt: '2026-05-01T12:00:00.000Z',
        endAt: '2026-05-10T12:00:00.000Z',
        isPublished: true,
        options: [
          { optionText: 'Option A', displayOrder: 1 },
          { optionText: 'Option B', displayOrder: 2 },
        ],
        displaySettings: {
          resultVisibilityMode: ResultVisibilityModeDto.SHOW_BOTH,
          showParticipationStats: false,
          showStakeholderBreakdown: false,
          showBackgroundBreakdown: false,
          showLocationBreakdown: false,
          showAgeRangeBreakdown: false,
          showGenderBreakdown: false,
          showExperienceLevelBreakdown: false,
          showYearsOfExperienceBreakdown: false,
          showStudyLevelBreakdown: false,
          showRelationshipBreakdown: false,
          showAfterVotingOnly: false,
          showOnlyAfterVoteCloses: false,
        },
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'isPublished can only be true when status is PUBLISHED or CLOSED',
      ),
    );
  });

  it('rejects updates that would leave PUBLISHED consultations hidden', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      id: 'vote-1',
      title: 'Mobility Plan',
      summary: 'Summary',
      methodologySummary: null,
      status: 'PUBLISHED',
      startAt: new Date('2026-05-01T12:00:00.000Z'),
      endAt: new Date('2026-05-10T12:00:00.000Z'),
      isPublished: true,
      submissions: [],
      displaySettings: null,
    });

    await expect(
      service.updateVote('mobility-plan', {
        isPublished: false,
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'PUBLISHED and CLOSED consultations must keep isPublished enabled',
      ),
    );
  });

  it('includes years-of-experience and study-level breakdowns when those analytics are enabled', async () => {
    prismaService.vote.findFirst.mockResolvedValue({
      id: 'vote-1',
      slug: 'mobility-plan',
      title: 'Mobility Plan',
      endAt: new Date('2026-05-01T12:00:00.000Z'),
      displaySettings: {
        resultVisibilityMode: 'SHOW_BOTH',
        showAfterVotingOnly: false,
        showOnlyAfterVoteCloses: false,
        showParticipationStats: false,
        showStakeholderBreakdown: false,
        showBackgroundBreakdown: false,
        showLocationBreakdown: false,
        showAgeRangeBreakdown: false,
        showGenderBreakdown: false,
        showExperienceLevelBreakdown: false,
        showYearsOfExperienceBreakdown: true,
        showStudyLevelBreakdown: true,
        showRelationshipBreakdown: false,
      },
      submissions: [
        {
          userId: 'user-1',
          user: {
            assessment: {
              yearsOfExperience: 2,
              studyLevel: 'BACHELOR_DEGREE',
            },
          },
        },
        {
          userId: 'user-2',
          user: {
            assessment: {
              yearsOfExperience: 2,
              studyLevel: 'MASTER_DEGREE',
            },
          },
        },
        {
          userId: 'user-3',
          user: {
            assessment: {
              yearsOfExperience: 5,
              studyLevel: 'MASTER_DEGREE',
            },
          },
        },
      ],
    });

    const result = await service.getPublicAnalytics('mobility-plan');

    expect(result.visibility.canShowAnalytics).toBe(true);
    expect(result.analytics).toEqual({
      yearsOfExperienceBreakdown: [
        { label: '2', count: 2, percentage: 66.67 },
        { label: '5', count: 1, percentage: 33.33 },
      ],
      studyLevelBreakdown: [
        { label: 'BACHELOR_DEGREE', count: 1, percentage: 33.33 },
        { label: 'MASTER_DEGREE', count: 2, percentage: 66.67 },
      ],
    });
  });

  it('shows public analytics when analytics are enabled even if public results are hidden', async () => {
    prismaService.vote.findFirst.mockResolvedValue({
      id: 'vote-1',
      slug: 'mobility-plan',
      title: 'Mobility Plan',
      endAt: new Date('2026-05-01T12:00:00.000Z'),
      displaySettings: {
        resultVisibilityMode: 'HIDE_ALL',
        showAfterVotingOnly: false,
        showOnlyAfterVoteCloses: false,
        showParticipationStats: false,
        showStakeholderBreakdown: true,
        showBackgroundBreakdown: false,
        showLocationBreakdown: false,
        showAgeRangeBreakdown: false,
        showGenderBreakdown: false,
        showExperienceLevelBreakdown: false,
        showRelationshipBreakdown: false,
      },
      submissions: Array.from({ length: 5 }, (_, index) => ({
        userId: `user-${index + 1}`,
        user: {
          assessment: {
            stakeholderRole: 'RESIDENT',
            backgroundCategory: null,
            experienceLevel: null,
            relationshipToArea: null,
            city: null,
            region: null,
            country: null,
            ageRange: null,
            gender: null,
          },
        },
      })),
    });

    const result = await service.getPublicAnalytics('mobility-plan');

    expect(result.visibility.canShowAnalytics).toBe(true);
    expect(result.analytics).toEqual({
      stakeholderBreakdown: [
        {
          label: 'RESIDENT',
          count: 5,
          percentage: 100,
        },
      ],
    });
  });

  it('keeps the existing timing gate for analytics when visibility is set to after voting only', async () => {
    prismaService.vote.findFirst.mockResolvedValue({
      id: 'vote-1',
      slug: 'mobility-plan',
      title: 'Mobility Plan',
      endAt: new Date('2026-05-01T12:00:00.000Z'),
      displaySettings: {
        resultVisibilityMode: 'SHOW_BOTH',
        showAfterVotingOnly: true,
        showOnlyAfterVoteCloses: false,
        showParticipationStats: true,
        showStakeholderBreakdown: false,
        showBackgroundBreakdown: false,
        showLocationBreakdown: false,
        showAgeRangeBreakdown: false,
        showGenderBreakdown: false,
        showExperienceLevelBreakdown: false,
        showRelationshipBreakdown: false,
      },
      submissions: [],
    });

    const result = await service.getPublicAnalytics('mobility-plan');

    expect(result).toEqual({
      slug: 'mobility-plan',
      title: 'Mobility Plan',
      visibility: {
        canShowAnalytics: false,
      },
      analytics: null,
    });
  });

  it('shows low-count public breakdowns without suppressing or collapsing them', async () => {
    prismaService.vote.findFirst.mockResolvedValue({
      id: 'vote-1',
      slug: 'mobility-plan',
      title: 'Mobility Plan',
      endAt: new Date('2026-05-01T12:00:00.000Z'),
      displaySettings: {
        resultVisibilityMode: 'SHOW_BOTH',
        showAfterVotingOnly: false,
        showOnlyAfterVoteCloses: false,
        showParticipationStats: false,
        showStakeholderBreakdown: true,
        showBackgroundBreakdown: false,
        showLocationBreakdown: false,
        showAgeRangeBreakdown: false,
        showGenderBreakdown: false,
        showExperienceLevelBreakdown: false,
        showRelationshipBreakdown: false,
      },
      submissions: [
        {
          userId: 'user-1',
          user: {
            assessment: {
              stakeholderRole: 'RESIDENT',
              backgroundCategory: null,
              experienceLevel: null,
              relationshipToArea: null,
              city: null,
              region: null,
              country: null,
              ageRange: null,
              gender: null,
            },
          },
        },
        {
          userId: 'user-2',
          user: {
            assessment: {
              stakeholderRole: 'VISITOR',
              backgroundCategory: null,
              experienceLevel: null,
              relationshipToArea: null,
              city: null,
              region: null,
              country: null,
              ageRange: null,
              gender: null,
            },
          },
        },
        {
          userId: 'user-3',
          user: {
            assessment: {
              stakeholderRole: 'NON_RESIDENT',
              backgroundCategory: null,
              experienceLevel: null,
              relationshipToArea: null,
              city: null,
              region: null,
              country: null,
              ageRange: null,
              gender: null,
            },
          },
        },
        {
          userId: 'user-4',
          user: {
            assessment: {
              stakeholderRole: 'RESIDENT',
              backgroundCategory: null,
              experienceLevel: null,
              relationshipToArea: null,
              city: null,
              region: null,
              country: null,
              ageRange: null,
              gender: null,
            },
          },
        },
      ],
    });

    const result = await service.getPublicAnalytics('mobility-plan');

    expect(result.visibility.canShowAnalytics).toBe(true);
    expect(result.analytics).toEqual({
      stakeholderBreakdown: [
        {
          label: 'RESIDENT',
          count: 2,
          percentage: 50,
        },
        {
          label: 'NON_RESIDENT',
          count: 1,
          percentage: 25,
        },
        {
          label: 'VISITOR',
          count: 1,
          percentage: 25,
        },
      ],
    });
  });

  it('filters unpublished consultations out of public results lookups', async () => {
    prismaService.vote.findFirst.mockResolvedValue(null);

    await expect(
      service.getPublicResults('mobility-plan'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prismaService.vote.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: 'mobility-plan',
          isPublished: true,
          status: {
            in: ['PUBLISHED', 'CLOSED'],
          },
        },
      }),
    );
  });

  it('filters unpublished consultations out of public analytics lookups', async () => {
    prismaService.vote.findFirst.mockResolvedValue(null);

    await expect(
      service.getPublicAnalytics('mobility-plan'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prismaService.vote.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: 'mobility-plan',
          isPublished: true,
          status: {
            in: ['PUBLISHED', 'CLOSED'],
          },
        },
      }),
    );
  });

  it('treats CLOSED consultations as past even before the scheduled end date', async () => {
    prismaService.vote.findFirst.mockResolvedValue({
      id: 'vote-1',
      slug: 'mobility-plan',
      title: 'Mobility Plan',
      summary: 'Summary',
      methodologySummary: null,
      voteType: 'GENERAL',
      topicCategory: 'mobility',
      status: 'CLOSED',
      coverImageUrl: null,
      coverImageAlt: null,
      startAt: new Date('2026-04-01T12:00:00.000Z'),
      endAt: new Date('2999-05-01T12:00:00.000Z'),
      isPublished: true,
      publishedAt: new Date('2026-04-01T12:00:00.000Z'),
      createdAt: new Date('2026-04-01T12:00:00.000Z'),
      updatedAt: new Date('2026-04-02T12:00:00.000Z'),
      options: [],
      displaySettings: null,
    });

    const result = await service.getPublicVoteBySlug('mobility-plan');

    expect(result.derivedStatus).toBe('PAST');
  });

  it('omits secret user IDs from participant lists without secret lookup access', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      id: 'vote-1',
      slug: 'mobility-plan',
      title: 'Mobility Plan',
      submissions: [
        {
          id: 'submission-1',
          selectedOptionId: 'option-1',
          weightUsed: 1,
          calculationType: 'GENERAL',
          selfAssessmentScore: null,
          submittedAt: new Date('2026-04-10T12:00:00.000Z'),
          selectedOption: {
            optionText: 'Option A',
          },
          user: {
            assessment: {
              secretUserId: 'secret-1',
              assessmentCompleted: true,
            },
          },
        },
      ],
    });

    const result = await service.getAdminParticipants('mobility-plan');

    expect(result.participants[0]).toEqual({
      submissionId: 'submission-1',
      selectedOptionId: 'option-1',
      selectedOptionText: 'Option A',
      weightUsed: 1,
      calculationType: 'GENERAL',
      selfAssessmentScore: null,
      submittedAt: new Date('2026-04-10T12:00:00.000Z'),
      hasCompletedAssessment: true,
    });
    expect(result.participants[0]).not.toHaveProperty('secretUserId');
  });

  it('includes secret user IDs in participant lists when secret lookup access is enabled', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      id: 'vote-1',
      slug: 'mobility-plan',
      title: 'Mobility Plan',
      submissions: [
        {
          id: 'submission-1',
          selectedOptionId: 'option-1',
          weightUsed: 1,
          calculationType: 'GENERAL',
          selfAssessmentScore: null,
          submittedAt: new Date('2026-04-10T12:00:00.000Z'),
          selectedOption: {
            optionText: 'Option A',
          },
          user: {
            assessment: {
              secretUserId: 'secret-1',
              assessmentCompleted: true,
            },
          },
        },
      ],
    });

    const result = await service.getAdminParticipants('mobility-plan', {
      includeSecretUserId: true,
    });

    expect(result.participants[0]).toMatchObject({
      submissionId: 'submission-1',
      secretUserId: 'secret-1',
    });
  });

  it('omits the participants sheet when export is generated without participant access', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      id: 'vote-1',
      slug: 'mobility-plan',
      title: 'Mobility Plan',
      voteType: 'GENERAL',
      topicCategory: 'mobility',
      status: 'PUBLISHED',
      startAt: new Date('2026-04-01T12:00:00.000Z'),
      endAt: new Date('2026-05-01T12:00:00.000Z'),
      isPublished: true,
      publishedAt: new Date('2026-04-01T12:00:00.000Z'),
      options: [
        {
          id: 'option-1',
          optionText: 'Option A',
          displayOrder: 1,
        },
      ],
      submissions: [
        {
          id: 'submission-1',
          selectedOptionId: 'option-1',
          weightUsed: 1,
          calculationType: 'GENERAL',
          selfAssessmentScore: 5,
          submittedAt: new Date('2026-04-10T12:00:00.000Z'),
          selectedOption: {
            optionText: 'Option A',
          },
          user: {
            assessment: {
              secretUserId: 'secret-1',
              assessmentCompleted: true,
              ageRange: 'AGE_25_34',
              gender: 'FEMALE',
              stakeholderRole: 'RESIDENT',
              backgroundCategory: 'CITIZEN',
              experienceLevel: 'INTERMEDIATE',
              relationshipToArea: 'RESIDENT',
              city: 'Bologna',
              region: 'Emilia-Romagna',
              country: 'Italy',
            },
          },
        },
      ],
    });

    const file = await service.exportAdminAnalyticsExcel('mobility-plan');
    const workbook = new ExcelJS.Workbook();
    const workbookBuffer = file.buffer as unknown as Parameters<
      typeof workbook.xlsx.load
    >[0];

    await workbook.xlsx.load(workbookBuffer);

    expect(
      workbook.worksheets.map((worksheet) => worksheet.name),
    ).not.toContain('Participants');
  });

  it('keeps participant exports but strips secret and demographic columns without secret lookup access', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      id: 'vote-1',
      slug: 'mobility-plan',
      title: 'Mobility Plan',
      voteType: 'GENERAL',
      topicCategory: 'mobility',
      status: 'PUBLISHED',
      startAt: new Date('2026-04-01T12:00:00.000Z'),
      endAt: new Date('2026-05-01T12:00:00.000Z'),
      isPublished: true,
      publishedAt: new Date('2026-04-01T12:00:00.000Z'),
      options: [
        {
          id: 'option-1',
          optionText: 'Option A',
          displayOrder: 1,
        },
      ],
      submissions: [
        {
          id: 'submission-1',
          selectedOptionId: 'option-1',
          weightUsed: 1,
          calculationType: 'GENERAL',
          selfAssessmentScore: 5,
          submittedAt: new Date('2026-04-10T12:00:00.000Z'),
          selectedOption: {
            optionText: 'Option A',
          },
          user: {
            assessment: {
              secretUserId: 'secret-1',
              assessmentCompleted: true,
              ageRange: 'AGE_25_34',
              gender: 'FEMALE',
              stakeholderRole: 'RESIDENT',
              backgroundCategory: 'CITIZEN',
              experienceLevel: 'INTERMEDIATE',
              relationshipToArea: 'RESIDENT',
              city: 'Bologna',
              region: 'Emilia-Romagna',
              country: 'Italy',
            },
          },
        },
      ],
    });

    const file = await service.exportAdminAnalyticsExcel('mobility-plan', {
      includeParticipantSheet: true,
    });
    const workbook = new ExcelJS.Workbook();
    const workbookBuffer = file.buffer as unknown as Parameters<
      typeof workbook.xlsx.load
    >[0];

    await workbook.xlsx.load(workbookBuffer);

    const participantsSheet = workbook.getWorksheet('Participants');
    const headers = getWorksheetHeaders(participantsSheet);

    expect(participantsSheet).toBeDefined();
    expect(headers).not.toContain('Secret User ID');
    expect(headers).not.toContain('Age Range');
    expect(headers).not.toContain('Gender');
  });

  it('includes secret and demographic columns in participant exports with secret lookup access', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      id: 'vote-1',
      slug: 'mobility-plan',
      title: 'Mobility Plan',
      voteType: 'GENERAL',
      topicCategory: 'mobility',
      status: 'PUBLISHED',
      startAt: new Date('2026-04-01T12:00:00.000Z'),
      endAt: new Date('2026-05-01T12:00:00.000Z'),
      isPublished: true,
      publishedAt: new Date('2026-04-01T12:00:00.000Z'),
      options: [
        {
          id: 'option-1',
          optionText: 'Option A',
          displayOrder: 1,
        },
      ],
      submissions: [
        {
          id: 'submission-1',
          selectedOptionId: 'option-1',
          weightUsed: 1,
          calculationType: 'GENERAL',
          selfAssessmentScore: 5,
          submittedAt: new Date('2026-04-10T12:00:00.000Z'),
          selectedOption: {
            optionText: 'Option A',
          },
          user: {
            assessment: {
              secretUserId: 'secret-1',
              assessmentCompleted: true,
              ageRange: 'AGE_25_34',
              gender: 'FEMALE',
              stakeholderRole: 'RESIDENT',
              backgroundCategory: 'CITIZEN',
              experienceLevel: 'INTERMEDIATE',
              yearsOfExperience: 5,
              studyLevel: 'MASTER_DEGREE',
              relationshipToArea: 'RESIDENT',
              city: 'Bologna',
              region: 'Emilia-Romagna',
              country: 'Italy',
            },
          },
        },
      ],
    });

    const file = await service.exportAdminAnalyticsExcel('mobility-plan', {
      includeParticipantSheet: true,
      includeSecretUserId: true,
      includeSensitiveAssessmentDetails: true,
    });
    const workbook = new ExcelJS.Workbook();
    const workbookBuffer = file.buffer as unknown as Parameters<
      typeof workbook.xlsx.load
    >[0];

    await workbook.xlsx.load(workbookBuffer);

    const participantsSheet = workbook.getWorksheet('Participants');
    const headers = getWorksheetHeaders(participantsSheet);

    expect(headers).toContain('Secret User ID');
    expect(headers).toContain('Age Range');
    expect(headers).toContain('Study Level');
  });

  it('normalizes conflicting timing settings when loading admin consultation details', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      id: 'vote-1',
      slug: 'mobility-plan',
      title: 'Mobility Plan',
      summary: 'Summary',
      methodologySummary: null,
      voteType: 'GENERAL',
      topicCategory: 'mobility',
      status: 'PUBLISHED',
      coverImageUrl: null,
      coverImageAlt: null,
      startAt: new Date('2026-04-10T12:00:00.000Z'),
      endAt: new Date('2026-04-20T12:00:00.000Z'),
      isPublished: true,
      publishedAt: new Date('2026-04-10T12:00:00.000Z'),
      lockedAt: null,
      createdByAdminId: 'admin-1',
      createdAt: new Date('2026-04-01T12:00:00.000Z'),
      updatedAt: new Date('2026-04-02T12:00:00.000Z'),
      options: [],
      displaySettings: {
        id: 'display-1',
        resultVisibilityMode: 'SHOW_BOTH',
        showParticipationStats: true,
        showStakeholderBreakdown: true,
        showBackgroundBreakdown: false,
        showLocationBreakdown: false,
        showAgeRangeBreakdown: false,
        showGenderBreakdown: false,
        showExperienceLevelBreakdown: false,
        showRelationshipBreakdown: false,
        showAfterVotingOnly: true,
        showOnlyAfterVoteCloses: true,
        createdAt: new Date('2026-04-01T12:00:00.000Z'),
        updatedAt: new Date('2026-04-02T12:00:00.000Z'),
      },
      submissions: [],
    });

    const result = await service.getAdminVoteBySlug('mobility-plan');

    expect(result.displaySettings).toMatchObject({
      showAfterVotingOnly: false,
      showOnlyAfterVoteCloses: true,
    });
  });
});

function getWorksheetHeaders(worksheet?: ExcelJS.Worksheet) {
  const values = worksheet?.getRow(1).values;

  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .slice(1)
    .filter((value): value is string => typeof value === 'string');
}
