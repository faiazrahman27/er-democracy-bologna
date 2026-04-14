import { Module } from '@nestjs/common';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';
import { SupabaseService } from '../common/supabase/supabase.service';

@Module({
  controllers: [VotesController],
  providers: [VotesService, SupabaseService],
  exports: [VotesService],
})
export class VotesModule {}
