import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validate } from 'class-validator';
import { ResultVisibilityModeDto } from './create-vote-display-settings.dto';
import { CreateVoteDto, VoteStatusDto, VoteTypeDto } from './create-vote.dto';
import { SubmitVoteDto } from './submit-vote.dto';
import { UpdateVoteDto } from './update-vote.dto';

describe('Weighted question DTO validation', () => {
  it('accepts valid specialized weighted-question configuration values', async () => {
    const dto = plainToInstance(
      CreateVoteDto,
      buildCreateVotePayload({
        weightedQuestions: [
          {
            prompt: 'How closely does this topic match your expertise?',
            displayOrder: 2,
            answerOptions: [
              {
                optionText: 'Highly relevant',
                modifier: '-0.2000',
                displayOrder: 2,
              },
              {
                optionText: 'Neutral',
                modifier: 0,
                displayOrder: 1,
              },
            ],
          },
        ],
      }),
    );

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.weightedQuestions?.[0].prompt).toBe(
      'How closely does this topic match your expertise?',
    );
    expect(dto.weightedQuestions?.[0].displayOrder).toBe(2);
    expect(dto.weightedQuestions?.[0].answerOptions[0]).toMatchObject({
      optionText: 'Highly relevant',
      modifier: -0.2,
      displayOrder: 2,
    });
    expect(dto.weightedQuestions?.[0].answerOptions[1]).toMatchObject({
      optionText: 'Neutral',
      modifier: 0,
      displayOrder: 1,
    });
  });

  it('accepts specialized create payloads with no weighted questions configured', async () => {
    const transformed = await transformWithApiPipe(CreateVoteDto, {
      ...buildCreateVotePayload(),
      weightedQuestions: [],
    });

    expect(transformed).toMatchObject({
      voteType: VoteTypeDto.SPECIALIZED,
      weightedQuestions: [],
    });
  });

  it('rejects null weightedQuestions on create payloads', async () => {
    const dto = plainToInstance(
      CreateVoteDto,
      buildCreateVotePayload({
        weightedQuestions: null,
      }),
    );

    const messages = await validateAndCollectMessages(dto);

    expect(messages).toContain('weightedQuestions must be an array');
  });

  it('rejects null weightedQuestions on update payloads', async () => {
    const dto = plainToInstance(UpdateVoteDto, {
      weightedQuestions: null,
    });

    const messages = await validateAndCollectMessages(dto);

    expect(messages).toContain('weightedQuestions must be an array');
  });

  it('rejects null weightedQuestionAnswers on submit payloads', async () => {
    const dto = plainToInstance(SubmitVoteDto, {
      selectedOptionId: 'option-1',
      weightedQuestionAnswers: null,
    });

    const messages = await validateAndCollectMessages(dto);

    expect(messages).toContain('weightedQuestionAnswers must be an array');
  });

  it('rejects empty-string weighted modifiers instead of coercing them to zero', async () => {
    const dto = plainToInstance(
      CreateVoteDto,
      buildCreateVotePayload({
        weightedQuestions: [
          {
            prompt: 'How closely does this topic match your expertise?',
            displayOrder: 1,
            answerOptions: [
              {
                optionText: 'Highly relevant',
                modifier: '',
                displayOrder: 1,
              },
              {
                optionText: 'Neutral',
                modifier: 0,
                displayOrder: 2,
              },
            ],
          },
        ],
      }),
    );

    const messages = await validateAndCollectMessages(dto);

    expect(messages).toContain(
      'modifier must be a valid decimal number with up to 4 places',
    );
  });

  it('rejects weighted modifiers beyond 4 decimal places on both create and update payloads', async () => {
    const createDto = plainToInstance(
      CreateVoteDto,
      buildCreateVotePayload({
        weightedQuestions: [
          {
            prompt: 'How closely does this topic match your expertise?',
            displayOrder: 1,
            answerOptions: [
              {
                optionText: 'Highly relevant',
                modifier: '0.12345',
                displayOrder: 1,
              },
              {
                optionText: 'Neutral',
                modifier: 0,
                displayOrder: 2,
              },
            ],
          },
        ],
      }),
    );
    const updateDto = plainToInstance(UpdateVoteDto, {
      weightedQuestions: [
        {
          prompt: 'How closely does this topic match your expertise?',
          displayOrder: 1,
          answerOptions: [
            {
              optionText: 'Highly relevant',
              modifier: '0.12345',
              displayOrder: 1,
            },
            {
              optionText: 'Neutral',
              modifier: 0,
              displayOrder: 2,
            },
          ],
        },
      ],
    });

    expect(await validateAndCollectMessages(createDto)).toContain(
      'modifier must be a valid decimal number with up to 4 places',
    );
    expect(await validateAndCollectMessages(updateDto)).toContain(
      'modifier must be a valid decimal number with up to 4 places',
    );
  });

  it('rejects invalid nested weighted-question payloads', async () => {
    const dto = plainToInstance(
      CreateVoteDto,
      buildCreateVotePayload({
        weightedQuestions: [
          {
            prompt: '   ',
            displayOrder: 0,
            answerOptions: [
              {
                optionText: '   ',
                modifier: 'abc',
                displayOrder: 0,
              },
            ],
          },
        ],
      }),
    );

    const messages = await validateAndCollectMessages(dto);

    expect(messages).toContain('prompt should not be empty');
    expect(messages).toContain('displayOrder must not be less than 1');
    expect(messages).toContain(
      'answerOptions must contain at least 2 elements',
    );
    expect(messages).toContain('optionText should not be empty');
    expect(messages).toContain(
      'modifier must be a valid decimal number with up to 4 places',
    );
  });

  it('rejects blank weighted submission answer ids', async () => {
    const dto = plainToInstance(SubmitVoteDto, {
      selectedOptionId: 'option-1',
      weightedQuestionAnswers: [
        {
          questionId: '   ',
          optionId: '',
        },
      ],
    });

    const messages = await validateAndCollectMessages(dto);

    expect(messages).toContain('questionId should not be empty');
    expect(messages).toContain('optionId should not be empty');
  });

  it('rejects create payloads that use label instead of optionText', async () => {
    const messages = await transformAndCollectMessages(
      CreateVoteDto,
      buildCreateVotePayload({
        weightedQuestions: [
          {
            prompt: 'How closely does this topic match your expertise?',
            displayOrder: 1,
            answerOptions: [
              {
                label: 'Directly relevant',
                modifier: 0.35,
                displayOrder: 1,
              },
              {
                label: 'Neutral',
                modifier: 0,
                displayOrder: 2,
              },
            ],
          },
        ],
      }),
    );

    expect(messages).toContain(
      'weightedQuestions.0.answerOptions.0.property label should not exist',
    );
    expect(messages).toContain(
      'weightedQuestions.0.answerOptions.0.optionText is required',
    );
  });

  it('rejects missing option displayOrder with a clearer required-field message', async () => {
    const messages = await transformAndCollectMessages(
      CreateVoteDto,
      buildCreateVotePayload({
        options: [
          { optionText: 'Option A' },
          { optionText: 'Option B', displayOrder: 2 },
        ],
      }),
    );

    expect(messages).toContain('options.0.displayOrder is required');
  });

  it('rejects incomplete displaySettings with required-field messages', async () => {
    const messages = await transformAndCollectMessages(
      CreateVoteDto,
      buildCreateVotePayload({
        displaySettings: {
          resultVisibilityMode: ResultVisibilityModeDto.HIDE_ALL,
          showParticipationStats: false,
        },
      }),
    );

    expect(messages).toContain(
      'displaySettings.showStakeholderBreakdown is required',
    );
    expect(messages).toContain(
      'displaySettings.showOnlyAfterVoteCloses is required',
    );
  });
});

const apiValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: false,
  },
});

async function validateAndCollectMessages(instance: object) {
  const errors = await validate(instance);

  return collectMessages(errors);
}

async function transformAndCollectMessages(
  metatype: new () => object,
  payload: object,
) {
  try {
    await transformWithApiPipe(metatype, payload);
    return [];
  } catch (error) {
    return collectPipeMessages(error);
  }
}

async function transformWithApiPipe(
  metatype: new () => object,
  payload: object,
) {
  return apiValidationPipe.transform(payload, {
    type: 'body',
    metatype,
  });
}

function collectPipeMessages(error: unknown): string[] {
  if (!(error instanceof BadRequestException)) {
    throw error;
  }

  const response = error.getResponse();

  if (
    typeof response === 'object' &&
    response !== null &&
    'message' in response
  ) {
    const message = response.message;

    if (typeof message === 'string') {
      return [message];
    }

    if (Array.isArray(message)) {
      return message.filter(
        (value): value is string => typeof value === 'string',
      );
    }
  }

  return [error.message];
}

function collectMessages(
  errors: ValidationError[],
  messages: string[] = [],
): string[] {
  for (const error of errors) {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }

    if (error.children && error.children.length > 0) {
      collectMessages(error.children, messages);
    }
  }

  return messages;
}

function buildCreateVotePayload(
  overrides: Partial<Record<string, unknown>> = {},
) {
  return {
    slug: 'weighted-qa-test',
    title: 'Weighted QA Test',
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
    weightedQuestions: [],
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
