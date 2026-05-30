import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

@Injectable()
export class PrivacyHashService {
  private readonly hmacSecret: string;

  constructor(private readonly configService: ConfigService) {
    const configuredSecret = this.configService.get<string>('PRIVACY_HMAC_SECRET');

    if (!configuredSecret || configuredSecret.trim().length < 32) {
      throw new InternalServerErrorException(
        'PRIVACY_HMAC_SECRET must be configured with at least 32 characters.',
      );
    }

    this.hmacSecret = configuredSecret.trim();
  }

  createAssessmentOwnerHash(userId: string): string {
    return this.createScopedHash('assessment-owner', userId);
  }

  createVoteVoterHash(voteId: string, userId: string): string {
    return this.createScopedHash('vote-voter', `${voteId}:${userId}`);
  }

  private createScopedHash(scope: string, value: string): string {
    return createHmac('sha256', this.hmacSecret)
      .update(`${scope}:${value}`)
      .digest('hex');
  }
}
