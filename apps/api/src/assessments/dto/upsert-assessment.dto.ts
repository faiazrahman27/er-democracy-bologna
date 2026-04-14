import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpsertAssessmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  ageRange?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  stakeholderRole?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  backgroundCategory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  experienceLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  relationshipToArea?: string;

  @IsBoolean()
  @IsNotEmpty()
  assessmentCompleted!: boolean;
}
