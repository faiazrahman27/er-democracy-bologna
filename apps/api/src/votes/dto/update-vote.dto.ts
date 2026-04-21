import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { VoteStatusDto } from './create-vote.dto';
import { ResultVisibilityModeDto } from './create-vote-display-settings.dto';

export class UpdateVoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  methodologySummary?: string;

  @IsOptional()
  @IsEnum(VoteStatusDto)
  status?: VoteStatusDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  coverImageAlt?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsEnum(ResultVisibilityModeDto)
  resultVisibilityMode?: ResultVisibilityModeDto;

  @IsOptional()
  @IsBoolean()
  showParticipationStats?: boolean;

  @IsOptional()
  @IsBoolean()
  showStakeholderBreakdown?: boolean;

  @IsOptional()
  @IsBoolean()
  showBackgroundBreakdown?: boolean;

  @IsOptional()
  @IsBoolean()
  showLocationBreakdown?: boolean;

  @IsOptional()
  @IsBoolean()
  showAgeRangeBreakdown?: boolean;

  @IsOptional()
  @IsBoolean()
  showGenderBreakdown?: boolean;

  @IsOptional()
  @IsBoolean()
  showExperienceLevelBreakdown?: boolean;

  @IsOptional()
  @IsBoolean()
  showYearsOfExperienceBreakdown?: boolean;

  @IsOptional()
  @IsBoolean()
  showStudyLevelBreakdown?: boolean;

  @IsOptional()
  @IsBoolean()
  showRelationshipBreakdown?: boolean;

  @IsOptional()
  @IsBoolean()
  showAfterVotingOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  showOnlyAfterVoteCloses?: boolean;
}
