import { Module } from '@nestjs/common';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { VoteWeightedPayloadCompatibilityGuard } from './vote-weighted-payload-compatibility.guard';
import { AuditModule } from '../audit/audit.module';
import { PrivacyModule } from '../common/privacy/privacy.module';

@Module({
  imports: [AuditModule, PrivacyModule],
  controllers: [VotesController],
  providers: [
    VotesService,
    SupabaseService,
    VoteWeightedPayloadCompatibilityGuard,
  ],
  exports: [VotesService],
})
export class VotesModule {}
