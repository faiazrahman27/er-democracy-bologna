import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { VoteStatusDto } from './create-vote.dto';
import { ResultVisibilityModeDto } from './create-vote-display-settings.dto';
import { CreateVoteWeightedQuestionDto } from './create-vote-weighted-question.dto';

const HTTP_URL_VALIDATION_OPTIONS = {
  protocols: ['http', 'https'],
  require_protocol: true,
  require_tld: false,
};

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
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(500)
  @IsUrl(HTTP_URL_VALIDATION_OPTIONS, {
    message: 'coverImageUrl must be a valid http or https URL',
  })
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

  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVoteWeightedQuestionDto)
  weightedQuestions?: CreateVoteWeightedQuestionDto[];
}
