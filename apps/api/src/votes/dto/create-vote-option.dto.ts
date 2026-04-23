import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVoteOptionDto {
  @IsDefined({ message: 'optionText is required' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  optionText!: string;

  @IsDefined({ message: 'displayOrder is required' })
  @IsInt()
  @Min(1)
  displayOrder!: number;
}
