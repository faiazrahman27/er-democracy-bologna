import { Module } from '@nestjs/common';
import { PrivacyHashService } from './privacy-hash.service';

@Module({
  providers: [PrivacyHashService],
  exports: [PrivacyHashService],
})
export class PrivacyModule {}
