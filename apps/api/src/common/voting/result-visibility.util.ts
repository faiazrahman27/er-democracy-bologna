type ResultVisibilityMode =
  | 'HIDE_ALL'
  | 'SHOW_RAW_ONLY'
  | 'SHOW_WEIGHTED_ONLY'
  | 'SHOW_BOTH';

type VisibilityInput = {
  resultVisibilityMode: ResultVisibilityMode;
  showAfterVotingOnly: boolean;
  showOnlyAfterVoteCloses: boolean;
  userHasVoted: boolean;
  now: Date;
  endAt: Date;
};

type VisibilityOutput = {
  canShowResults: boolean;
  showRawResults: boolean;
  showWeightedResults: boolean;
};

type AnalyticsVisibilityInput = {
  hasAnyPublicAnalyticsEnabled: boolean;
  showAfterVotingOnly: boolean;
  showOnlyAfterVoteCloses: boolean;
  userHasVoted: boolean;
  now: Date;
  endAt: Date;
};

type AnalyticsVisibilityOutput = {
  canShowAnalytics: boolean;
};

type TimingVisibilitySettings = {
  showAfterVotingOnly: boolean;
  showOnlyAfterVoteCloses: boolean;
};

export function normalizeVisibilityTimingSettings<
  T extends TimingVisibilitySettings,
>(settings: T): T {
  if (!settings.showOnlyAfterVoteCloses || !settings.showAfterVotingOnly) {
    return settings;
  }

  return {
    ...settings,
    showAfterVotingOnly: false,
  };
}

export function evaluateResultVisibility(
  input: VisibilityInput,
): VisibilityOutput {
  const normalizedInput = normalizeVisibilityTimingSettings(input);

  if (normalizedInput.resultVisibilityMode === 'HIDE_ALL') {
    return {
      canShowResults: false,
      showRawResults: false,
      showWeightedResults: false,
    };
  }

  if (
    normalizedInput.showOnlyAfterVoteCloses &&
    normalizedInput.now <= normalizedInput.endAt
  ) {
    return {
      canShowResults: false,
      showRawResults: false,
      showWeightedResults: false,
    };
  }

  if (normalizedInput.showAfterVotingOnly && !normalizedInput.userHasVoted) {
    return {
      canShowResults: false,
      showRawResults: false,
      showWeightedResults: false,
    };
  }

  return {
    canShowResults: true,
    showRawResults:
      normalizedInput.resultVisibilityMode === 'SHOW_RAW_ONLY' ||
      normalizedInput.resultVisibilityMode === 'SHOW_BOTH',
    showWeightedResults:
      normalizedInput.resultVisibilityMode === 'SHOW_WEIGHTED_ONLY' ||
      normalizedInput.resultVisibilityMode === 'SHOW_BOTH',
  };
}

export function evaluateAnalyticsVisibility(
  input: AnalyticsVisibilityInput,
): AnalyticsVisibilityOutput {
  const normalizedInput = normalizeVisibilityTimingSettings(input);

  if (!normalizedInput.hasAnyPublicAnalyticsEnabled) {
    return {
      canShowAnalytics: false,
    };
  }

  if (
    normalizedInput.showOnlyAfterVoteCloses &&
    normalizedInput.now <= normalizedInput.endAt
  ) {
    return {
      canShowAnalytics: false,
    };
  }

  if (normalizedInput.showAfterVotingOnly && !normalizedInput.userHasVoted) {
    return {
      canShowAnalytics: false,
    };
  }

  return {
    canShowAnalytics: true,
  };
}
