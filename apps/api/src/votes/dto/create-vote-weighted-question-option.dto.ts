import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateVoteWeightedQuestionOptionDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  optionText!: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmedValue = value.trim();

      return trimmedValue === '' ? trimmedValue : Number(trimmedValue);
    }

    return value;
  })
  @IsNumber(
    {
      allowInfinity: false,
      allowNaN: false,
      maxDecimalPlaces: 4,
    },
    {
      message: 'modifier must be a valid decimal number with up to 4 places',
    },
  )
  modifier!: number;

  @IsInt()
  @Min(1)
  displayOrder!: number;
}
