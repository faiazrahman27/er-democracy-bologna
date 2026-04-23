import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubmitVoteWeightedAnswerDto } from './submit-vote-weighted-answer.dto';

export class SubmitVoteDto {
  @IsString()
  @IsNotEmpty()
  selectedOptionId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  selfAssessmentScore?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitVoteWeightedAnswerDto)
  weightedQuestionAnswers?: SubmitVoteWeightedAnswerDto[];
}
