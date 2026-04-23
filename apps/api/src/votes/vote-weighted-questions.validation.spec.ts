import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ResultVisibilityModeDto } from './dto/create-vote-display-settings.dto';
import { VoteStatusDto, VoteTypeDto } from './dto/create-vote.dto';
import { VotesService } from './votes.service';

describe('VotesService weighted-question validation', () => {
  let service: VotesService;
  let prismaService: {
    vote: {
      create: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      vote: {
        create: jest.fn(),
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
        {
          provide: AuditService,
          useValue: {
            logAdminAction: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<VotesService>(VotesService);
  });

  it('normalizes internal modifier values for numbers, strings, and Prisma.Decimal inputs', () => {
    const normalizeModifierValue = (
      service as unknown as {
        normalizeModifierValue: (value: unknown) => number;
      }
    ).normalizeModifierValue.bind(service);

    expect(normalizeModifierValue(0.35)).toBe(0.35);
    expect(normalizeModifierValue('0.35')).toBe(0.35);
    expect(normalizeModifierValue('-0.20')).toBe(-0.2);
    expect(normalizeModifierValue(new Prisma.Decimal('0.35'))).toBe(0.35);
    expect(normalizeModifierValue(new Prisma.Decimal('-0.20'))).toBe(-0.2);
    expect(normalizeModifierValue(0)).toBe(0);

    expect(() => normalizeModifierValue('')).toThrow(
      new BadRequestException(
        'Weighted question modifiers must be valid decimals',
      ),
    );
    expect(() => normalizeModifierValue('not-a-number')).toThrow(
      new BadRequestException(
        'Weighted question modifiers must be valid decimals',
      ),
    );
    expect(() => normalizeModifierValue('0.12345')).toThrow(
      new BadRequestException(
        'Weighted question modifiers must be valid decimals',
      ),
    );
    expect(() => normalizeModifierValue(new Prisma.Decimal('0.12345'))).toThrow(
      new BadRequestException(
        'Weighted question modifiers must be valid decimals',
      ),
    );
  });

  it('sorts weighted questions and answer options by displayOrder before persisting', async () => {
    prismaService.vote.findUnique.mockResolvedValue(null);
    prismaService.vote.create.mockResolvedValue({
      id: 'vote-1',
    });

    await service.createVote('admin-1', buildCreateVoteDto());

    expect(prismaService.vote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          weightedQuestions: {
            create: [
              {
                prompt: 'First weighted question',
                displayOrder: 1,
                answerOptions: {
                  create: [
                    {
                      optionText: 'First answer',
                      modifier: -0.2,
                      displayOrder: 1,
                    },
                    {
                      optionText: 'Second answer',
                      modifier: 0.35,
                      displayOrder: 2,
                    },
                  ],
                },
              },
              {
                prompt: 'Second weighted question',
                displayOrder: 2,
                answerOptions: {
                  create: [
                    {
                      optionText: 'Earlier answer',
                      modifier: 0,
                      displayOrder: 1,
                    },
                    {
                      optionText: 'Later answer',
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

  it.each([
    {
      label: 'duplicate question displayOrder values',
      weightedQuestions: [
        {
          prompt: 'First weighted question',
          displayOrder: 1,
          answerOptions: [
            {
              optionText: 'Answer A',
              modifier: 0.1,
              displayOrder: 1,
            },
            {
              optionText: 'Answer B',
              modifier: 0,
              displayOrder: 2,
            },
          ],
        },
        {
          prompt: 'Second weighted question',
          displayOrder: 1,
          answerOptions: [
            {
              optionText: 'Answer C',
              modifier: -0.2,
              displayOrder: 1,
            },
            {
              optionText: 'Answer D',
              modifier: 0,
              displayOrder: 2,
            },
          ],
        },
      ],
      expectedMessage: 'Weighted question displayOrder values must be unique',
    },
    {
      label: 'duplicate answer option displayOrder values',
      weightedQuestions: [
        {
          prompt: 'First weighted question',
          displayOrder: 1,
          answerOptions: [
            {
              optionText: 'Answer A',
              modifier: 0.1,
              displayOrder: 1,
            },
            {
              optionText: 'Answer B',
              modifier: 0,
              displayOrder: 1,
            },
          ],
        },
      ],
      expectedMessage:
        'Weighted question option displayOrder values must be unique',
    },
    {
      label: 'blank prompts',
      weightedQuestions: [
        {
          prompt: '   ',
          displayOrder: 1,
          answerOptions: [
            {
              optionText: 'Answer A',
              modifier: 0.1,
              displayOrder: 1,
            },
            {
              optionText: 'Answer B',
              modifier: 0,
              displayOrder: 2,
            },
          ],
        },
      ],
      expectedMessage: 'Weighted question prompts cannot be empty',
    },
    {
      label: 'too few answer options',
      weightedQuestions: [
        {
          prompt: 'First weighted question',
          displayOrder: 1,
          answerOptions: [
            {
              optionText: 'Only answer',
              modifier: 0.1,
              displayOrder: 1,
            },
          ],
        },
      ],
      expectedMessage:
        'Weighted questions must include at least two answer options',
    },
    {
      label: 'blank answer option text',
      weightedQuestions: [
        {
          prompt: 'First weighted question',
          displayOrder: 1,
          answerOptions: [
            {
              optionText: '   ',
              modifier: 0.1,
              displayOrder: 1,
            },
            {
              optionText: 'Answer B',
              modifier: 0,
              displayOrder: 2,
            },
          ],
        },
      ],
      expectedMessage: 'Weighted question answer options cannot be empty',
    },
  ])(
    'rejects invalid weighted-question configuration: $label',
    async ({ weightedQuestions, expectedMessage }) => {
      prismaService.vote.findUnique.mockResolvedValue(null);

      await expect(
        service.createVote(
          'admin-1',
          buildCreateVoteDto({
            weightedQuestions,
          }),
        ),
      ).rejects.toThrow(new BadRequestException(expectedMessage));
    },
  );
});

function buildCreateVoteDto(
  overrides: Partial<{
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
    slug: 'weighted-validation',
    title: 'Weighted validation',
    summary: 'Summary',
    methodologySummary: 'Methodology',
    voteType: VoteTypeDto.SPECIALIZED,
    topicCategory: 'mobility',
    status: VoteStatusDto.DRAFT,
    startAt: '2026-05-01T12:00:00.000Z',
    endAt: '2026-05-10T12:00:00.000Z',
    isPublished: false,
    options: [
      { optionText: 'Option A', displayOrder: 1 },
      { optionText: 'Option B', displayOrder: 2 },
    ],
    weightedQuestions: [
      {
        prompt: 'Second weighted question',
        displayOrder: 2,
        answerOptions: [
          {
            optionText: 'Later answer',
            modifier: 0.1,
            displayOrder: 2,
          },
          {
            optionText: 'Earlier answer',
            modifier: 0,
            displayOrder: 1,
          },
        ],
      },
      {
        prompt: 'First weighted question',
        displayOrder: 1,
        answerOptions: [
          {
            optionText: 'Second answer',
            modifier: 0.35,
            displayOrder: 2,
          },
          {
            optionText: 'First answer',
            modifier: -0.2,
            displayOrder: 1,
          },
        ],
      },
    ],
    displaySettings: {
      resultVisibilityMode: ResultVisibilityModeDto.HIDE_ALL,
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
