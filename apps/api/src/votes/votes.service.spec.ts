import { Test, TestingModule } from '@nestjs/testing';
import { VotesService } from './votes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VotesService', () => {
  let service: VotesService;
  let prismaService: {
    vote: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      vote: {
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

  it('should be defined', () => {
    expect(service).toBeDefined();
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
