import { Module } from '@nestjs/common';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { AuditModule } from '../audit/audit.module';
import { PrivacyModule } from '../common/privacy/privacy.module';

@Module({
  imports: [AuditModule, PrivacyModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
