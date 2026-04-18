import { Test, TestingModule } from '@nestjs/testing';
import { VotesService } from './votes.service';
import { PrismaService } from '../prisma/prisma.service';
import * as voteWeightUtil from '../common/voting/vote-weight.util';

describe('VotesService', () => {
  let service: VotesService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      vote: {
        findUnique: jest.fn(),
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

    expect(calculateVoteWeightSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        voteType: 'SPECIALIZED',
        topicCategory: 'governance',
        title: 'University student housing and academic support',
        summary: 'Education consultation for campus services in Bologna',
        methodologySummary: 'Academic research and student participation',
      }),
    );
  });

  it('shows public analytics when analytics are enabled even if public results are hidden', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
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
    prismaService.vote.findUnique.mockResolvedValue({
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
    prismaService.vote.findUnique.mockResolvedValue({
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
