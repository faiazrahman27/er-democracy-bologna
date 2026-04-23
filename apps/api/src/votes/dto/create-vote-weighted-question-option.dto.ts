import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateVoteWeightedQuestionOptionDto {
  @IsDefined({ message: 'optionText is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  optionText!: string;

  @IsDefined({ message: 'modifier is required' })
  @Transform(({ value }: { value: unknown }) => {
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

  @IsDefined({ message: 'displayOrder is required' })
  @IsInt()
  @Min(1)
  displayOrder!: number;
}
