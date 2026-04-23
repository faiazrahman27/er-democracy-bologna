import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateVoteWeightedQuestionOptionDto } from './create-vote-weighted-question-option.dto';

export class CreateVoteWeightedQuestionDto {
  @IsDefined({ message: 'prompt is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  prompt!: string;

  @IsDefined({ message: 'displayOrder is required' })
  @IsInt()
  @Min(1)
  displayOrder!: number;

  @IsDefined({ message: 'answerOptions is required' })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateVoteWeightedQuestionOptionDto)
  answerOptions!: CreateVoteWeightedQuestionOptionDto[];
}
