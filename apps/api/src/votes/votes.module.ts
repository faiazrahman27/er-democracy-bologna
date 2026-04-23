import { Module } from '@nestjs/common';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { VoteWeightedPayloadCompatibilityGuard } from './vote-weighted-payload-compatibility.guard';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [VotesController],
  providers: [
    VotesService,
    SupabaseService,
    VoteWeightedPayloadCompatibilityGuard,
  ],
  exports: [VotesService],
})
export class VotesModule {}
