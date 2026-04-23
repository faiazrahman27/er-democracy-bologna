import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitVoteWeightedAnswerDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  optionId!: string;
}
