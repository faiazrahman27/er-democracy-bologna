import { IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';

export enum ResultVisibilityModeDto {
  HIDE_ALL = 'HIDE_ALL',
  SHOW_RAW_ONLY = 'SHOW_RAW_ONLY',
  SHOW_WEIGHTED_ONLY = 'SHOW_WEIGHTED_ONLY',
  SHOW_BOTH = 'SHOW_BOTH',
}

export class CreateVoteDisplaySettingsDto {
  @IsEnum(ResultVisibilityModeDto)
  @IsNotEmpty()
  resultVisibilityMode!: ResultVisibilityModeDto;

  @IsBoolean()
  showParticipationStats!: boolean;

  @IsBoolean()
  showStakeholderBreakdown!: boolean;

  @IsBoolean()
  showBackgroundBreakdown!: boolean;

  @IsBoolean()
  showLocationBreakdown!: boolean;

  @IsBoolean()
  showAfterVotingOnly!: boolean;

  @IsBoolean()
  showOnlyAfterVoteCloses!: boolean;
}
