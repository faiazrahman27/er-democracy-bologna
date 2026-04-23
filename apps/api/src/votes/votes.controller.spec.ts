import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { VoteWeightedPayloadCompatibilityGuard } from './vote-weighted-payload-compatibility.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('VotesController', () => {
  let controller: VotesController;
  let votesService: {
    exportAdminAnalyticsExcel: jest.Mock;
    getAdminParticipants: jest.Mock;
  };

  beforeEach(async () => {
    votesService = {
      exportAdminAnalyticsExcel: jest.fn().mockResolvedValue({
        fileName: 'mobility-plan-analytics.xlsx',
        buffer: Buffer.from('test'),
      }),
      getAdminParticipants: jest.fn().mockResolvedValue({
        slug: 'mobility-plan',
        title: 'Mobility Plan',
        participants: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotesController],
      providers: [
        {
          provide: VotesService,
          useValue: votesService,
        },
        {
          provide: SupabaseService,
          useValue: {},
        },
        {
          provide: VoteWeightedPayloadCompatibilityGuard,
          useValue: {
            canActivate: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            vote: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(2 * 1024 * 1024),
          },
        },
      ],
    }).compile();

    controller = module.get<VotesController>(VotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes secret lookup capability to participant responses', async () => {
    await controller.getAdminParticipants('mobility-plan', {
      id: 'admin-1',
      fullName: 'Consultation Admin',
      email: 'consultation@example.com',
      role: 'CONSULTATION_ADMIN',
      emailVerified: true,
      isActive: true,
    });

    expect(votesService.getAdminParticipants).toHaveBeenCalledWith(
      'mobility-plan',
      {
        adminUserId: 'admin-1',
        includeSecretUserId: false,
      },
    );
  });

  it('includes participant sheets and sensitive lookup data for lookup-enabled exports', async () => {
    const response = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Parameters<typeof controller.exportAdminAnalyticsExcel>[2];

    await controller.exportAdminAnalyticsExcel(
      'mobility-plan',
      {
        id: 'admin-1',
        fullName: 'Super Admin',
        email: 'super@example.com',
        role: 'SUPER_ADMIN',
        emailVerified: true,
        isActive: true,
      },
      response,
    );

    expect(votesService.exportAdminAnalyticsExcel).toHaveBeenCalledWith(
      'mobility-plan',
      {
        adminUserId: 'admin-1',
        includeParticipantSheet: true,
        includeSecretUserId: true,
        includeSensitiveAssessmentDetails: true,
      },
    );
  });

  it('omits participant sheets for analytics-only exports', async () => {
    const response = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Parameters<typeof controller.exportAdminAnalyticsExcel>[2];

    await controller.exportAdminAnalyticsExcel(
      'mobility-plan',
      {
        id: 'admin-1',
        fullName: 'Analytics Admin',
        email: 'analytics@example.com',
        role: 'ANALYTICS_ADMIN',
        emailVerified: true,
        isActive: true,
      },
      response,
    );

    expect(votesService.exportAdminAnalyticsExcel).toHaveBeenCalledWith(
      'mobility-plan',
      {
        adminUserId: 'admin-1',
        includeParticipantSheet: false,
        includeSecretUserId: false,
        includeSensitiveAssessmentDetails: false,
      },
    );
  });
});
