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

export function evaluateResultVisibility(
  input: VisibilityInput,
): VisibilityOutput {
  if (input.resultVisibilityMode === 'HIDE_ALL') {
    return {
      canShowResults: false,
      showRawResults: false,
      showWeightedResults: false,
    };
  }

  if (input.showOnlyAfterVoteCloses && input.now <= input.endAt) {
    return {
      canShowResults: false,
      showRawResults: false,
      showWeightedResults: false,
    };
  }

  if (input.showAfterVotingOnly && !input.userHasVoted) {
    return {
      canShowResults: false,
      showRawResults: false,
      showWeightedResults: false,
    };
  }

  return {
    canShowResults: true,
    showRawResults:
      input.resultVisibilityMode === 'SHOW_RAW_ONLY' ||
      input.resultVisibilityMode === 'SHOW_BOTH',
    showWeightedResults:
      input.resultVisibilityMode === 'SHOW_WEIGHTED_ONLY' ||
      input.resultVisibilityMode === 'SHOW_BOTH',
  };
}

export function evaluateAnalyticsVisibility(
  input: AnalyticsVisibilityInput,
): AnalyticsVisibilityOutput {
  if (!input.hasAnyPublicAnalyticsEnabled) {
    return {
      canShowAnalytics: false,
    };
  }

  if (input.showOnlyAfterVoteCloses && input.now <= input.endAt) {
    return {
      canShowAnalytics: false,
    };
  }

  if (input.showAfterVotingOnly && !input.userHasVoted) {
    return {
      canShowAnalytics: false,
    };
  }

  return {
    canShowAnalytics: true,
  };
}
