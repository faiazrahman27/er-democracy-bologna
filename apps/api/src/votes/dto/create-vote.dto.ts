import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVoteOptionDto } from './create-vote-option.dto';
import { CreateVoteDisplaySettingsDto } from './create-vote-display-settings.dto';

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

export class CreateVoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  slug!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  summary!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  methodologySummary?: string;

  @IsEnum(VoteTypeDto)
  voteType!: VoteTypeDto;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  topicCategory!: string;

  @IsEnum(VoteStatusDto)
  status!: VoteStatusDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  coverImageAlt?: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsBoolean()
  isPublished!: boolean;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateVoteOptionDto)
  options!: CreateVoteOptionDto[];

  @ValidateNested()
  @Type(() => CreateVoteDisplaySettingsDto)
  displaySettings!: CreateVoteDisplaySettingsDto;
}
