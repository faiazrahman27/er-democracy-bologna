import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { VotesService } from './votes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateVoteDto } from './dto/create-vote.dto';
import { UpdateVoteDto } from './dto/update-vote.dto';
import { SubmitVoteDto } from './dto/submit-vote.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/permissions/require-permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';
import { roleHasPermission } from '../auth/permissions/role-permissions.constants';
import { SupabaseService } from '../common/supabase/supabase.service';
import { ImageUploadInterceptor } from '../common/upload/image-upload.interceptor';
import { VoteWeightedPayloadCompatibilityGuard } from './vote-weighted-payload-compatibility.guard';

type AuthenticatedUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
};

@Controller('votes')
export class VotesController {
  constructor(
    private readonly votesService: VotesService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get('public')
  async getPublicVotes() {
    return {
      message: 'Public votes fetched successfully',
      votes: await this.votesService.getPublicVotes(),
    };
  }

  @Get('public/:slug')
  async getPublicVoteBySlug(@Param('slug') slug: string) {
    return {
      message: 'Public vote fetched successfully',
      vote: await this.votesService.getPublicVoteBySlug(slug),
    };
  }

  @Get('public/:slug/results')
  async getPublicResults(@Param('slug') slug: string) {
    return {
      message: 'Public vote results fetched successfully',
      results: await this.votesService.getPublicResults(slug),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/:slug/results')
  async getMyVisibleResults(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
  ) {
    return {
      message: 'Vote results fetched for authenticated user successfully',
      results: await this.votesService.getPublicResults(slug, user.id),
    };
  }

  @Get('public/:slug/analytics')
  async getPublicAnalytics(@Param('slug') slug: string) {
    return {
      message: 'Public vote analytics fetched successfully',
      analytics: await this.votesService.getPublicAnalytics(slug),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/:slug/analytics')
  async getMyVisibleAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
  ) {
    return {
      message: 'Vote analytics fetched for authenticated user successfully',
      analytics: await this.votesService.getPublicAnalytics(slug, user.id),
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.CONSULTATION_VIEW_ADMIN)
  @Get('admin')
  async getAdminVotes() {
    return {
      message: 'Admin votes fetched successfully',
      votes: await this.votesService.getAdminVotes(),
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.CONSULTATION_VIEW_ADMIN)
  @Get('admin/:slug')
  async getAdminVoteBySlug(@Param('slug') slug: string) {
    return {
      message: 'Admin vote fetched successfully',
      vote: await this.votesService.getAdminVoteBySlug(slug),
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.RESULTS_VIEW_ADMIN)
  @Get('admin/:slug/results')
  async getAdminResults(@Param('slug') slug: string) {
    return {
      message: 'Admin vote results fetched successfully',
      results: await this.votesService.getAdminResults(slug),
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ANALYTICS_VIEW_ADMIN)
  @Get('admin/:slug/analytics')
  async getAdminAnalytics(@Param('slug') slug: string) {
    return {
      message: 'Admin vote analytics fetched successfully',
      analytics: await this.votesService.getAdminAnalytics(slug),
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.PARTICIPANTS_VIEW_ADMIN)
  @Get('admin/:slug/participants')
  async getAdminParticipants(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const includeSecretUserId = roleHasPermission(
      user.role,
      PERMISSIONS.ASSESSMENT_SECRET_LOOKUP,
    );

    return {
      message: 'Admin vote participants fetched successfully',
      participants: await this.votesService.getAdminParticipants(slug, {
        includeSecretUserId,
      }),
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ANALYTICS_VIEW_ADMIN)
  @Get('admin/:slug/export')
  async exportAdminAnalyticsExcel(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() response: Response,
  ) {
    const includeParticipantSheet = roleHasPermission(
      user.role,
      PERMISSIONS.PARTICIPANTS_VIEW_ADMIN,
    );
    const includeSecretUserId =
      includeParticipantSheet &&
      roleHasPermission(user.role, PERMISSIONS.ASSESSMENT_SECRET_LOOKUP);
    const includeSensitiveAssessmentDetails = includeSecretUserId;
    const file = await this.votesService.exportAdminAnalyticsExcel(slug, {
      includeParticipantSheet,
      includeSecretUserId,
      includeSensitiveAssessmentDetails,
    });

    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName}"`,
    );

    return response.send(file.buffer);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.MEDIA_UPLOAD)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('admin/upload-cover')
  @UseInterceptors(ImageUploadInterceptor('file'))
  async uploadVoteCoverImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('slug') slug?: string,
  ) {
    const uploadedFile = await this.supabaseService.uploadVoteCoverImage(
      file,
      slug,
    );

    return {
      message: 'Vote cover image uploaded successfully',
      file: uploadedFile,
    };
  }

  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
    VoteWeightedPayloadCompatibilityGuard,
  )
  @RequirePermissions(PERMISSIONS.CONSULTATION_CREATE)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post()
  async createVote(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateVoteDto,
  ) {
    return {
      message: 'Vote created successfully',
      vote: await this.votesService.createVote(user.id, dto),
    };
  }

  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
    VoteWeightedPayloadCompatibilityGuard,
  )
  @RequirePermissions(PERMISSIONS.CONSULTATION_EDIT)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Patch(':slug')
  async updateVote(@Param('slug') slug: string, @Body() dto: UpdateVoteDto) {
    return {
      message: 'Vote updated successfully',
      vote: await this.votesService.updateVote(slug, dto),
    };
  }

  @UseGuards(JwtAuthGuard, VoteWeightedPayloadCompatibilityGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':slug/submit')
  async submitVote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Body() dto: SubmitVoteDto,
  ) {
    return {
      message: 'Vote submitted successfully',
      submission: await this.votesService.submitVote(user.id, slug, dto),
    };
  }
}
