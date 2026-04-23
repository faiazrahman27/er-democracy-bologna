import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreateVoteOptionDto } from './create-vote-option.dto';
import { CreateVoteDisplaySettingsDto } from './create-vote-display-settings.dto';
import { CreateVoteWeightedQuestionDto } from './create-vote-weighted-question.dto';

export enum VoteTypeDto {
  GENERAL = 'GENERAL',
  SPECIALIZED = 'SPECIALIZED',
  SELF_ASSESSMENT = 'SELF_ASSESSMENT',
}

export enum VoteStatusDto {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
  CANCELLED = 'CANCELLED',
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HTTP_URL_VALIDATION_OPTIONS = {
  protocols: ['http', 'https'],
  require_protocol: true,
  require_tld: false,
};

export class CreateVoteDto {
  @IsDefined({ message: 'slug is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  @Matches(SLUG_PATTERN, {
    message:
      'slug must contain only lowercase letters, numbers, and single hyphens',
  })
  slug!: string;

  @IsDefined({ message: 'title is required' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsDefined({ message: 'summary is required' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  summary!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  methodologySummary?: string;

  @IsDefined({ message: 'voteType is required' })
  @IsEnum(VoteTypeDto)
  voteType!: VoteTypeDto;

  @IsDefined({ message: 'topicCategory is required' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  topicCategory!: string;

  @IsDefined({ message: 'status is required' })
  @IsEnum(VoteStatusDto)
  status!: VoteStatusDto;

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

  @IsDefined({ message: 'startAt is required' })
  @IsDateString()
  startAt!: string;

  @IsDefined({ message: 'endAt is required' })
  @IsDateString()
  endAt!: string;

  @IsDefined({ message: 'isPublished is required' })
  @IsBoolean()
  isPublished!: boolean;

  @IsDefined({ message: 'options is required' })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateVoteOptionDto)
  options!: CreateVoteOptionDto[];

  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVoteWeightedQuestionDto)
  weightedQuestions?: CreateVoteWeightedQuestionDto[];

  @IsDefined({ message: 'displaySettings is required' })
  @ValidateNested()
  @Type(() => CreateVoteDisplaySettingsDto)
  displaySettings!: CreateVoteDisplaySettingsDto;
}
