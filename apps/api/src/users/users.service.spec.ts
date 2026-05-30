import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrivacyHashService } from '../common/privacy/privacy-hash.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: {
    $transaction: jest.Mock;
    assessment: {
      findUnique: jest.Mock;
    };
    authAuditLog: {
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
    emailVerificationToken: {
      deleteMany: jest.Mock;
    };
    passwordResetToken: {
      deleteMany: jest.Mock;
    };
    refreshToken: {
      deleteMany: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    vote: {
      findMany: jest.Mock;
    };
    voteSubmission: {
      findMany: jest.Mock;
    };
  };
  let privacyHashService: {
    createAssessmentOwnerHash: jest.Mock;
    createVoteVoterHash: jest.Mock;
  };

  beforeEach(async () => {
    prismaService = {
      $transaction: jest.fn(),
      assessment: {
        findUnique: jest.fn(),
      },
      authAuditLog: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      emailVerificationToken: {
        deleteMany: jest.fn(),
      },
      passwordResetToken: {
        deleteMany: jest.fn(),
      },
      refreshToken: {
        deleteMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      vote: {
        findMany: jest.fn(),
      },
      voteSubmission: {
        findMany: jest.fn(),
      },
    };

    privacyHashService = {
      createAssessmentOwnerHash: jest.fn((userId: string) => {
        return `owner-hash-${userId}`;
      }),
      createVoteVoterHash: jest.fn((voteId: string, userId: string) => {
        return `voter-hash-${voteId}-${userId}`;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: PrivacyHashService,
          useValue: privacyHashService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates new users as unverified regardless of database defaults', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);
    prismaService.user.create.mockResolvedValue({
      id: 'user-1',
      fullName: 'Test User',
      email: 'user@example.com',
      role: 'USER',
      emailVerified: false,
      isActive: true,
      createdAt: new Date(),
      termsAcceptedAt: new Date('2026-04-21T00:00:00.000Z'),
    });

    await service.createUser({
      fullName: '  Test User  ',
      email: 'USER@EXAMPLE.COM',
      passwordHash: 'hash',
      termsAcceptedAt: new Date('2026-04-21T00:00:00.000Z'),
    });

    const [[createCall]] = prismaService.user.create.mock.calls as [
      [
        {
          data: {
            fullName: string;
            email: string;
            passwordHash: string;
            emailVerified: boolean;
          };
        },
      ],
    ];

    expect(createCall.data.fullName).toBe('Test User');
    expect(createCall.data.email).toBe('user@example.com');
    expect(createCall.data.passwordHash).toBe('hash');
    expect(createCall.data.emailVerified).toBe(false);
  });

  it('exports my data through privacy hashes instead of removed direct user relations', async () => {
    const createdAt = new Date('2026-04-21T00:00:00.000Z');
    const updatedAt = new Date('2026-04-22T00:00:00.000Z');

    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      fullName: 'Test User',
      email: 'user@example.com',
      role: 'USER',
      emailVerified: true,
      isActive: true,
      lastLoginAt: null,
      termsAcceptedAt: createdAt,
      createdAt,
      updatedAt,
      createdVotes: [],
      createdArticles: [],
      authAuditLogs: [],
      auditLogs: [],
    });

    prismaService.assessment.findUnique.mockResolvedValue({
      id: 'assessment-1',
      ageRange: 'AGE_25_34',
      gender: 'FEMALE',
      city: 'BOLOGNA',
      region: 'EMILIA_ROMAGNA',
      country: 'ITALY',
      stakeholderRole: 'UNIVERSITY_STUDENT',
      backgroundCategory: 'EDUCATION',
      experienceLevel: 'INTERMEDIATE',
      yearsOfExperience: 5,
      studyLevel: 'MASTER_DEGREE',
      relationshipToArea: 'RESIDENT',
      assessmentCompleted: true,
      completedAt: new Date('2026-04-23T00:00:00.000Z'),
      createdAt,
      updatedAt,
    });

    prismaService.vote.findMany.mockResolvedValue([
      { id: 'vote-1' },
      { id: 'vote-2' },
    ]);

    prismaService.voteSubmission.findMany.mockResolvedValue([
      {
        id: 'submission-1',
        selfAssessmentScore: null,
        weightUsed: 1,
        calculationType: 'GENERAL',
        submittedAt: new Date('2026-04-24T00:00:00.000Z'),
        createdAt: new Date('2026-04-24T00:00:00.000Z'),
        vote: {
          id: 'vote-1',
          slug: 'mobility-plan',
          title: 'Mobility Plan',
          voteType: 'GENERAL',
          topicCategory: 'mobility',
          status: 'PUBLISHED',
          startAt: new Date('2026-04-01T00:00:00.000Z'),
          endAt: new Date('2026-05-01T00:00:00.000Z'),
          isPublished: true,
          publishedAt: new Date('2026-04-01T00:00:00.000Z'),
        },
        selectedOption: {
          id: 'option-1',
          optionText: 'Option A',
          displayOrder: 1,
        },
      },
    ]);

    const result = await service.exportMyData('user-1');

    expect(privacyHashService.createAssessmentOwnerHash).toHaveBeenCalledWith(
      'user-1',
    );

    expect(prismaService.assessment.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerHash: 'owner-hash-user-1',
        },
      }),
    );

    expect(privacyHashService.createVoteVoterHash).toHaveBeenCalledWith(
      'vote-1',
      'user-1',
    );
    expect(privacyHashService.createVoteVoterHash).toHaveBeenCalledWith(
      'vote-2',
      'user-1',
    );

    expect(prismaService.voteSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            {
              voteId: 'vote-1',
              voterHash: 'voter-hash-vote-1-user-1',
            },
            {
              voteId: 'vote-2',
              voterHash: 'voter-hash-vote-2-user-1',
            },
          ],
        },
      }),
    );

    expect(result).toMatchObject({
      message: 'User data export successful',
      data: {
        user: {
          id: 'user-1',
          fullName: 'Test User',
          email: 'user@example.com',
        },
        assessment: {
          id: 'assessment-1',
          assessmentCompleted: true,
        },
        voteSubmissions: [
          {
            id: 'submission-1',
            calculationType: 'GENERAL',
          },
        ],
      },
    });

    expect(result.data.user).not.toHaveProperty('ownerHash');
    expect(result.data.assessment).not.toHaveProperty('ownerHash');
    expect(result.data.assessment).not.toHaveProperty('secretUserId');
    expect(result.data.voteSubmissions[0]).not.toHaveProperty('voterHash');
    expect(result.data.voteSubmissions[0]).not.toHaveProperty('userId');
    expect(result.data.voteSubmissions[0]).not.toHaveProperty(
      'assessmentSecretUserId',
    );
  });

  it('exports my data with an empty vote submission list when no votes exist', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      fullName: 'Test User',
      email: 'user@example.com',
      role: 'USER',
      emailVerified: true,
      isActive: true,
      lastLoginAt: null,
      termsAcceptedAt: new Date('2026-04-21T00:00:00.000Z'),
      createdAt: new Date('2026-04-21T00:00:00.000Z'),
      updatedAt: new Date('2026-04-22T00:00:00.000Z'),
      createdVotes: [],
      createdArticles: [],
      authAuditLogs: [],
      auditLogs: [],
    });

    prismaService.assessment.findUnique.mockResolvedValue(null);
    prismaService.vote.findMany.mockResolvedValue([]);

    const result = await service.exportMyData('user-1');

    expect(prismaService.voteSubmission.findMany).not.toHaveBeenCalled();
    expect(result.data.assessment).toBeNull();
    expect(result.data.voteSubmissions).toEqual([]);
  });

  it('deactivates the account, anonymizes identifying data, and records the action', async () => {
    prismaService.$transaction.mockImplementation(
      (callback: (tx: typeof prismaService) => Promise<unknown>) =>
        callback(prismaService),
    );
    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
    });
    prismaService.user.update.mockResolvedValue({
      id: 'user-1',
    });
    prismaService.authAuditLog.create.mockResolvedValue({
      id: 'audit-1',
    });

    const result = await service.deactivateMyAccount('user-1');

    const [[updateCall]] = prismaService.user.update.mock.calls as [
      [
        {
          data: {
            fullName: string;
            isActive: boolean;
            emailVerified: boolean;
          };
        },
      ],
    ];
    const [[auditCall]] = prismaService.authAuditLog.create.mock.calls as [
      [
        {
          data: {
            userId: string;
            eventType: string;
            metadataJson: {
              retainedParticipationRecords: boolean;
              retainedParticipationRecordsUsePrivacyHashes: boolean;
            };
          };
        },
      ],
    ];

    expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(prismaService.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(prismaService.emailVerificationToken.deleteMany).toHaveBeenCalledWith(
      {
        where: { userId: 'user-1' },
      },
    );
    expect(prismaService.authAuditLog.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });

    expect(updateCall.data.fullName).toBe('Anonymized User');
    expect(updateCall.data.isActive).toBe(false);
    expect(updateCall.data.emailVerified).toBe(false);
    expect(auditCall.data.userId).toBe('user-1');
    expect(auditCall.data.eventType).toBe('ACCOUNT_SELF_ANONYMIZED');
    expect(auditCall.data.metadataJson.retainedParticipationRecords).toBe(true);
    expect(
      auditCall.data.metadataJson.retainedParticipationRecordsUsePrivacyHashes,
    ).toBe(true);
    expect(result.message).toContain('anonymized');
  });
});
