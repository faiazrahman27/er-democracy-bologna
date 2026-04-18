import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { UpdateVoteDto } from './dto/update-vote.dto';
import { SubmitVoteDto } from './dto/submit-vote.dto';
import { calculateVoteWeight } from '../common/voting/vote-weight.util';
import {
  evaluateAnalyticsVisibility,
  evaluateResultVisibility,
  normalizeVisibilityTimingSettings,
} from '../common/voting/result-visibility.util';
import { buildBreakdown } from '../common/voting/analytics.util';
import { formatStoredValueLabel } from '../assessments/assessment-value-labels';

@Injectable()
export class VotesService {
  constructor(private readonly prisma: PrismaService) {}

  async createVote(adminUserId: string, dto: CreateVoteDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    const displaySettings = normalizeVisibilityTimingSettings(
      dto.displaySettings,
    );

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Invalid startAt or endAt');
    }

    if (endAt <= startAt) {
      throw new BadRequestException('endAt must be after startAt');
    }

    const uniqueDisplayOrders = new Set(
      dto.options.map((option) => option.displayOrder),
    );

    if (uniqueDisplayOrders.size !== dto.options.length) {
      throw new BadRequestException(
        'Option displayOrder values must be unique',
      );
    }

    const normalizedSlug = dto.slug.trim().toLowerCase();

    const existingVote = await this.prisma.vote.findUnique({
      where: { slug: normalizedSlug },
      select: { id: true },
    });

    if (existingVote) {
      throw new BadRequestException('A vote with this slug already exists');
    }

    return this.prisma.vote.create({
      data: {
        slug: normalizedSlug,
        title: dto.title.trim(),
        summary: dto.summary.trim(),
        methodologySummary: dto.methodologySummary?.trim(),
        voteType: dto.voteType,
        topicCategory: dto.topicCategory.trim(),
        status: dto.status,
        coverImageUrl: dto.coverImageUrl?.trim() || null,
        coverImageAlt: dto.coverImageAlt?.trim() || null,
        startAt,
        endAt,
        isPublished: dto.isPublished,
        publishedAt: dto.isPublished ? new Date() : null,
        createdByAdminId: adminUserId,
        options: {
          create: dto.options.map((option) => ({
            optionText: option.optionText.trim(),
            displayOrder: option.displayOrder,
          })),
        },
        displaySettings: {
          create: {
            resultVisibilityMode: displaySettings.resultVisibilityMode,
            showParticipationStats: displaySettings.showParticipationStats,
            showStakeholderBreakdown: displaySettings.showStakeholderBreakdown,
            showBackgroundBreakdown: displaySettings.showBackgroundBreakdown,
            showLocationBreakdown: displaySettings.showLocationBreakdown,
            showAgeRangeBreakdown: displaySettings.showAgeRangeBreakdown,
            showGenderBreakdown: displaySettings.showGenderBreakdown,
            showExperienceLevelBreakdown:
              displaySettings.showExperienceLevelBreakdown,
            showRelationshipBreakdown:
              displaySettings.showRelationshipBreakdown,
            showAfterVotingOnly: displaySettings.showAfterVotingOnly,
            showOnlyAfterVoteCloses: displaySettings.showOnlyAfterVoteCloses,
          },
        },
      },
      select: this.fullVoteSelect(),
    });
  }

  async getPublicVotes() {
    const now = new Date();

    const votes = await this.prisma.vote.findMany({
      where: {
        isPublished: true,
        status: {
          in: ['PUBLISHED', 'CLOSED'],
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        voteType: true,
        topicCategory: true,
        status: true,
        coverImageUrl: true,
        coverImageAlt: true,
        startAt: true,
        endAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ startAt: 'desc' }, { createdAt: 'desc' }],
    });

    return votes.map((vote) => ({
      ...this.normalizeVoteDisplaySettings(vote),
      derivedStatus: this.getDerivedStatus(
        vote.startAt,
        vote.endAt,
        vote.status,
        now,
      ),
    }));
  }

  async getAdminVotes() {
    const now = new Date();

    const votes = await this.prisma.vote.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        methodologySummary: true,
        voteType: true,
        topicCategory: true,
        status: true,
        coverImageUrl: true,
        coverImageAlt: true,
        startAt: true,
        endAt: true,
        isPublished: true,
        publishedAt: true,
        lockedAt: true,
        createdByAdminId: true,
        createdAt: true,
        updatedAt: true,
        options: {
          select: {
            id: true,
            optionText: true,
            displayOrder: true,
            createdAt: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        displaySettings: {
          select: {
            id: true,
            resultVisibilityMode: true,
            showParticipationStats: true,
            showStakeholderBreakdown: true,
            showBackgroundBreakdown: true,
            showLocationBreakdown: true,
            showAgeRangeBreakdown: true,
            showGenderBreakdown: true,
            showExperienceLevelBreakdown: true,
            showRelationshipBreakdown: true,
            showAfterVotingOnly: true,
            showOnlyAfterVoteCloses: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        submissions: {
          select: {
            id: true,
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return votes.map((vote) => ({
      ...vote,
      derivedStatus: this.getDerivedStatus(
        vote.startAt,
        vote.endAt,
        vote.status,
        now,
      ),
      submissionCount: vote.submissions.length,
    }));
  }

  async getPublicVoteBySlug(slug: string) {
    const normalizedSlug = slug.trim().toLowerCase();

    const vote = await this.prisma.vote.findFirst({
      where: {
        slug: normalizedSlug,
        isPublished: true,
        status: {
          in: ['PUBLISHED', 'CLOSED'],
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        methodologySummary: true,
        voteType: true,
        topicCategory: true,
        status: true,
        coverImageUrl: true,
        coverImageAlt: true,
        startAt: true,
        endAt: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        options: {
          select: {
            id: true,
            optionText: true,
            displayOrder: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        displaySettings: {
          select: {
            resultVisibilityMode: true,
            showParticipationStats: true,
            showStakeholderBreakdown: true,
            showBackgroundBreakdown: true,
            showLocationBreakdown: true,
            showAgeRangeBreakdown: true,
            showGenderBreakdown: true,
            showExperienceLevelBreakdown: true,
            showRelationshipBreakdown: true,
            showAfterVotingOnly: true,
            showOnlyAfterVoteCloses: true,
          },
        },
      },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    const now = new Date();

    return {
      ...this.normalizeVoteDisplaySettings(vote),
      derivedStatus: this.getDerivedStatus(
        vote.startAt,
        vote.endAt,
        vote.status,
        now,
      ),
    };
  }

  async getAdminVoteBySlug(slug: string) {
    const normalizedSlug = slug.trim().toLowerCase();

    const vote = await this.prisma.vote.findUnique({
      where: { slug: normalizedSlug },
      select: {
        ...this.fullVoteSelect(),
        submissions: {
          select: { id: true },
        },
      },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    const now = new Date();

    return {
      ...this.normalizeVoteDisplaySettings(vote),
      derivedStatus: this.getDerivedStatus(
        vote.startAt,
        vote.endAt,
        vote.status,
        now,
      ),
      submissionCount: vote.submissions.length,
    };
  }

  async updateVote(slug: string, dto: UpdateVoteDto) {
    const normalizedSlug = slug.trim().toLowerCase();

    const existingVote = await this.prisma.vote.findUnique({
      where: { slug: normalizedSlug },
      select: {
        id: true,
        title: true,
        summary: true,
        methodologySummary: true,
        startAt: true,
        endAt: true,
        isPublished: true,
        submissions: {
          select: { id: true },
          take: 1,
        },
        displaySettings: {
          select: {
            id: true,
            resultVisibilityMode: true,
            showParticipationStats: true,
            showStakeholderBreakdown: true,
            showBackgroundBreakdown: true,
            showLocationBreakdown: true,
            showAgeRangeBreakdown: true,
            showGenderBreakdown: true,
            showExperienceLevelBreakdown: true,
            showRelationshipBreakdown: true,
            showAfterVotingOnly: true,
            showOnlyAfterVoteCloses: true,
          },
        },
      },
    });

    if (!existingVote) {
      throw new NotFoundException('Vote not found');
    }

    const hasSubmissions = existingVote.submissions.length > 0;
    const hasDisplaySettingsUpdate =
      dto.resultVisibilityMode !== undefined ||
      dto.showParticipationStats !== undefined ||
      dto.showStakeholderBreakdown !== undefined ||
      dto.showBackgroundBreakdown !== undefined ||
      dto.showLocationBreakdown !== undefined ||
      dto.showAgeRangeBreakdown !== undefined ||
      dto.showGenderBreakdown !== undefined ||
      dto.showExperienceLevelBreakdown !== undefined ||
      dto.showRelationshipBreakdown !== undefined ||
      dto.showAfterVotingOnly !== undefined ||
      dto.showOnlyAfterVoteCloses !== undefined;

    if (hasSubmissions) {
      const attemptedCoreChanges =
        dto.title !== undefined ||
        dto.summary !== undefined ||
        dto.methodologySummary !== undefined ||
        dto.startAt !== undefined;

      if (attemptedCoreChanges) {
        throw new ForbiddenException(
          'Core vote fields cannot be changed after submissions exist',
        );
      }
    }

    const nextStartAt = dto.startAt
      ? new Date(dto.startAt)
      : existingVote.startAt;
    const nextEndAt = dto.endAt ? new Date(dto.endAt) : existingVote.endAt;

    if (
      Number.isNaN(nextStartAt.getTime()) ||
      Number.isNaN(nextEndAt.getTime())
    ) {
      throw new BadRequestException('Invalid startAt or endAt');
    }

    if (nextEndAt <= nextStartAt) {
      throw new BadRequestException('endAt must be after startAt');
    }

    const nextDisplaySettings =
      existingVote.displaySettings && hasDisplaySettingsUpdate
        ? normalizeVisibilityTimingSettings({
            resultVisibilityMode:
              dto.resultVisibilityMode ??
              existingVote.displaySettings.resultVisibilityMode,
            showParticipationStats:
              dto.showParticipationStats ??
              existingVote.displaySettings.showParticipationStats,
            showStakeholderBreakdown:
              dto.showStakeholderBreakdown ??
              existingVote.displaySettings.showStakeholderBreakdown,
            showBackgroundBreakdown:
              dto.showBackgroundBreakdown ??
              existingVote.displaySettings.showBackgroundBreakdown,
            showLocationBreakdown:
              dto.showLocationBreakdown ??
              existingVote.displaySettings.showLocationBreakdown,
            showAgeRangeBreakdown:
              dto.showAgeRangeBreakdown ??
              existingVote.displaySettings.showAgeRangeBreakdown,
            showGenderBreakdown:
              dto.showGenderBreakdown ??
              existingVote.displaySettings.showGenderBreakdown,
            showExperienceLevelBreakdown:
              dto.showExperienceLevelBreakdown ??
              existingVote.displaySettings.showExperienceLevelBreakdown,
            showRelationshipBreakdown:
              dto.showRelationshipBreakdown ??
              existingVote.displaySettings.showRelationshipBreakdown,
            showAfterVotingOnly:
              dto.showAfterVotingOnly ??
              existingVote.displaySettings.showAfterVotingOnly,
            showOnlyAfterVoteCloses:
              dto.showOnlyAfterVoteCloses ??
              existingVote.displaySettings.showOnlyAfterVoteCloses,
          })
        : null;

    return this.prisma.vote.update({
      where: { slug: normalizedSlug },
      data: {
        title: dto.title?.trim(),
        summary: dto.summary?.trim(),
        methodologySummary:
          dto.methodologySummary !== undefined
            ? dto.methodologySummary.trim()
            : undefined,
        status: dto.status,
        coverImageUrl:
          dto.coverImageUrl !== undefined
            ? dto.coverImageUrl.trim()
            : undefined,
        coverImageAlt:
          dto.coverImageAlt !== undefined
            ? dto.coverImageAlt.trim()
            : undefined,
        startAt: dto.startAt ? nextStartAt : undefined,
        endAt: dto.endAt ? nextEndAt : undefined,
        isPublished: dto.isPublished,
        publishedAt:
          dto.isPublished === true
            ? existingVote.isPublished
              ? undefined
              : new Date()
            : dto.isPublished === false
              ? null
              : undefined,
        lockedAt: hasSubmissions ? new Date() : undefined,
        displaySettings: nextDisplaySettings
          ? {
              update: {
                resultVisibilityMode: nextDisplaySettings.resultVisibilityMode,
                showParticipationStats:
                  nextDisplaySettings.showParticipationStats,
                showStakeholderBreakdown:
                  nextDisplaySettings.showStakeholderBreakdown,
                showBackgroundBreakdown:
                  nextDisplaySettings.showBackgroundBreakdown,
                showLocationBreakdown:
                  nextDisplaySettings.showLocationBreakdown,
                showAgeRangeBreakdown:
                  nextDisplaySettings.showAgeRangeBreakdown,
                showGenderBreakdown: nextDisplaySettings.showGenderBreakdown,
                showExperienceLevelBreakdown:
                  nextDisplaySettings.showExperienceLevelBreakdown,
                showRelationshipBreakdown:
                  nextDisplaySettings.showRelationshipBreakdown,
                showAfterVotingOnly: nextDisplaySettings.showAfterVotingOnly,
                showOnlyAfterVoteCloses:
                  nextDisplaySettings.showOnlyAfterVoteCloses,
              },
            }
          : undefined,
      },
      select: this.fullVoteSelect(),
    });
  }

  async submitVote(userId: string, slug: string, dto: SubmitVoteDto) {
    const normalizedSlug = slug.trim().toLowerCase();

    const vote = await this.prisma.vote.findUnique({
      where: { slug: normalizedSlug },
      select: {
        id: true,
        voteType: true,
        topicCategory: true,
        status: true,
        isPublished: true,
        startAt: true,
        endAt: true,
        options: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    if (!vote.isPublished) {
      throw new ForbiddenException('This vote is not published');
    }

    if (vote.status !== 'PUBLISHED') {
      throw new ForbiddenException('This vote is not open for submission');
    }

    const now = new Date();

    if (now < vote.startAt) {
      throw new ForbiddenException('Voting has not started yet');
    }

    if (now > vote.endAt) {
      throw new ForbiddenException('Voting has already ended');
    }

    const selectedOptionBelongsToVote = vote.options.some(
      (option) => option.id === dto.selectedOptionId,
    );

    if (!selectedOptionBelongsToVote) {
      throw new BadRequestException(
        'Selected option does not belong to this vote',
      );
    }

    const existingSubmission = await this.prisma.voteSubmission.findUnique({
      where: {
        voteId_userId: {
          voteId: vote.id,
          userId,
        },
      },
      select: { id: true },
    });

    if (existingSubmission) {
      throw new ForbiddenException(
        'You have already voted on this consultation',
      );
    }

    let assessment: {
      stakeholderRole: string | null;
      backgroundCategory: string | null;
      experienceLevel: string | null;
      relationshipToArea: string | null;
      city: string | null;
      region: string | null;
      country: string | null;
      assessmentCompleted: boolean;
    } | null = null;

    if (vote.voteType === 'SPECIALIZED') {
      assessment = await this.prisma.assessment.findUnique({
        where: { userId },
        select: {
          stakeholderRole: true,
          backgroundCategory: true,
          experienceLevel: true,
          relationshipToArea: true,
          city: true,
          region: true,
          country: true,
          assessmentCompleted: true,
        },
      });

      if (!assessment || !assessment.assessmentCompleted) {
        throw new ForbiddenException(
          'A completed assessment is required for specialized votes',
        );
      }
    }

    if (vote.voteType === 'SELF_ASSESSMENT') {
      if (
        dto.selfAssessmentScore === undefined ||
        dto.selfAssessmentScore === null ||
        !Number.isInteger(dto.selfAssessmentScore) ||
        dto.selfAssessmentScore < 1 ||
        dto.selfAssessmentScore > 10
      ) {
        throw new BadRequestException(
          'A selfAssessmentScore between 1 and 10 is required for self-assessment votes',
        );
      }
    }

    let weightResult;
    try {
      weightResult = calculateVoteWeight({
        voteType: vote.voteType,
        topicCategory: vote.topicCategory,
        assessment,
        selfAssessmentScore: dto.selfAssessmentScore,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to calculate vote weight',
      );
    }

    return this.prisma.voteSubmission.create({
      data: {
        voteId: vote.id,
        userId,
        selectedOptionId: dto.selectedOptionId,
        selfAssessmentScore:
          vote.voteType === 'SELF_ASSESSMENT'
            ? (dto.selfAssessmentScore ?? null)
            : null,
        weightUsed: weightResult.weightUsed,
        calculationType: weightResult.calculationType,
      },
      select: {
        id: true,
        voteId: true,
        userId: true,
        selectedOptionId: true,
        selfAssessmentScore: true,
        weightUsed: true,
        calculationType: true,
        submittedAt: true,
        createdAt: true,
      },
    });
  }

  async getPublicResults(slug: string, userId?: string) {
    const normalizedSlug = slug.trim().toLowerCase();

    const vote = await this.prisma.vote.findUnique({
      where: { slug: normalizedSlug },
      select: {
        id: true,
        slug: true,
        title: true,
        endAt: true,
        displaySettings: {
          select: {
            resultVisibilityMode: true,
            showAfterVotingOnly: true,
            showOnlyAfterVoteCloses: true,
            showParticipationStats: true,
          },
        },
        options: {
          select: {
            id: true,
            optionText: true,
            displayOrder: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        submissions: {
          select: {
            selectedOptionId: true,
            weightUsed: true,
          },
        },
      },
    });

    if (!vote || !vote.displaySettings) {
      throw new NotFoundException('Vote results not found');
    }

    const displaySettings = normalizeVisibilityTimingSettings(
      vote.displaySettings,
    );

    let userHasVoted = false;

    if (userId) {
      const submission = await this.prisma.voteSubmission.findUnique({
        where: {
          voteId_userId: {
            voteId: vote.id,
            userId,
          },
        },
        select: { id: true },
      });

      userHasVoted = !!submission;
    }

    const visibility = evaluateResultVisibility({
      resultVisibilityMode: displaySettings.resultVisibilityMode,
      showAfterVotingOnly: displaySettings.showAfterVotingOnly,
      showOnlyAfterVoteCloses: displaySettings.showOnlyAfterVoteCloses,
      userHasVoted,
      now: new Date(),
      endAt: vote.endAt,
    });

    if (!visibility.canShowResults) {
      return {
        slug: vote.slug,
        title: vote.title,
        visibility: {
          canShowResults: false,
          showRawResults: false,
          showWeightedResults: false,
        },
        results: null,
      };
    }

    const totalRawVotes = vote.submissions.length;
    const totalWeightedVotes = Number(
      vote.submissions
        .reduce((sum, submission) => sum + Number(submission.weightUsed), 0)
        .toFixed(4),
    );

    const results = vote.options.map((option) => {
      const optionSubmissions = vote.submissions.filter(
        (submission) => submission.selectedOptionId === option.id,
      );

      const rawCount = optionSubmissions.length;
      const weightedCount = Number(
        optionSubmissions
          .reduce((sum, submission) => sum + Number(submission.weightUsed), 0)
          .toFixed(4),
      );

      const rawPercentage =
        totalRawVotes > 0
          ? Number(((rawCount / totalRawVotes) * 100).toFixed(2))
          : 0;

      const weightedPercentage =
        totalWeightedVotes > 0
          ? Number(((weightedCount / totalWeightedVotes) * 100).toFixed(2))
          : 0;

      return {
        optionId: option.id,
        optionText: option.optionText,
        displayOrder: option.displayOrder,
        ...(visibility.showRawResults
          ? {
              rawCount,
              rawPercentage,
            }
          : {}),
        ...(visibility.showWeightedResults
          ? {
              weightedCount,
              weightedPercentage,
            }
          : {}),
      };
    });

    return {
      slug: vote.slug,
      title: vote.title,
      visibility,
      results: {
        totals: {
          ...(visibility.showRawResults ? { totalRawVotes } : {}),
          ...(visibility.showWeightedResults ? { totalWeightedVotes } : {}),
        },
        options: results,
        ...(displaySettings.showParticipationStats
          ? { participation: { totalParticipants: totalRawVotes } }
          : {}),
      },
    };
  }

  async getAdminResults(slug: string) {
    const normalizedSlug = slug.trim().toLowerCase();

    const vote = await this.prisma.vote.findUnique({
      where: { slug: normalizedSlug },
      select: {
        id: true,
        slug: true,
        title: true,
        voteType: true,
        topicCategory: true,
        options: {
          select: {
            id: true,
            optionText: true,
            displayOrder: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        submissions: {
          select: {
            selectedOptionId: true,
            weightUsed: true,
            calculationType: true,
            selfAssessmentScore: true,
          },
        },
      },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    const totalRawVotes = vote.submissions.length;
    const totalWeightedVotes = Number(
      vote.submissions
        .reduce((sum, submission) => sum + Number(submission.weightUsed), 0)
        .toFixed(4),
    );

    const optionResults = vote.options.map((option) => {
      const optionSubmissions = vote.submissions.filter(
        (submission) => submission.selectedOptionId === option.id,
      );

      const rawCount = optionSubmissions.length;
      const weightedCount = Number(
        optionSubmissions
          .reduce((sum, submission) => sum + Number(submission.weightUsed), 0)
          .toFixed(4),
      );

      const rawPercentage =
        totalRawVotes > 0
          ? Number(((rawCount / totalRawVotes) * 100).toFixed(2))
          : 0;

      const weightedPercentage =
        totalWeightedVotes > 0
          ? Number(((weightedCount / totalWeightedVotes) * 100).toFixed(2))
          : 0;

      return {
        optionId: option.id,
        optionText: option.optionText,
        displayOrder: option.displayOrder,
        rawCount,
        rawPercentage,
        weightedCount,
        weightedPercentage,
      };
    });

    return {
      slug: vote.slug,
      title: vote.title,
      voteType: vote.voteType,
      topicCategory: vote.topicCategory,
      totals: {
        totalRawVotes,
        totalWeightedVotes,
      },
      options: optionResults,
    };
  }

  async getPublicAnalytics(slug: string, userId?: string) {
    const normalizedSlug = slug.trim().toLowerCase();

    const vote = await this.prisma.vote.findUnique({
      where: { slug: normalizedSlug },
      select: {
        id: true,
        slug: true,
        title: true,
        endAt: true,
        displaySettings: {
          select: {
            resultVisibilityMode: true,
            showAfterVotingOnly: true,
            showOnlyAfterVoteCloses: true,
            showParticipationStats: true,
            showStakeholderBreakdown: true,
            showBackgroundBreakdown: true,
            showLocationBreakdown: true,
            showAgeRangeBreakdown: true,
            showGenderBreakdown: true,
            showExperienceLevelBreakdown: true,
            showRelationshipBreakdown: true,
          },
        },
        submissions: {
          select: {
            userId: true,
            user: {
              select: {
                assessment: {
                  select: {
                    ageRange: true,
                    gender: true,
                    stakeholderRole: true,
                    backgroundCategory: true,
                    experienceLevel: true,
                    relationshipToArea: true,
                    city: true,
                    region: true,
                    country: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!vote || !vote.displaySettings) {
      throw new NotFoundException('Vote analytics not found');
    }

    const displaySettings = normalizeVisibilityTimingSettings(
      vote.displaySettings,
    );

    let userHasVoted = false;

    if (userId) {
      userHasVoted = vote.submissions.some(
        (submission) => submission.userId === userId,
      );
    }

    const hasAnyPublicAnalyticsEnabled =
      displaySettings.showParticipationStats ||
      displaySettings.showStakeholderBreakdown ||
      displaySettings.showBackgroundBreakdown ||
      displaySettings.showLocationBreakdown ||
      displaySettings.showAgeRangeBreakdown ||
      displaySettings.showGenderBreakdown ||
      displaySettings.showExperienceLevelBreakdown ||
      displaySettings.showRelationshipBreakdown;

    const visibility = evaluateAnalyticsVisibility({
      hasAnyPublicAnalyticsEnabled,
      showAfterVotingOnly: displaySettings.showAfterVotingOnly,
      showOnlyAfterVoteCloses: displaySettings.showOnlyAfterVoteCloses,
      userHasVoted,
      now: new Date(),
      endAt: vote.endAt,
    });

    if (!visibility.canShowAnalytics) {
      return {
        slug: vote.slug,
        title: vote.title,
        visibility: {
          canShowAnalytics: false,
        },
        analytics: null,
      };
    }

    const analytics: Record<string, unknown> = {};

    if (displaySettings.showParticipationStats) {
      analytics.participation = {
        totalParticipants: vote.submissions.length,
      };
    }

    if (displaySettings.showStakeholderBreakdown) {
      analytics.stakeholderBreakdown = buildBreakdown(
        vote.submissions.map(
          (submission) => submission.user.assessment?.stakeholderRole,
        ),
      );
    }

    if (displaySettings.showBackgroundBreakdown) {
      analytics.backgroundBreakdown = buildBreakdown(
        vote.submissions.map(
          (submission) => submission.user.assessment?.backgroundCategory,
        ),
      );
    }

    if (displaySettings.showLocationBreakdown) {
      analytics.locationBreakdown = buildBreakdown(
        vote.submissions.map(
          (submission) =>
            submission.user.assessment?.city ||
            submission.user.assessment?.region ||
            submission.user.assessment?.country,
        ),
      );
    }

    if (displaySettings.showAgeRangeBreakdown) {
      analytics.ageRangeBreakdown = buildBreakdown(
        vote.submissions.map(
          (submission) => submission.user.assessment?.ageRange,
        ),
      );
    }

    if (displaySettings.showGenderBreakdown) {
      analytics.genderBreakdown = buildBreakdown(
        vote.submissions.map(
          (submission) => submission.user.assessment?.gender,
        ),
      );
    }

    if (displaySettings.showExperienceLevelBreakdown) {
      analytics.experienceLevelBreakdown = buildBreakdown(
        vote.submissions.map(
          (submission) => submission.user.assessment?.experienceLevel,
        ),
      );
    }

    if (displaySettings.showRelationshipBreakdown) {
      analytics.relationshipToAreaBreakdown = buildBreakdown(
        vote.submissions.map(
          (submission) => submission.user.assessment?.relationshipToArea,
        ),
      );
    }

    return {
      slug: vote.slug,
      title: vote.title,
      visibility,
      analytics,
    };
  }

  async getAdminAnalytics(slug: string) {
    const normalizedSlug = slug.trim().toLowerCase();

    const vote = await this.prisma.vote.findUnique({
      where: { slug: normalizedSlug },
      select: {
        id: true,
        slug: true,
        title: true,
        submissions: {
          select: {
            id: true,
            weightUsed: true,
            user: {
              select: {
                assessment: {
                  select: {
                    secretUserId: true,
                    ageRange: true,
                    gender: true,
                    stakeholderRole: true,
                    backgroundCategory: true,
                    experienceLevel: true,
                    relationshipToArea: true,
                    city: true,
                    region: true,
                    country: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!vote) {
      throw new NotFoundException('Vote analytics not found');
    }

    const totalParticipants = vote.submissions.length;
    const totalWeightedVotes = Number(
      vote.submissions
        .reduce((sum, submission) => sum + Number(submission.weightUsed), 0)
        .toFixed(4),
    );

    return {
      slug: vote.slug,
      title: vote.title,
      totals: {
        totalParticipants,
        totalWeightedVotes,
      },
      breakdowns: {
        stakeholderBreakdown: buildBreakdown(
          vote.submissions.map(
            (submission) => submission.user.assessment?.stakeholderRole,
          ),
        ),
        backgroundBreakdown: buildBreakdown(
          vote.submissions.map(
            (submission) => submission.user.assessment?.backgroundCategory,
          ),
        ),
        locationBreakdown: buildBreakdown(
          vote.submissions.map(
            (submission) =>
              submission.user.assessment?.city ||
              submission.user.assessment?.region ||
              submission.user.assessment?.country,
          ),
        ),
        ageRangeBreakdown: buildBreakdown(
          vote.submissions.map(
            (submission) => submission.user.assessment?.ageRange,
          ),
        ),
        genderBreakdown: buildBreakdown(
          vote.submissions.map(
            (submission) => submission.user.assessment?.gender,
          ),
        ),
        experienceLevelBreakdown: buildBreakdown(
          vote.submissions.map(
            (submission) => submission.user.assessment?.experienceLevel,
          ),
        ),
        relationshipToAreaBreakdown: buildBreakdown(
          vote.submissions.map(
            (submission) => submission.user.assessment?.relationshipToArea,
          ),
        ),
      },
    };
  }

  async getAdminParticipants(slug: string) {
    const normalizedSlug = slug.trim().toLowerCase();

    const vote = await this.prisma.vote.findUnique({
      where: { slug: normalizedSlug },
      select: {
        id: true,
        slug: true,
        title: true,
        submissions: {
          orderBy: {
            submittedAt: 'desc',
          },
          select: {
            id: true,
            selectedOptionId: true,
            weightUsed: true,
            calculationType: true,
            selfAssessmentScore: true,
            submittedAt: true,
            user: {
              select: {
                assessment: {
                  select: {
                    secretUserId: true,
                    assessmentCompleted: true,
                  },
                },
              },
            },
            selectedOption: {
              select: {
                optionText: true,
              },
            },
          },
        },
      },
    });

    if (!vote) {
      throw new NotFoundException('Vote participants not found');
    }

    return {
      slug: vote.slug,
      title: vote.title,
      participants: vote.submissions.map((submission) => ({
        submissionId: submission.id,
        secretUserId: submission.user.assessment?.secretUserId ?? null,
        selectedOptionId: submission.selectedOptionId,
        selectedOptionText: submission.selectedOption.optionText,
        weightUsed: submission.weightUsed,
        calculationType: submission.calculationType,
        selfAssessmentScore: submission.selfAssessmentScore,
        submittedAt: submission.submittedAt,
        hasCompletedAssessment:
          submission.user.assessment?.assessmentCompleted ?? false,
      })),
    };
  }

  async exportAdminAnalyticsExcel(slug: string) {
    const normalizedSlug = slug.trim().toLowerCase();

    const vote = await this.prisma.vote.findUnique({
      where: { slug: normalizedSlug },
      select: {
        id: true,
        slug: true,
        title: true,
        voteType: true,
        topicCategory: true,
        status: true,
        startAt: true,
        endAt: true,
        isPublished: true,
        publishedAt: true,
        options: {
          select: {
            id: true,
            optionText: true,
            displayOrder: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        submissions: {
          orderBy: {
            submittedAt: 'asc',
          },
          select: {
            id: true,
            selectedOptionId: true,
            weightUsed: true,
            calculationType: true,
            selfAssessmentScore: true,
            submittedAt: true,
            selectedOption: {
              select: {
                optionText: true,
              },
            },
            user: {
              select: {
                assessment: {
                  select: {
                    secretUserId: true,
                    ageRange: true,
                    gender: true,
                    stakeholderRole: true,
                    backgroundCategory: true,
                    experienceLevel: true,
                    relationshipToArea: true,
                    city: true,
                    region: true,
                    country: true,
                    assessmentCompleted: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    const totalRawVotes = vote.submissions.length;
    const totalWeightedVotes = Number(
      vote.submissions
        .reduce((sum, submission) => sum + Number(submission.weightUsed), 0)
        .toFixed(4),
    );

    const optionResults = vote.options.map((option) => {
      const optionSubmissions = vote.submissions.filter(
        (submission) => submission.selectedOptionId === option.id,
      );

      const rawCount = optionSubmissions.length;
      const weightedCount = Number(
        optionSubmissions
          .reduce((sum, submission) => sum + Number(submission.weightUsed), 0)
          .toFixed(4),
      );

      const rawPercentage =
        totalRawVotes > 0
          ? Number(((rawCount / totalRawVotes) * 100).toFixed(2))
          : 0;

      const weightedPercentage =
        totalWeightedVotes > 0
          ? Number(((weightedCount / totalWeightedVotes) * 100).toFixed(2))
          : 0;

      return {
        displayOrder: option.displayOrder,
        optionText: option.optionText,
        rawCount,
        rawPercentage,
        weightedCount,
        weightedPercentage,
      };
    });

    const stakeholderBreakdown = buildBreakdown(
      vote.submissions.map(
        (submission) => submission.user.assessment?.stakeholderRole,
      ),
    );

    const backgroundBreakdown = buildBreakdown(
      vote.submissions.map(
        (submission) => submission.user.assessment?.backgroundCategory,
      ),
    );

    const locationBreakdown = buildBreakdown(
      vote.submissions.map(
        (submission) =>
          submission.user.assessment?.city ||
          submission.user.assessment?.region ||
          submission.user.assessment?.country,
      ),
    );

    const ageRangeBreakdown = buildBreakdown(
      vote.submissions.map(
        (submission) => submission.user.assessment?.ageRange,
      ),
    );

    const genderBreakdown = buildBreakdown(
      vote.submissions.map((submission) => submission.user.assessment?.gender),
    );

    const experienceLevelBreakdown = buildBreakdown(
      vote.submissions.map(
        (submission) => submission.user.assessment?.experienceLevel,
      ),
    );

    const relationshipToAreaBreakdown = buildBreakdown(
      vote.submissions.map(
        (submission) => submission.user.assessment?.relationshipToArea,
      ),
    );

    const formattedStakeholderBreakdown =
      this.formatBreakdownRowsForExport(stakeholderBreakdown);
    const formattedBackgroundBreakdown =
      this.formatBreakdownRowsForExport(backgroundBreakdown);
    const formattedLocationBreakdown =
      this.formatBreakdownRowsForExport(locationBreakdown);
    const formattedAgeRangeBreakdown =
      this.formatBreakdownRowsForExport(ageRangeBreakdown);
    const formattedGenderBreakdown =
      this.formatBreakdownRowsForExport(genderBreakdown);
    const formattedExperienceLevelBreakdown = this.formatBreakdownRowsForExport(
      experienceLevelBreakdown,
    );
    const formattedRelationshipToAreaBreakdown =
      this.formatBreakdownRowsForExport(relationshipToAreaBreakdown);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'OpenAI';
    workbook.created = new Date();
    workbook.modified = new Date();

    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Field', key: 'field', width: 28 },
      { header: 'Value', key: 'value', width: 48 },
    ];
    summarySheet.addRows([
      { field: 'Title', value: vote.title },
      { field: 'Slug', value: vote.slug },
      { field: 'Vote Type', value: formatStoredValueLabel(vote.voteType) },
      { field: 'Topic Category', value: vote.topicCategory },
      { field: 'Status', value: formatStoredValueLabel(vote.status) },
      { field: 'Is Published', value: vote.isPublished ? 'Yes' : 'No' },
      {
        field: 'Published At',
        value: vote.publishedAt ? vote.publishedAt.toISOString() : '',
      },
      { field: 'Start At', value: vote.startAt.toISOString() },
      { field: 'End At', value: vote.endAt.toISOString() },
      { field: 'Total Raw Votes', value: totalRawVotes },
      { field: 'Total Weighted Votes', value: totalWeightedVotes },
    ]);

    const resultsSheet = workbook.addWorksheet('Results');
    resultsSheet.columns = [
      { header: 'Display Order', key: 'displayOrder', width: 16 },
      { header: 'Option', key: 'optionText', width: 44 },
      { header: 'Raw Count', key: 'rawCount', width: 14 },
      { header: 'Raw Percentage', key: 'rawPercentage', width: 16 },
      { header: 'Weighted Count', key: 'weightedCount', width: 16 },
      { header: 'Weighted Percentage', key: 'weightedPercentage', width: 20 },
    ];
    resultsSheet.addRows(optionResults);

    const stakeholderSheet = workbook.addWorksheet('Stakeholder Breakdown');
    stakeholderSheet.columns = [
      { header: 'Label', key: 'label', width: 36 },
      { header: 'Count', key: 'count', width: 12 },
      { header: 'Percentage', key: 'percentage', width: 14 },
    ];
    stakeholderSheet.addRows(formattedStakeholderBreakdown);

    const backgroundSheet = workbook.addWorksheet('Background Breakdown');
    backgroundSheet.columns = [
      { header: 'Label', key: 'label', width: 36 },
      { header: 'Count', key: 'count', width: 12 },
      { header: 'Percentage', key: 'percentage', width: 14 },
    ];
    backgroundSheet.addRows(formattedBackgroundBreakdown);

    const locationSheet = workbook.addWorksheet('Location Breakdown');
    locationSheet.columns = [
      { header: 'Label', key: 'label', width: 36 },
      { header: 'Count', key: 'count', width: 12 },
      { header: 'Percentage', key: 'percentage', width: 14 },
    ];
    locationSheet.addRows(formattedLocationBreakdown);

    const ageRangeSheet = workbook.addWorksheet('Age Range Breakdown');
    ageRangeSheet.columns = [
      { header: 'Label', key: 'label', width: 36 },
      { header: 'Count', key: 'count', width: 12 },
      { header: 'Percentage', key: 'percentage', width: 14 },
    ];
    ageRangeSheet.addRows(formattedAgeRangeBreakdown);

    const genderSheet = workbook.addWorksheet('Gender Breakdown');
    genderSheet.columns = [
      { header: 'Label', key: 'label', width: 36 },
      { header: 'Count', key: 'count', width: 12 },
      { header: 'Percentage', key: 'percentage', width: 14 },
    ];
    genderSheet.addRows(formattedGenderBreakdown);

    const experienceLevelSheet = workbook.addWorksheet(
      'Experience Level Breakdown',
    );
    experienceLevelSheet.columns = [
      { header: 'Label', key: 'label', width: 36 },
      { header: 'Count', key: 'count', width: 12 },
      { header: 'Percentage', key: 'percentage', width: 14 },
    ];
    experienceLevelSheet.addRows(formattedExperienceLevelBreakdown);

    const relationshipToAreaSheet = workbook.addWorksheet(
      'Relationship To Area Breakdown',
    );
    relationshipToAreaSheet.columns = [
      { header: 'Label', key: 'label', width: 36 },
      { header: 'Count', key: 'count', width: 12 },
      { header: 'Percentage', key: 'percentage', width: 14 },
    ];
    relationshipToAreaSheet.addRows(formattedRelationshipToAreaBreakdown);

    const participantsSheet = workbook.addWorksheet('Participants');
    participantsSheet.columns = [
      { header: 'Submission ID', key: 'submissionId', width: 28 },
      { header: 'Secret User ID', key: 'secretUserId', width: 24 },
      { header: 'Selected Option', key: 'selectedOptionText', width: 36 },
      { header: 'Weight Used', key: 'weightUsed', width: 14 },
      { header: 'Calculation Type', key: 'calculationType', width: 18 },
      {
        header: 'Self Assessment Score',
        key: 'selfAssessmentScore',
        width: 22,
      },
      { header: 'Submitted At', key: 'submittedAt', width: 24 },
      { header: 'Assessment Completed', key: 'assessmentCompleted', width: 20 },
      { header: 'Age Range', key: 'ageRange', width: 18 },
      { header: 'Gender', key: 'gender', width: 18 },
      { header: 'Stakeholder Role', key: 'stakeholderRole', width: 22 },
      { header: 'Background Category', key: 'backgroundCategory', width: 22 },
      { header: 'Experience Level', key: 'experienceLevel', width: 20 },
      { header: 'Relationship To Area', key: 'relationshipToArea', width: 22 },
      { header: 'City', key: 'city', width: 18 },
      { header: 'Region', key: 'region', width: 18 },
      { header: 'Country', key: 'country', width: 18 },
    ];
    participantsSheet.addRows(
      vote.submissions.map((submission) => ({
        submissionId: submission.id,
        secretUserId: submission.user.assessment?.secretUserId ?? '',
        selectedOptionText: submission.selectedOption.optionText,
        weightUsed: Number(submission.weightUsed),
        calculationType: formatStoredValueLabel(submission.calculationType),
        selfAssessmentScore: submission.selfAssessmentScore ?? '',
        submittedAt: submission.submittedAt.toISOString(),
        assessmentCompleted: submission.user.assessment?.assessmentCompleted
          ? 'Yes'
          : 'No',
        ageRange: formatStoredValueLabel(submission.user.assessment?.ageRange),
        gender: formatStoredValueLabel(submission.user.assessment?.gender),
        stakeholderRole: formatStoredValueLabel(
          submission.user.assessment?.stakeholderRole,
        ),
        backgroundCategory: formatStoredValueLabel(
          submission.user.assessment?.backgroundCategory,
        ),
        experienceLevel: formatStoredValueLabel(
          submission.user.assessment?.experienceLevel,
        ),
        relationshipToArea: formatStoredValueLabel(
          submission.user.assessment?.relationshipToArea,
        ),
        city: formatStoredValueLabel(submission.user.assessment?.city),
        region: formatStoredValueLabel(submission.user.assessment?.region),
        country: formatStoredValueLabel(submission.user.assessment?.country),
      })),
    );

    this.styleWorksheet(summarySheet);
    this.styleWorksheet(resultsSheet);
    this.styleWorksheet(stakeholderSheet);
    this.styleWorksheet(backgroundSheet);
    this.styleWorksheet(locationSheet);
    this.styleWorksheet(ageRangeSheet);
    this.styleWorksheet(genderSheet);
    this.styleWorksheet(experienceLevelSheet);
    this.styleWorksheet(relationshipToAreaSheet);
    this.styleWorksheet(participantsSheet);

    const fileName = `${vote.slug}-analytics.xlsx`;
    const fileBuffer = await workbook.xlsx.writeBuffer();

    return {
      fileName,
      buffer: Buffer.from(fileBuffer),
    };
  }

  private formatBreakdownRowsForExport(
    items: Array<{ label: string; count: number; percentage: number }>,
  ) {
    return items.map((item) => ({
      ...item,
      label: formatStoredValueLabel(item.label),
    }));
  }

  private styleWorksheet(worksheet: ExcelJS.Worksheet) {
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle' };

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: 'top', wrapText: true };
      }
    });
  }

  private fullVoteSelect() {
    return {
      id: true,
      slug: true,
      title: true,
      summary: true,
      methodologySummary: true,
      voteType: true,
      topicCategory: true,
      status: true,
      coverImageUrl: true,
      coverImageAlt: true,
      startAt: true,
      endAt: true,
      isPublished: true,
      publishedAt: true,
      lockedAt: true,
      createdByAdminId: true,
      createdAt: true,
      updatedAt: true,
      options: {
        select: {
          id: true,
          optionText: true,
          displayOrder: true,
          createdAt: true,
        },
        orderBy: {
          displayOrder: 'asc' as const,
        },
      },
      displaySettings: {
        select: {
          id: true,
          resultVisibilityMode: true,
          showParticipationStats: true,
          showStakeholderBreakdown: true,
          showBackgroundBreakdown: true,
          showLocationBreakdown: true,
          showAgeRangeBreakdown: true,
          showGenderBreakdown: true,
          showExperienceLevelBreakdown: true,
          showRelationshipBreakdown: true,
          showAfterVotingOnly: true,
          showOnlyAfterVoteCloses: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    };
  }

  private normalizeVoteDisplaySettings<
    T extends {
      displaySettings: {
        showAfterVotingOnly: boolean;
        showOnlyAfterVoteCloses: boolean;
      } | null;
    },
  >(vote: T): T {
    if (!vote.displaySettings) {
      return vote;
    }

    return {
      ...vote,
      displaySettings: normalizeVisibilityTimingSettings(vote.displaySettings),
    };
  }

  private getDerivedStatus(
    startAt: Date,
    endAt: Date,
    persistedStatus: string,
    now: Date,
  ): 'UPCOMING' | 'ONGOING' | 'PAST' | 'CANCELLED' | 'ARCHIVED' {
    if (persistedStatus === 'CANCELLED') {
      return 'CANCELLED';
    }

    if (persistedStatus === 'ARCHIVED') {
      return 'ARCHIVED';
    }

    if (now < startAt) {
      return 'UPCOMING';
    }

    if (now > endAt) {
      return 'PAST';
    }

    return 'ONGOING';
  }
}
