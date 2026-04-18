import {
  evaluateAnalyticsVisibility,
  evaluateResultVisibility,
  normalizeVisibilityTimingSettings,
} from './result-visibility.util';

describe('result visibility utilities', () => {
  const activeVoteWindow = {
    now: new Date('2026-04-18T12:00:00.000Z'),
    endAt: new Date('2026-04-19T12:00:00.000Z'),
  };

  it('normalizes conflicting timing settings to close-only mode', () => {
    expect(
      normalizeVisibilityTimingSettings({
        showAfterVotingOnly: true,
        showOnlyAfterVoteCloses: true,
      }),
    ).toEqual({
      showAfterVotingOnly: false,
      showOnlyAfterVoteCloses: true,
    });
  });

  it('keeps public results hidden until close when close-only mode is selected', () => {
    expect(
      evaluateResultVisibility({
        resultVisibilityMode: 'SHOW_BOTH',
        showAfterVotingOnly: true,
        showOnlyAfterVoteCloses: true,
        userHasVoted: true,
        ...activeVoteWindow,
      }),
    ).toEqual({
      canShowResults: false,
      showRawResults: false,
      showWeightedResults: false,
    });
  });

  it('shows admin-enabled results after the consultation closes', () => {
    expect(
      evaluateResultVisibility({
        resultVisibilityMode: 'SHOW_BOTH',
        showAfterVotingOnly: true,
        showOnlyAfterVoteCloses: true,
        userHasVoted: false,
        now: new Date('2026-04-20T12:00:00.000Z'),
        endAt: activeVoteWindow.endAt,
      }),
    ).toEqual({
      canShowResults: true,
      showRawResults: true,
      showWeightedResults: true,
    });
  });

  it('does not expose analytics when no public analytics sections are enabled', () => {
    expect(
      evaluateAnalyticsVisibility({
        hasAnyPublicAnalyticsEnabled: false,
        showAfterVotingOnly: true,
        showOnlyAfterVoteCloses: false,
        userHasVoted: false,
        ...activeVoteWindow,
      }),
    ).toEqual({
      canShowAnalytics: false,
    });
  });
});
