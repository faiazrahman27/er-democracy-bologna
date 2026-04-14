import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateVoteOptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  optionText!: string;

  @IsInt()
  @Min(1)
  displayOrder!: number;
}
