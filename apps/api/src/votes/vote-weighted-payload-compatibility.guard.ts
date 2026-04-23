import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VoteWeightedPayloadCompatibilityGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      body?: Record<string, unknown>;
      params?: { slug?: string };
    }>();

    const body =
      request.body && typeof request.body === 'object' ? request.body : {};
    const hasWeightedQuestions = this.hasOwnSafeProperty(
      body,
      'weightedQuestions',
    );
    const hasWeightedQuestionAnswers = this.hasOwnSafeProperty(
      body,
      'weightedQuestionAnswers',
    );

    if (!hasWeightedQuestions && !hasWeightedQuestionAnswers) {
      return true;
    }

    const requestVoteType =
      typeof body.voteType === 'string' ? body.voteType : undefined;

    if (
      hasWeightedQuestions &&
      requestVoteType &&
      requestVoteType !== 'SPECIALIZED'
    ) {
      throw new BadRequestException(
        'Weighted questions are only supported for specialized votes',
      );
    }

    const slug =
      typeof request.params?.slug === 'string'
        ? request.params.slug.trim().toLowerCase()
        : '';

    if (!slug) {
      return true;
    }

    const vote = await this.prisma.vote.findUnique({
      where: { slug },
      select: { voteType: true },
    });

    if (!vote) {
      return true;
    }

    if (hasWeightedQuestions && vote.voteType !== 'SPECIALIZED') {
      throw new BadRequestException(
        'Weighted questions are only supported for specialized votes',
      );
    }

    if (hasWeightedQuestionAnswers && vote.voteType !== 'SPECIALIZED') {
      throw new BadRequestException(
        'Weighted question answers are only allowed for specialized votes',
      );
    }

    return true;
  }

  private hasOwnSafeProperty(
    value: Record<string, unknown>,
    propertyName: string,
  ): boolean {
    return Object.prototype.hasOwnProperty.call(value, propertyName);
  }
}
