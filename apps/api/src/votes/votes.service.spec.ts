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

  it('preserves privacy-safe suppression for small public cohorts', async () => {
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
      submissions: Array.from({ length: 4 }, (_, index) => ({
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
      stakeholderBreakdown: [],
    });
  });
});
