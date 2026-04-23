import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { VoteWeightedPayloadCompatibilityGuard } from './vote-weighted-payload-compatibility.guard';

describe('VoteWeightedPayloadCompatibilityGuard', () => {
  let guard: VoteWeightedPayloadCompatibilityGuard;
  let prismaService: {
    vote: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaService = {
      vote: {
        findUnique: jest.fn(),
      },
    };

    guard = new VoteWeightedPayloadCompatibilityGuard(prismaService as never);
  });

  it.each(['GENERAL', 'SELF_ASSESSMENT'])(
    'rejects weightedQuestions on %s create payloads before DTO/service handling',
    async (voteType) => {
      await expect(
        guard.canActivate(
          createExecutionContext({
            body: {
              voteType,
              weightedQuestions: [
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
                      optionText: 'Neutral',
                      modifier: 0,
                      displayOrder: 2,
                    },
                  ],
                },
              ],
            },
          }),
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Weighted questions are only supported for specialized votes',
        ),
      );

      expect(prismaService.vote.findUnique).not.toHaveBeenCalled();
    },
  );

  it.each(['GENERAL', 'SELF_ASSESSMENT'])(
    'rejects weightedQuestions on %s update payloads before the service layer',
    async (voteType) => {
      prismaService.vote.findUnique.mockResolvedValue({
        voteType,
      });

      await expect(
        guard.canActivate(
          createExecutionContext({
            slug: 'mobility-plan',
            body: {
              weightedQuestions: [
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
                      optionText: 'Neutral',
                      modifier: 0,
                      displayOrder: 2,
                    },
                  ],
                },
              ],
            },
          }),
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Weighted questions are only supported for specialized votes',
        ),
      );
    },
  );

  it.each(['GENERAL', 'SELF_ASSESSMENT'])(
    'rejects weightedQuestionAnswers on %s submit payloads before the service layer',
    async (voteType) => {
      prismaService.vote.findUnique.mockResolvedValue({
        voteType,
      });

      await expect(
        guard.canActivate(
          createExecutionContext({
            slug: 'mobility-plan',
            body: {
              weightedQuestionAnswers: [
                {
                  questionId: 'question-1',
                  optionId: 'answer-1',
                },
              ],
            },
          }),
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Weighted question answers are only allowed for specialized votes',
        ),
      );
    },
  );

  it('allows specialized weighted-question update payloads through', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      voteType: 'SPECIALIZED',
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          slug: 'mobility-plan',
          body: {
            weightedQuestions: [],
          },
        }),
      ),
    ).resolves.toBe(true);
  });

  it('allows specialized weighted-question submission payloads through', async () => {
    prismaService.vote.findUnique.mockResolvedValue({
      voteType: 'SPECIALIZED',
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          slug: 'mobility-plan',
          body: {
            weightedQuestionAnswers: [],
          },
        }),
      ),
    ).resolves.toBe(true);
  });
});

function createExecutionContext(input: {
  slug?: string;
  body: Record<string, unknown>;
}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        body: input.body,
        params: {
          slug: input.slug,
        },
      }),
    }),
  } as ExecutionContext;
}
