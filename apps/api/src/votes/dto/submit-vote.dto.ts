import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SubmitVoteDto {
  @IsString()
  @IsNotEmpty()
  selectedOptionId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  selfAssessmentScore?: number;
}
