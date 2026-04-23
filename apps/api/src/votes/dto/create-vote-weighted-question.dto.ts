import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateVoteWeightedQuestionOptionDto } from './create-vote-weighted-question-option.dto';

export class CreateVoteWeightedQuestionDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  prompt!: string;

  @IsInt()
  @Min(1)
  displayOrder!: number;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateVoteWeightedQuestionOptionDto)
  answerOptions!: CreateVoteWeightedQuestionOptionDto[];
}
