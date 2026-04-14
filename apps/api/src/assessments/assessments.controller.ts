import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpsertAssessmentDto } from './dto/upsert-assessment.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/permissions/require-permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';

type AuthenticatedUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
};

@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyAssessment(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Assessment fetched successfully',
      assessment: await this.assessmentsService.getMyAssessment(user.id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async upsertMyAssessment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertAssessmentDto,
  ) {
    return {
      message: 'Assessment saved successfully',
      assessment: await this.assessmentsService.upsertMyAssessment(user.id, dto),
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ASSESSMENT_SECRET_LOOKUP)
  @Get('secret/:secretUserId')
  async getBySecretUserId(
    @Param('secretUserId') secretUserId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return {
      message: 'Pseudonymous assessment fetched successfully',
      assessment: await this.assessmentsService.getAssessmentBySecretUserId(
        secretUserId,
        user.id,
      ),
    };
  }
}
