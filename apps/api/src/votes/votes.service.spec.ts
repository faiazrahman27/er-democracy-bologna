import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
      weightedQuestions: [],
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
    prismaService.voteSubmission.create.mockRejectedValue({
      code: 'P2002',
      meta: {
        target: ['voteId', 'userId'],
      },
    });

    await expect(
      service.submitVote('user-1', 'mobility-plan', {
        selectedOptionId: 'option-1',
      }),
    ).rejects.toThrow(
      new ForbiddenException('You have already voted on this consultation'),
    );
  });

  it('creates specialized consultations with weighted questions', async () => {
    prismaService.vote.findUnique.mockResolvedValue(null);
    prismaService.vote.create.mockResolvedValue({
      id: 'vote-1',
      slug: 'mobility-plan',
    });

    await service.createVote(
      'admin-1',
      buildCreateVoteDto({
        voteType: VoteTypeDto.SPECIALIZED,
        weightedQuestions: buildWeightedQuestionConfig(),
      }),
    );

    expect(prismaService.vote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          voteType: VoteTypeDto.SPECIALIZED,
          weightedQuestions: {
            create: [
              {
                prompt: 'How closely does this topic match your expertise?',
                displayOrder: 1,
                answerOptions: {
                  create: [
                    {
                      optionText: 'Directly relevant',
                      modifier: 0.35,
                      displayOrder: 1,
                    },
                    {
                      optionText: 'Somewhat relevant',
                      modifier: 0.1,
                      displayOrder: 2,
                    },
                  ],
                },
              },
            ],
          },
        }),
      }),
    );
  });

  it('keeps specialized create payloads with no weighted questions on the no-op path', async () => {
    prismaService.vote.findUnique.mockResolvedValue(null);
    prismaService.vote.create.mockResolvedValue({
      id: 'vote-1',
      slug: 'mobility-plan',
    });

    await service.createVote(
      'admin-1',
      buildCreateVoteDto({
        voteType: VoteTypeDto.SPECIALIZED,
        weightedQuestions: [],
      }),
    );

    expect(prismaService.vote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          voteType: VoteTypeDto.SPECIALIZED,
          weightedQuestions: undefined,
        }),
      }),
    );
  });

  it.each([VoteTypeDto.GENERAL, VoteTypeDto.SELF_ASSESSMENT])(
    'rejects weighted-question configuration on %s consultations',
    async (voteType) => {
      prismaService.vote.findUnique.mockResolvedValue(null);

      await expect(
        service.createVote(
          'admin-1',
          buildCreateVoteDto({
            voteType,
            weightedQuestions: buildWeightedQuestionConfig(),
          }),
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Weighted questions are only supported for specialized votes',
        ),
      );
    },
  );

  it.each([VoteTypeDto.GENERAL, VoteTypeDto.SELF_ASSESSMENT])(
    'rejects even empty weighted-question payloads on %s consultations',
    async (voteType) => {
      prismaService.vote.findUnique.mockResolvedValue(null);

      await expect(
        service.createVote(
          'admin-1',
          buildCreateVoteDto({
            voteType,
            weightedQuestions: [],
          }),
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Weighted questions are only supported for specialized votes',
        ),
      );
    },
  );

  it('stores specialized weighted-question answers and applies their modifiers on top of the base weight', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      id: 'vote-1',
      title: 'Mobility Plan',
      summary: 'Summary',
      methodologySummary: 'Methodology',
      voteType: 'SPECIALIZED',
      topicCategory: 'mobility',
      status: 'PUBLISHED',
      isPublished: true,
      startAt: new Date('2020-01-01T00:00:00.000Z'),
      endAt: new Date('2999-01-01T00:00:00.000Z'),
      options: [{ id: 'option-1' }],
      weightedQuestions: [
        {
          id: 'question-1',
          prompt: 'How closely does this topic match your expertise?',
          displayOrder: 1,
          answerOptions: [
            {
              id: 'answer-1',
              optionText: 'Directly relevant',
              modifier: 0.35,
              displayOrder: 1,
            },
            {
              id: 'answer-2',
              optionText: 'Somewhat relevant',
              modifier: 0.1,
              displayOrder: 2,
            },
          ],
        },
      ],
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
      specializedBaseWeightUsed: 1.15,
      specializedQuestionModifierTotal: 0.35,
      weightUsed: 1.5,
      calculationType: 'SPECIALIZED',
      submittedAt: new Date('2026-04-18T10:00:00.000Z'),
      createdAt: new Date('2026-04-18T10:00:00.000Z'),
    });

    jest.spyOn(voteWeightUtil, 'calculateVoteWeight').mockReturnValue({
      weightUsed: 1.15,
      calculationType: 'SPECIALIZED',
    });

    await service.submitVote('user-1', 'mobility-plan', {
      selectedOptionId: 'option-1',
      weightedQuestionAnswers: [
        {
          questionId: 'question-1',
          optionId: 'answer-1',
        },
      ],
    });

    expect(prismaService.voteSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          specializedBaseWeightUsed: 1.15,
          specializedQuestionModifierTotal: 0.35,
          weightUsed: 1.5,
          weightedQuestionAnswers: {
            create: [
              {
                questionId: 'question-1',
                optionId: 'answer-1',
                modifierUsed: 0.35,
              },
            ],
          },
        }),
      }),
    );

    const createCall = prismaService.voteSubmission.create.mock.calls[0][0] as {
      select: Record<string, unknown>;
    };

    expect(createCall.select).not.toHaveProperty('specializedBaseWeightUsed');
    expect(createCall.select).not.toHaveProperty(
      'specializedQuestionModifierTotal',
    );
  });

  it('supports Prisma.Decimal modifiers throughout specialized submission handling', async () => {
    prismaService.vote.findUnique.mockResolvedValue(
      buildSpecializedVoteForSubmission({
        weightedQuestions: [
          {
            id: 'question-1',
            prompt: 'How closely does this topic match your expertise?',
            displayOrder: 1,
            answerOptions: [
              {
                id: 'answer-1',
                optionText: 'Directly relevant',
                modifier: new Prisma.Decimal('0.35'),
                displayOrder: 1,
              },
              {
                id: 'answer-2',
                optionText: 'Somewhat relevant',
                modifier: new Prisma.Decimal('-0.20'),
                displayOrder: 2,
              },
            ],
          },
        ],
      }),
    );
    prismaService.voteSubmission.findUnique.mockResolvedValue(null);
    prismaService.assessment.findUnique.mockResolvedValue(
      buildCompletedAssessment(),
    );
    prismaService.voteSubmission.create.mockResolvedValue({
      id: 'submission-1',
      voteId: 'vote-1',
      userId: 'user-1',
      selectedOptionId: 'option-1',
      selfAssessmentScore: null,
      weightUsed: 1.55,
      calculationType: 'SPECIALIZED',
      submittedAt: new Date('2026-04-18T10:00:00.000Z'),
      createdAt: new Date('2026-04-18T10:00:00.000Z'),
    });
    jest.spyOn(voteWeightUtil, 'calculateVoteWeight').mockReturnValue({
      weightUsed: 1.2,
      calculationType: 'SPECIALIZED',
    });

    await service.submitVote('user-1', 'mobility-plan', {
      selectedOptionId: 'option-1',
      weightedQuestionAnswers: [
        {
          questionId: 'question-1',
          optionId: 'answer-1',
        },
      ],
    });

    expect(prismaService.voteSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          specializedBaseWeightUsed: 1.2,
          specializedQuestionModifierTotal: 0.35,
          weightUsed: 1.55,
          weightedQuestionAnswers: {
            create: [
              {
                questionId: 'question-1',
                optionId: 'answer-1',
                modifierUsed: 0.35,
              },
            ],
          },
        }),
      }),
    );
  });

  it('supports negative Prisma.Decimal modifiers during specialized submission handling', async () => {
    prismaService.vote.findUnique.mockResolvedValue(
      buildSpecializedVoteForSubmission({
        weightedQuestions: [
          {
            id: 'question-1',
            prompt: 'How closely does this topic match your expertise?',
            displayOrder: 1,
            answerOptions: [
              {
                id: 'answer-1',
                optionText: 'Directly relevant',
                modifier: new Prisma.Decimal('-0.20'),
                displayOrder: 1,
              },
              {
                id: 'answer-2',
                optionText: 'Somewhat relevant',
                modifier: 0,
                displayOrder: 2,
              },
            ],
          },
        ],
      }),
    );
    prismaService.voteSubmission.findUnique.mockResolvedValue(null);
    prismaService.assessment.findUnique.mockResolvedValue(
      buildCompletedAssessment(),
    );
    prismaService.voteSubmission.create.mockResolvedValue({});
    jest.spyOn(voteWeightUtil, 'calculateVoteWeight').mockReturnValue({
      weightUsed: 1.2,
      calculationType: 'SPECIALIZED',
    });

    await service.submitVote('user-1', 'mobility-plan', {
      selectedOptionId: 'option-1',
      weightedQuestionAnswers: [
        {
          questionId: 'question-1',
          optionId: 'answer-1',
        },
      ],
    });

    expect(prismaService.voteSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          specializedBaseWeightUsed: 1.2,
          specializedQuestionModifierTotal: -0.2,
          weightUsed: 1,
          weightedQuestionAnswers: {
            create: [
              {
                questionId: 'question-1',
                optionId: 'answer-1',
                modifierUsed: -0.2,
              },
            ],
          },
        }),
      }),
    );
  });

  it('surfaces weighted-answer integrity failures distinctly from duplicate vote submissions', async () => {
    prismaService.vote.findUnique.mockResolvedValue(
      buildSpecializedVoteForSubmission(),
    );
    prismaService.voteSubmission.findUnique.mockResolvedValue(null);
    prismaService.assessment.findUnique.mockResolvedValue(
      buildCompletedAssessment(),
    );
    prismaService.voteSubmission.create.mockRejectedValue({
      code: 'P2002',
      meta: {
        target: 'VoteSubmissionWeightedAnswer_voteSubmissionId_questionId_key',
      },
    });
    jest.spyOn(voteWeightUtil, 'calculateVoteWeight').mockReturnValue({
      weightUsed: 1.1,
      calculationType: 'SPECIALIZED',
    });

    await expect(
      service.submitVote('user-1', 'mobility-plan', {
        selectedOptionId: 'option-1',
        weightedQuestionAnswers: [
          {
            questionId: 'question-1',
            optionId: 'answer-1',
          },
        ],
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Weighted question answers failed integrity checks',
      ),
    );
  });

  it('rejects specialized submissions when weighted-question answers are missing', async () => {
    prismaService.vote.findUnique.mockResolvedValue(
      buildSpecializedVoteForSubmission(),
    );
    prismaService.voteSubmission.findUnique.mockResolvedValue(null);
    prismaService.assessment.findUnique.mockResolvedValue(
      buildCompletedAssessment(),
    );
    jest.spyOn(voteWeightUtil, 'calculateVoteWeight').mockReturnValue({
      weightUsed: 1.1,
      calculationType: 'SPECIALIZED',
    });

    await expect(
      service.submitVote('user-1', 'mobility-plan', {
        selectedOptionId: 'option-1',
      }),
    ).rejects.toThrow(
      new BadRequestException('All weighted questions must be answered'),
    );
  });

  it.each([
    {
      voteType: VoteTypeDto.GENERAL,
      payload: {
        selectedOptionId: 'option-1',
        weightedQuestionAnswers: [],
      },
    },
    {
      voteType: VoteTypeDto.SELF_ASSESSMENT,
      payload: {
        selectedOptionId: 'option-1',
        selfAssessmentScore: 5,
        weightedQuestionAnswers: [],
      },
    },
  ])(
    'rejects weighted-question answer payload presence on $voteType submissions, even when empty',
    async ({ voteType, payload }) => {
      prismaService.vote.findUnique.mockResolvedValue({
        id: 'vote-1',
        title: 'Mobility Plan',
        summary: 'Summary',
        methodologySummary: 'Methodology',
        voteType,
        topicCategory: 'mobility',
        status: 'PUBLISHED',
        isPublished: true,
        startAt: new Date('2020-01-01T00:00:00.000Z'),
        endAt: new Date('2999-01-01T00:00:00.000Z'),
        options: [{ id: 'option-1' }],
        weightedQuestions: [],
      });
      prismaService.voteSubmission.findUnique.mockResolvedValue(null);

      await expect(
        service.submitVote('user-1', 'mobility-plan', payload),
      ).rejects.toThrow(
        new BadRequestException(
          'Weighted question answers are only allowed for specialized votes',
        ),
      );
    },
  );

  it('rejects specialized submissions with duplicate answers for the same question', async () => {
    prismaService.vote.findUnique.mockResolvedValue(
      buildSpecializedVoteForSubmission({
        weightedQuestions: buildMultiQuestionWeightedConfigForSubmission(),
      }),
    );
    prismaService.voteSubmission.findUnique.mockResolvedValue(null);
    prismaService.assessment.findUnique.mockResolvedValue(
      buildCompletedAssessment(),
    );
    jest.spyOn(voteWeightUtil, 'calculateVoteWeight').mockReturnValue({
      weightUsed: 1.1,
      calculationType: 'SPECIALIZED',
    });

    await expect(
      service.submitVote('user-1', 'mobility-plan', {
        selectedOptionId: 'option-1',
        weightedQuestionAnswers: [
          {
            questionId: 'question-1',
            optionId: 'answer-1',
          },
          {
            questionId: 'question-1',
            optionId: 'answer-2',
          },
        ],
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Each weighted question can only be answered once',
      ),
    );
  });

  it('rejects weighted-question submissions when the submitted question does not belong to the vote', async () => {
    prismaService.vote.findUnique.mockResolvedValue(
      buildSpecializedVoteForSubmission(),
    );
    prismaService.voteSubmission.findUnique.mockResolvedValue(null);
    prismaService.assessment.findUnique.mockResolvedValue(
      buildCompletedAssessment(),
    );
    jest.spyOn(voteWeightUtil, 'calculateVoteWeight').mockReturnValue({
      weightUsed: 1.1,
      calculationType: 'SPECIALIZED',
    });

    await expect(
      service.submitVote('user-1', 'mobility-plan', {
        selectedOptionId: 'option-1',
        weightedQuestionAnswers: [
          {
            questionId: 'question-999',
            optionId: 'answer-1',
          },
        ],
      }),
    ).rejects.toThrow(
      new BadRequestException('Weighted question does not belong to this vote'),
    );
  });

  it('rejects weighted-question submissions when the answer option does not belong to the selected question', async () => {
    prismaService.vote.findUnique.mockResolvedValue(
      buildSpecializedVoteForSubmission({
        weightedQuestions: buildMultiQuestionWeightedConfigForSubmission(),
      }),
    );
    prismaService.voteSubmission.findUnique.mockResolvedValue(null);
    prismaService.assessment.findUnique.mockResolvedValue(
      buildCompletedAssessment(),
    );
    jest.spyOn(voteWeightUtil, 'calculateVoteWeight').mockReturnValue({
      weightUsed: 1.1,
      calculationType: 'SPECIALIZED',
    });

    await expect(
      service.submitVote('user-1', 'mobility-plan', {
        selectedOptionId: 'option-1',
        weightedQuestionAnswers: [
          {
            questionId: 'question-1',
            optionId: 'answer-3',
          },
          {
            questionId: 'question-2',
            optionId: 'answer-4',
          },
        ],
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Weighted question answer option does not belong to its question',
      ),
    );
  });

  it.each([
    {
      label: 'adds modifiers without clamping',
      baseWeight: 1.4,
      modifier: 0.2,
      expectedWeight: 1.6,
    },
    {
      label: 'upper bound',
      baseWeight: 1.9,
      modifier: 0.3,
      expectedWeight: 2,
    },
    {
      label: 'lower bound',
      baseWeight: 0.6,
      modifier: -0.3,
      expectedWeight: 0.5,
    },
  ])(
    'computes the final specialized weight for $label',
    async ({ baseWeight, modifier, expectedWeight }) => {
      prismaService.vote.findUnique.mockResolvedValue(
        buildSpecializedVoteForSubmission({
          weightedQuestions: [
            {
              id: 'question-1',
              prompt: 'How closely does this topic match your expertise?',
              displayOrder: 1,
              answerOptions: [
                {
                  id: 'answer-1',
                  optionText: 'Selected answer',
                  modifier,
                  displayOrder: 1,
                },
                {
                  id: 'answer-2',
                  optionText: 'Fallback answer',
                  modifier: 0,
                  displayOrder: 2,
                },
              ],
            },
          ],
        }),
      );
      prismaService.voteSubmission.findUnique.mockResolvedValue(null);
      prismaService.assessment.findUnique.mockResolvedValue(
        buildCompletedAssessment(),
      );
      prismaService.voteSubmission.create.mockResolvedValue({});
      jest.spyOn(voteWeightUtil, 'calculateVoteWeight').mockReturnValue({
        weightUsed: baseWeight,
        calculationType: 'SPECIALIZED',
      });

      await service.submitVote('user-1', 'mobility-plan', {
        selectedOptionId: 'option-1',
        weightedQuestionAnswers: [
          {
            questionId: 'question-1',
            optionId: 'answer-1',
          },
        ],
      });

      expect(prismaService.voteSubmission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            specializedBaseWeightUsed: baseWeight,
            specializedQuestionModifierTotal: modifier,
            weightUsed: expectedWeight,
          }),
        }),
      );
    },
  );

  it('keeps zero-value weighted modifiers neutral after the base specialized path', async () => {
    prismaService.vote.findUnique.mockResolvedValue(
      buildSpecializedVoteForSubmission({
        weightedQuestions: [
          {
            id: 'question-1',
            prompt: 'How closely does this topic match your expertise?',
            displayOrder: 1,
            answerOptions: [
              {
                id: 'answer-1',
                optionText: 'Neutral answer',
                modifier: 0,
                displayOrder: 1,
              },
              {
                id: 'answer-2',
                optionText: 'Fallback answer',
                modifier: 0.1,
                displayOrder: 2,
              },
            ],
          },
        ],
      }),
    );
    prismaService.voteSubmission.findUnique.mockResolvedValue(null);
    prismaService.assessment.findUnique.mockResolvedValue(
      buildCompletedAssessment(),
    );
    prismaService.voteSubmission.create.mockResolvedValue({});
    jest.spyOn(voteWeightUtil, 'calculateVoteWeight').mockReturnValue({
      weightUsed: 1.32,
      calculationType: 'SPECIALIZED',
    });

    await service.submitVote('user-1', 'mobility-plan', {
      selectedOptionId: 'option-1',
      weightedQuestionAnswers: [
        {
          questionId: 'question-1',
          optionId: 'answer-1',
        },
      ],
    });

    expect(prismaService.voteSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          specializedBaseWeightUsed: 1.32,
          specializedQuestionModifierTotal: 0,
          weightUsed: 1.32,
        }),
      }),
    );
  });

  it('keeps specialized submissions without weighted questions on the original base-weight path', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      id: 'vote-1',
      title: 'Mobility Plan',
      summary: 'Summary',
      methodologySummary: 'Methodology',
      voteType: 'SPECIALIZED',
      topicCategory: 'mobility',
      status: 'PUBLISHED',
      isPublished: true,
      startAt: new Date('2020-01-01T00:00:00.000Z'),
      endAt: new Date('2999-01-01T00:00:00.000Z'),
      options: [{ id: 'option-1' }],
      weightedQuestions: [],
    });
    prismaService.voteSubmission.findUnique.mockResolvedValue(null);
    prismaService.assessment.findUnique.mockResolvedValue(
      buildCompletedAssessment(),
    );
    prismaService.voteSubmission.create.mockResolvedValue({});
    jest.spyOn(voteWeightUtil, 'calculateVoteWeight').mockReturnValue({
      weightUsed: 1.24,
      calculationType: 'SPECIALIZED',
    });

    await service.submitVote('user-1', 'mobility-plan', {
      selectedOptionId: 'option-1',
    });

    expect(prismaService.voteSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          specializedBaseWeightUsed: 1.24,
          specializedQuestionModifierTotal: 0,
          weightUsed: 1.24,
          weightedQuestionAnswers: undefined,
        }),
      }),
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
      voteType: 'GENERAL',
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

  it('allows weighted-question edits before any submissions exist', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      id: 'vote-1',
      voteType: 'SPECIALIZED',
      title: 'Mobility Plan',
      summary: 'Summary',
      methodologySummary: 'Methodology',
      status: 'PUBLISHED',
      startAt: new Date('2026-05-01T12:00:00.000Z'),
      endAt: new Date('2026-05-10T12:00:00.000Z'),
      isPublished: true,
      submissions: [],
      displaySettings: null,
    });
    prismaService.vote.update.mockResolvedValue({});

    await service.updateVote('mobility-plan', {
      weightedQuestions: buildWeightedQuestionConfig(),
    });

    expect(prismaService.vote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          weightedQuestions: {
            deleteMany: {},
            create: [
              {
                prompt: 'How closely does this topic match your expertise?',
                displayOrder: 1,
                answerOptions: {
                  create: [
                    {
                      optionText: 'Directly relevant',
                      modifier: 0.35,
                      displayOrder: 1,
                    },
                    {
                      optionText: 'Somewhat relevant',
                      modifier: 0.1,
                      displayOrder: 2,
                    },
                  ],
                },
              },
            ],
          },
        }),
      }),
    );
  });

  it('allows specialized consultations to clear weighted questions before any submissions exist', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      id: 'vote-1',
      voteType: 'SPECIALIZED',
      title: 'Mobility Plan',
      summary: 'Summary',
      methodologySummary: 'Methodology',
      status: 'PUBLISHED',
      startAt: new Date('2026-05-01T12:00:00.000Z'),
      endAt: new Date('2026-05-10T12:00:00.000Z'),
      isPublished: true,
      submissions: [],
      displaySettings: null,
    });
    prismaService.vote.update.mockResolvedValue({});

    await service.updateVote('mobility-plan', {
      weightedQuestions: [],
    });

    expect(prismaService.vote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          weightedQuestions: {
            deleteMany: {},
          },
        }),
      }),
    );
  });

  it('blocks weighted-question edits after submissions already exist', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      id: 'vote-1',
      voteType: 'SPECIALIZED',
      title: 'Mobility Plan',
      summary: 'Summary',
      methodologySummary: 'Methodology',
      status: 'PUBLISHED',
      startAt: new Date('2026-05-01T12:00:00.000Z'),
      endAt: new Date('2026-05-10T12:00:00.000Z'),
      isPublished: true,
      submissions: [{ id: 'submission-1' }],
      displaySettings: null,
    });

    await expect(
      service.updateVote('mobility-plan', {
        weightedQuestions: buildWeightedQuestionConfig(),
      }),
    ).rejects.toThrow(
      new ForbiddenException(
        'Core vote fields cannot be changed after submissions exist',
      ),
    );
  });

  it('still allows safe non-core updates after submissions already exist', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      id: 'vote-1',
      voteType: 'SPECIALIZED',
      title: 'Mobility Plan',
      summary: 'Summary',
      methodologySummary: 'Methodology',
      status: 'PUBLISHED',
      startAt: new Date('2026-05-01T12:00:00.000Z'),
      endAt: new Date('2026-05-10T12:00:00.000Z'),
      isPublished: true,
      submissions: [{ id: 'submission-1' }],
      displaySettings: null,
    });
    prismaService.vote.update.mockResolvedValue({});

    await service.updateVote('mobility-plan', {
      status: VoteStatusDto.CLOSED,
      endAt: '2026-05-12T12:00:00.000Z',
    });

    expect(prismaService.vote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: VoteStatusDto.CLOSED,
          endAt: new Date('2026-05-12T12:00:00.000Z'),
          lockedAt: expect.any(Date),
        }),
      }),
    );
  });

  it.each([VoteTypeDto.GENERAL, VoteTypeDto.SELF_ASSESSMENT])(
    'rejects empty weighted-question update payloads on %s consultations',
    async (voteType) => {
      prismaService.vote.findUnique.mockResolvedValue({
        id: 'vote-1',
        voteType,
        title: 'Mobility Plan',
        summary: 'Summary',
        methodologySummary: 'Methodology',
        status: 'PUBLISHED',
        startAt: new Date('2026-05-01T12:00:00.000Z'),
        endAt: new Date('2026-05-10T12:00:00.000Z'),
        isPublished: true,
        submissions: [],
        displaySettings: null,
      });

      await expect(
        service.updateVote('mobility-plan', {
          weightedQuestions: [],
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'Weighted questions are only supported for specialized votes',
        ),
      );
    },
  );

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

  it('omits weighted-answer modifier details from public vote detail responses', async () => {
    prismaService.vote.findFirst.mockResolvedValue({
      id: 'vote-1',
      slug: 'mobility-plan',
      title: 'Mobility Plan',
      summary: 'Summary',
      methodologySummary: null,
      voteType: 'SPECIALIZED',
      topicCategory: 'mobility',
      status: 'PUBLISHED',
      coverImageUrl: null,
      coverImageAlt: null,
      startAt: new Date('2026-04-01T12:00:00.000Z'),
      endAt: new Date('2999-05-01T12:00:00.000Z'),
      isPublished: true,
      publishedAt: new Date('2026-04-01T12:00:00.000Z'),
      createdAt: new Date('2026-04-01T12:00:00.000Z'),
      updatedAt: new Date('2026-04-02T12:00:00.000Z'),
      options: [],
      weightedQuestions: [],
      displaySettings: null,
    });

    await service.getPublicVoteBySlug('mobility-plan');

    const findCall = prismaService.vote.findFirst.mock.calls[0][0] as {
      select: {
        weightedQuestions: {
          select: {
            answerOptions: {
              select: Record<string, unknown>;
            };
          };
        };
      };
    };

    expect(
      findCall.select.weightedQuestions.select.answerOptions.select,
    ).not.toHaveProperty('modifier');
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
          specializedBaseWeightUsed: null,
          specializedQuestionModifierTotal: null,
          weightUsed: 1,
          calculationType: 'GENERAL',
          selfAssessmentScore: null,
          submittedAt: new Date('2026-04-10T12:00:00.000Z'),
          weightedQuestionAnswers: [],
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
    expect(result.participants[0]).not.toHaveProperty(
      'specializedBaseWeightUsed',
    );
    expect(result.participants[0]).not.toHaveProperty(
      'specializedQuestionModifierTotal',
    );
    expect(result.participants[0]).not.toHaveProperty(
      'weightedQuestionAnswers',
    );
  });

  it('includes secret user IDs and weighted-question details in participant lists when secret lookup access is enabled', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      id: 'vote-1',
      slug: 'mobility-plan',
      title: 'Mobility Plan',
      submissions: [
        {
          id: 'submission-1',
          selectedOptionId: 'option-1',
          specializedBaseWeightUsed: 1.1,
          specializedQuestionModifierTotal: 0.35,
          weightUsed: 1.45,
          calculationType: 'SPECIALIZED',
          selfAssessmentScore: null,
          submittedAt: new Date('2026-04-10T12:00:00.000Z'),
          weightedQuestionAnswers: [
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
      ],
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

function buildCreateVoteDto(
  overrides: Partial<{
    slug: string;
    title: string;
    summary: string;
    methodologySummary: string;
    voteType: VoteTypeDto;
    topicCategory: string;
    status: VoteStatusDto;
    startAt: string;
    endAt: string;
    isPublished: boolean;
    options: Array<{ optionText: string; displayOrder: number }>;
    weightedQuestions: Array<{
      prompt: string;
      displayOrder: number;
      answerOptions: Array<{
        optionText: string;
        modifier: number;
        displayOrder: number;
      }>;
    }>;
  }> = {},
) {
  return {
    slug: 'mobility-plan',
    title: 'Mobility Plan',
    summary: 'Summary',
    methodologySummary: 'Methodology',
    voteType: VoteTypeDto.GENERAL,
    topicCategory: 'mobility',
    status: VoteStatusDto.PUBLISHED,
    startAt: '2026-05-01T12:00:00.000Z',
    endAt: '2026-05-10T12:00:00.000Z',
    isPublished: true,
    options: [
      { optionText: 'Option A', displayOrder: 1 },
      { optionText: 'Option B', displayOrder: 2 },
    ],
    weightedQuestions: undefined,
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
    ...overrides,
  };
}

function buildWeightedQuestionConfig() {
  return [
    {
      prompt: 'How closely does this topic match your expertise?',
      displayOrder: 1,
      answerOptions: [
        {
          optionText: 'Directly relevant',
          modifier: 0.35,
          displayOrder: 1,
        },
        {
          optionText: 'Somewhat relevant',
          modifier: 0.1,
          displayOrder: 2,
        },
      ],
    },
  ];
}

function buildMultiQuestionWeightedConfigForSubmission() {
  return [
    {
      id: 'question-1',
      prompt: 'How closely does this topic match your expertise?',
      displayOrder: 1,
      answerOptions: [
        {
          id: 'answer-1',
          optionText: 'Directly relevant',
          modifier: 0.35,
          displayOrder: 1,
        },
        {
          id: 'answer-2',
          optionText: 'Somewhat relevant',
          modifier: 0.1,
          displayOrder: 2,
        },
      ],
    },
    {
      id: 'question-2',
      prompt: 'How deeply are you affected by this topic?',
      displayOrder: 2,
      answerOptions: [
        {
          id: 'answer-3',
          optionText: 'Highly affected',
          modifier: 0.2,
          displayOrder: 1,
        },
        {
          id: 'answer-4',
          optionText: 'Somewhat affected',
          modifier: 0,
          displayOrder: 2,
        },
      ],
    },
  ];
}

function buildCompletedAssessment() {
  return {
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
  };
}

function buildSpecializedVoteForSubmission(
  overrides: Partial<{
    weightedQuestions: Array<{
      id: string;
      prompt: string;
      displayOrder: number;
      answerOptions: Array<{
        id: string;
        optionText: string;
        modifier: number | Prisma.Decimal;
        displayOrder: number;
      }>;
    }>;
  }> = {},
) {
  return {
    id: 'vote-1',
    title: 'Mobility Plan',
    summary: 'Summary',
    methodologySummary: 'Methodology',
    voteType: 'SPECIALIZED',
    topicCategory: 'mobility',
    status: 'PUBLISHED',
    isPublished: true,
    startAt: new Date('2020-01-01T00:00:00.000Z'),
    endAt: new Date('2999-01-01T00:00:00.000Z'),
    options: [{ id: 'option-1' }],
    weightedQuestions: [
      {
        id: 'question-1',
        prompt: 'How closely does this topic match your expertise?',
        displayOrder: 1,
        answerOptions: [
          {
            id: 'answer-1',
            optionText: 'Directly relevant',
            modifier: 0.35,
            displayOrder: 1,
          },
          {
            id: 'answer-2',
            optionText: 'Somewhat relevant',
            modifier: 0.1,
            displayOrder: 2,
          },
        ],
      },
    ],
    ...overrides,
  };
}
