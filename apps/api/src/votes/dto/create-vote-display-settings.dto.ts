import { IsBoolean, IsDefined, IsEnum, IsNotEmpty } from 'class-validator';

export enum ResultVisibilityModeDto {
  HIDE_ALL = 'HIDE_ALL',
  SHOW_RAW_ONLY = 'SHOW_RAW_ONLY',
  SHOW_WEIGHTED_ONLY = 'SHOW_WEIGHTED_ONLY',
  SHOW_BOTH = 'SHOW_BOTH',
}

export class CreateVoteDisplaySettingsDto {
  @IsDefined({ message: 'resultVisibilityMode is required' })
  @IsEnum(ResultVisibilityModeDto)
  @IsNotEmpty()
  resultVisibilityMode!: ResultVisibilityModeDto;

  @IsDefined({ message: 'showParticipationStats is required' })
  @IsBoolean()
  showParticipationStats!: boolean;

  @IsDefined({ message: 'showStakeholderBreakdown is required' })
  @IsBoolean()
  showStakeholderBreakdown!: boolean;

  @IsDefined({ message: 'showBackgroundBreakdown is required' })
  @IsBoolean()
  showBackgroundBreakdown!: boolean;

  @IsDefined({ message: 'showLocationBreakdown is required' })
  @IsBoolean()
  showLocationBreakdown!: boolean;

  @IsDefined({ message: 'showAgeRangeBreakdown is required' })
  @IsBoolean()
  showAgeRangeBreakdown!: boolean;

  @IsDefined({ message: 'showGenderBreakdown is required' })
  @IsBoolean()
  showGenderBreakdown!: boolean;

  @IsDefined({ message: 'showExperienceLevelBreakdown is required' })
  @IsBoolean()
  showExperienceLevelBreakdown!: boolean;

  @IsDefined({ message: 'showYearsOfExperienceBreakdown is required' })
  @IsBoolean()
  showYearsOfExperienceBreakdown!: boolean;

  @IsDefined({ message: 'showStudyLevelBreakdown is required' })
  @IsBoolean()
  showStudyLevelBreakdown!: boolean;

  @IsDefined({ message: 'showRelationshipBreakdown is required' })
  @IsBoolean()
  showRelationshipBreakdown!: boolean;

  @IsDefined({ message: 'showAfterVotingOnly is required' })
  @IsBoolean()
  showAfterVotingOnly!: boolean;

  @IsDefined({ message: 'showOnlyAfterVoteCloses is required' })
  @IsBoolean()
  showOnlyAfterVoteCloses!: boolean;
}
