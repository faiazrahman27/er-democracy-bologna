'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '@/providers/auth-provider';
import {
  fetchVisibleAnalytics,
  fetchVisibleResults,
  submitVote,
} from '@/lib/votes';
import { formatEnumLabel } from '@/lib/format';
import type { PublicVoteDetail } from '@/types/vote';
import type { AnalyticsBreakdownItem } from '@/types/analytics';

type Props = {
  vote: PublicVoteDetail;
};

const PIE_CHART_COLORS = [
  '#16a34a',
  '#2563eb',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#0ea5e9',
  '#14b8a6',
  '#f97316',
  '#84cc16',
  '#ec4899',
  '#06b6d4',
  '#a855f7',
];

const RAW_OPTION_COLORS = [
  '#2563eb',
  '#0ea5e9',
  '#7c3aed',
  '#8b5cf6',
  '#1d4ed8',
  '#0891b2',
  '#6366f1',
  '#4f46e5',
  '#3b82f6',
  '#0284c7',
  '#4338ca',
  '#6d28d9',
];

const WEIGHTED_OPTION_COLORS = [
  '#16a34a',
  '#84cc16',
  '#f59e0b',
  '#f97316',
  '#22c55e',
  '#65a30d',
  '#d97706',
  '#ea580c',
  '#15803d',
  '#4d7c0f',
  '#ca8a04',
  '#c2410c',
];

export function ConsultationInteractions({ vote }: Props) {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [selfAssessmentScore, setSelfAssessmentScore] = useState<number>(5);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [resultsState, setResultsState] = useState<{
    isLoading: boolean;
    error: string | null;
    data: Awaited<ReturnType<typeof fetchVisibleResults>> | null;
  }>({
    isLoading: true,
    error: null,
    data: null,
  });

  const [analyticsState, setAnalyticsState] = useState<{
    isLoading: boolean;
    error: string | null;
    data: Awaited<ReturnType<typeof fetchVisibleAnalytics>> | null;
  }>({
    isLoading: true,
    error: null,
    data: null,
  });

  const requiresAssessment = vote.voteType === 'SPECIALIZED';
  const requiresSelfAssessmentScore = vote.voteType === 'SELF_ASSESSMENT';
  const canAttemptVote = vote.derivedStatus === 'ONGOING';

  const sortedOptions = useMemo(
    () => [...vote.options].sort((a, b) => a.displayOrder - b.displayOrder),
    [vote.options],
  );

  const resultOptions = useMemo(() => {
    return resultsState.data?.results?.results?.options ?? [];
  }, [resultsState.data]);

  const resultsChartData = useMemo(() => {
    return resultOptions.map((option, index) => ({
      name: `Option ${option.displayOrder}`,
      fullName: option.optionText,
      rawVotes: option.rawCount ?? 0,
      weightedVotes: option.weightedCount ?? 0,
      rawPercentage: option.rawPercentage ?? 0,
      weightedPercentage: option.weightedPercentage ?? 0,
      rawColor: RAW_OPTION_COLORS[index % RAW_OPTION_COLORS.length],
      weightedColor:
        WEIGHTED_OPTION_COLORS[index % WEIGHTED_OPTION_COLORS.length],
    }));
  }, [resultOptions]);

  const rawPieData = useMemo(() => {
    return resultOptions
      .filter((option) => typeof option.rawCount !== 'undefined')
      .map((option, index) => ({
        label: `Option ${option.displayOrder}`,
        fullLabel: option.optionText,
        count: option.rawCount ?? 0,
        percentage: option.rawPercentage ?? 0,
        color: RAW_OPTION_COLORS[index % RAW_OPTION_COLORS.length],
      }));
  }, [resultOptions]);

  const weightedPieData = useMemo(() => {
    return resultOptions
      .filter((option) => typeof option.weightedCount !== 'undefined')
      .map((option, index) => ({
        label: `Option ${option.displayOrder}`,
        fullLabel: option.optionText,
        count: option.weightedCount ?? 0,
        percentage: option.weightedPercentage ?? 0,
        color: WEIGHTED_OPTION_COLORS[index % WEIGHTED_OPTION_COLORS.length],
      }));
  }, [resultOptions]);

  const stakeholderChartData = useMemo(() => {
    return formatBreakdownItems(
      analyticsState.data?.analytics?.analytics?.stakeholderBreakdown,
    );
  }, [analyticsState.data]);

  const backgroundChartData = useMemo(() => {
    return formatBreakdownItems(
      analyticsState.data?.analytics?.analytics?.backgroundBreakdown,
    );
  }, [analyticsState.data]);

  const locationChartData = useMemo(() => {
    return formatBreakdownItems(
      analyticsState.data?.analytics?.analytics?.locationBreakdown,
    );
  }, [analyticsState.data]);

  const ageRangeChartData = useMemo(() => {
    return formatBreakdownItems(
      analyticsState.data?.analytics?.analytics?.ageRangeBreakdown,
    );
  }, [analyticsState.data]);

  const genderChartData = useMemo(() => {
    return formatBreakdownItems(
      analyticsState.data?.analytics?.analytics?.genderBreakdown,
    );
  }, [analyticsState.data]);

  const experienceLevelChartData = useMemo(() => {
    return formatBreakdownItems(
      analyticsState.data?.analytics?.analytics?.experienceLevelBreakdown,
    );
  }, [analyticsState.data]);

  const relationshipToAreaChartData = useMemo(() => {
    return formatBreakdownItems(
      analyticsState.data?.analytics?.analytics?.relationshipToAreaBreakdown,
    );
  }, [analyticsState.data]);

  useEffect(() => {
    async function loadPanels() {
      try {
        const [results, analytics] = await Promise.all([
          fetchVisibleResults(vote.slug, token),
          fetchVisibleAnalytics(vote.slug, token),
        ]);

        setResultsState({
          isLoading: false,
          error: null,
          data: results,
        });

        setAnalyticsState({
          isLoading: false,
          error: null,
          data: analytics,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load consultation data';

        setResultsState({
          isLoading: false,
          error: message,
          data: null,
        });

        setAnalyticsState({
          isLoading: false,
          error: message,
          data: null,
        });
      }
    }

    void loadPanels();
  }, [vote.slug, token]);

  async function handleSubmitVote() {
    if (!token) {
      router.push(`/login?redirectTo=/consultations/${vote.slug}`);
      return;
    }

    if (!selectedOptionId) {
      setSubmissionError('Please select an option before submitting.');
      return;
    }

    setSubmissionError(null);
    setSubmissionMessage(null);
    setIsSubmitting(true);

    try {
      const response = await submitVote(vote.slug, token, {
        selectedOptionId,
        ...(requiresSelfAssessmentScore ? { selfAssessmentScore } : {}),
      });

      setSubmissionMessage(
        `${response.message} Weight used: ${response.submission.weightUsed}.`,
      );

      const [results, analytics] = await Promise.all([
        fetchVisibleResults(vote.slug, token),
        fetchVisibleAnalytics(vote.slug, token),
      ]);

      setResultsState({
        isLoading: false,
        error: null,
        data: results,
      });

      setAnalyticsState({
        isLoading: false,
        error: null,
        data: analytics,
      });
    } catch (err) {
      setSubmissionError(
        err instanceof Error ? err.message : 'Failed to submit vote',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const canShowResults =
    !!resultsState.data?.results?.visibility.canShowResults &&
    !!resultsState.data?.results?.results;

  const showRawResults = !!resultsState.data?.results?.visibility.showRawResults;
  const showWeightedResults =
    !!resultsState.data?.results?.visibility.showWeightedResults;

  const canShowAnalytics =
    !!analyticsState.data?.analytics?.visibility.canShowAnalytics &&
    !!analyticsState.data?.analytics?.analytics;

  const visibleResultSeries = useMemo(() => {
    const series: Array<{ key: 'rawVotes' | 'weightedVotes'; label: string }> =
      [];

    if (showRawResults) {
      series.push({ key: 'rawVotes', label: 'Raw votes' });
    }

    if (showWeightedResults) {
      series.push({ key: 'weightedVotes', label: 'Weighted votes' });
    }

    return series;
  }, [showRawResults, showWeightedResults]);

  const visibleTotalsCount =
    Number(
      showRawResults &&
        typeof resultsState.data?.results?.results?.totals.totalRawVotes !==
          'undefined',
    ) +
    Number(
      showWeightedResults &&
        typeof resultsState.data?.results?.results?.totals.totalWeightedVotes !==
          'undefined',
    );

  const visiblePieChartCount =
    Number(showRawResults && rawPieData.length > 0) +
    Number(showWeightedResults && weightedPieData.length > 0);

  const resultsComparisonTitle =
    visibleResultSeries.length === 1
      ? visibleResultSeries[0].label
      : 'Raw vs weighted results';

  return (
    <div className="mt-10 grid gap-12">
      <section className="rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-slate-50 p-6 shadow-sm ring-1 ring-green-100 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
                Participation
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 ring-1 ring-slate-200">
                {vote.derivedStatus ? formatEnumLabel(vote.derivedStatus) : 'Unknown'}
              </span>
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              Choose your option and vote
            </h2>

            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Consultation
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                {vote.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
                {vote.summary}
              </p>
            </div>

            <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              Select one option below to participate in this consultation. The
              option text is the most important part of your submission. Review
              the choices carefully before you continue.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoPill
                label="Vote type"
                value={formatEnumLabel(vote.voteType)}
              />
              <InfoPill
                label="Status"
                value={
                  vote.derivedStatus ? formatEnumLabel(vote.derivedStatus) : 'Unknown'
                }
              />
            </div>

            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Voting options
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Select exactly one option.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {sortedOptions.map((option, index) => {
                  const accentColor =
                    vote.displaySettings?.resultVisibilityMode === 'SHOW_WEIGHTED_ONLY'
                      ? WEIGHTED_OPTION_COLORS[
                          index % WEIGHTED_OPTION_COLORS.length
                        ]
                      : RAW_OPTION_COLORS[index % RAW_OPTION_COLORS.length];

                  const isSelected = selectedOptionId === option.id;

                  return (
                    <label
                      key={option.id}
                      className={`group flex cursor-pointer items-start gap-4 rounded-2xl border px-4 py-4 transition-all duration-200 ${
                        isSelected
                          ? 'border-green-300 bg-green-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedOptionId"
                        value={option.id}
                        checked={isSelected}
                        onChange={() => setSelectedOptionId(option.id)}
                        disabled={!canAttemptVote}
                        className="mt-1"
                      />

                      <div
                        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-sm"
                        style={{ backgroundColor: accentColor }}
                      >
                        {option.displayOrder}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Option {option.displayOrder}
                        </p>
                        <p className="mt-2 break-words text-base font-medium leading-7 text-slate-900">
                          {option.optionText}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {requiresAssessment ? (
              <NoticeBox tone="neutral">
                This consultation requires a completed assessment profile before
                you can participate.
              </NoticeBox>
            ) : null}

            {requiresSelfAssessmentScore ? (
              <div className="mt-6 rounded-2xl bg-white px-5 py-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Self-assessment score
                  </label>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                    {selfAssessmentScore}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Choose a value from 1 to 10. This affects weighting for this
                  consultation type.
                </p>

                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={selfAssessmentScore}
                  onChange={(event) =>
                    setSelfAssessmentScore(Number(event.target.value))
                  }
                  className="mt-4 w-full"
                  disabled={!canAttemptVote}
                />
              </div>
            ) : null}

            {!isLoading && !user ? (
              <NoticeBox tone="warning">
                You must sign in before participating in this consultation.
              </NoticeBox>
            ) : null}

            {!canAttemptVote ? (
              <NoticeBox tone="neutral">
                Voting is not currently open for this consultation.
              </NoticeBox>
            ) : null}

            {submissionError ? (
              <NoticeBox tone="danger">{submissionError}</NoticeBox>
            ) : null}

            {submissionMessage ? (
              <NoticeBox tone="success">{submissionMessage}</NoticeBox>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleSubmitVote}
                disabled={isSubmitting || !canAttemptVote}
                className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting...' : 'Submit vote'}
              </button>

              {requiresAssessment ? (
                <button
                  onClick={() => router.push('/assessment')}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
                >
                  Open assessment form
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Guidance
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Before you submit
            </h3>

            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p>
                Review the option wording carefully and make sure it matches the
                outcome you want to support.
              </p>
              <p>
                Some consultation types use weighted logic, so the final result
                can differ from the simple raw total.
              </p>
              <p>
                After you submit, the public page may update results and
                analytics depending on the consultation visibility settings.
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Current consultation type
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {formatEnumLabel(vote.voteType)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 pt-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Results
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Consultation results
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
            Review the current outcome of this consultation. Where permitted,
            raw and weighted results are shown side by side for easier
            comparison.
          </p>
        </div>

        {resultsState.isLoading ? (
          <p className="mt-5 text-sm text-slate-600">Loading results...</p>
        ) : resultsState.error ? (
          <NoticeBox tone="danger">{resultsState.error}</NoticeBox>
        ) : !canShowResults ? (
          <NoticeBox tone="neutral">
            Results are not currently visible for this consultation.
          </NoticeBox>
        ) : (
          <div className="mt-6 grid gap-8">
            <div
              className={`grid gap-3 ${
                visibleTotalsCount > 1 ? 'md:grid-cols-2' : ''
              }`}
            >
              {showRawResults &&
              typeof resultsState.data?.results?.results?.totals.totalRawVotes !==
                'undefined' ? (
                <SummaryStrip
                  label="Total raw votes"
                  value={String(
                    resultsState.data.results.results.totals.totalRawVotes,
                  )}
                />
              ) : null}

              {showWeightedResults &&
              typeof resultsState.data?.results?.results?.totals
                .totalWeightedVotes !== 'undefined' ? (
                <SummaryStrip
                  label="Total weighted votes"
                  value={String(
                    resultsState.data.results.results.totals.totalWeightedVotes,
                  )}
                  highlight
                />
              ) : null}
            </div>

            {resultsChartData.length > 0 && (showRawResults || showWeightedResults) ? (
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {resultsComparisonTitle}
                  </h3>
                </div>

                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={resultsChartData}
                      margin={{ top: 8, right: 12, left: 0, bottom: 40 }}
                    >
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        interval={0}
                        height={50}
                        tick={{ fill: '#475569', fontSize: 12 }}
                      />
                      <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                      <Tooltip
                        formatter={(value, name, entry) => {
                          const label =
                            name === 'rawVotes'
                              ? 'Raw votes'
                              : name === 'weightedVotes'
                              ? 'Weighted votes'
                              : String(name);

                          return [String(value), `${entry.payload.fullName} — ${label}`];
                        }}
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                          boxShadow:
                            '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      {visibleResultSeries.length > 1 ? (
                        <Legend
                          formatter={(value) =>
                            value === 'rawVotes'
                              ? 'Raw votes'
                              : value === 'weightedVotes'
                              ? 'Weighted votes'
                              : value
                          }
                        />
                      ) : null}

                      {showRawResults ? (
                        <Bar
                          dataKey="rawVotes"
                          name="rawVotes"
                          radius={[6, 6, 0, 0]}
                        >
                          {resultsChartData.map((entry, index) => (
                            <Cell
                              key={`raw-cell-${entry.name}-${index}`}
                              fill={entry.rawColor}
                            />
                          ))}
                        </Bar>
                      ) : null}

                      {showWeightedResults ? (
                        <Bar
                          dataKey="weightedVotes"
                          name="weightedVotes"
                          radius={[6, 6, 0, 0]}
                        >
                          {resultsChartData.map((entry, index) => (
                            <Cell
                              key={`weighted-cell-${entry.name}-${index}`}
                              fill={entry.weightedColor}
                            />
                          ))}
                        </Bar>
                      ) : null}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            <div
              className={`grid gap-6 ${
                visiblePieChartCount > 1 ? 'lg:grid-cols-2' : ''
              }`}
            >
              {showRawResults && rawPieData.length > 0 ? (
                <OptionResultPieCard
                  title="Raw vote distribution"
                  items={rawPieData}
                />
              ) : null}

              {showWeightedResults && weightedPieData.length > 0 ? (
                <OptionResultPieCard
                  title="Weighted vote distribution"
                  items={weightedPieData}
                />
              ) : null}
            </div>

            <div className="grid gap-4">
              {resultOptions.map((option, index) => (
                <div
                  key={option.optionId}
                  className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                      {option.displayOrder}
                    </div>
                    <p className="text-base font-semibold text-slate-900">
                      {option.optionText}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                    {showRawResults && typeof option.rawCount !== 'undefined' ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              RAW_OPTION_COLORS[index % RAW_OPTION_COLORS.length],
                          }}
                          aria-hidden="true"
                        />
                        <span>
                          <span className="font-medium text-slate-900">Raw:</span>{' '}
                          {option.rawCount} ({option.rawPercentage}%)
                        </span>
                      </span>
                    ) : null}

                    {showWeightedResults &&
                    typeof option.weightedCount !== 'undefined' ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              WEIGHTED_OPTION_COLORS[
                                index % WEIGHTED_OPTION_COLORS.length
                              ],
                          }}
                          aria-hidden="true"
                        />
                        <span>
                          <span className="font-medium text-slate-900">
                            Weighted:
                          </span>{' '}
                          {option.weightedCount} ({option.weightedPercentage}%)
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="border-t border-slate-200 pt-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Analytics
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Participation analytics
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
            View the participant breakdowns that are available for this
            consultation.
          </p>
        </div>

        {analyticsState.isLoading ? (
          <p className="mt-5 text-sm text-slate-600">Loading analytics...</p>
        ) : analyticsState.error ? (
          <NoticeBox tone="danger">{analyticsState.error}</NoticeBox>
        ) : !canShowAnalytics ? (
          <NoticeBox tone="neutral">
            Analytics are not currently visible for this consultation.
          </NoticeBox>
        ) : (
          <div className="mt-6 space-y-8">
            {analyticsState.data?.analytics?.analytics?.participation ? (
              <SummaryStrip
                label="Total participants"
                value={String(
                  analyticsState.data.analytics.analytics.participation
                    .totalParticipants,
                )}
                highlight
              />
            ) : null}

            <div className="grid gap-6 lg:grid-cols-3">
              <BreakdownChartCard
                title="Stakeholder breakdown"
                items={stakeholderChartData}
              />
              <BreakdownChartCard
                title="Background breakdown"
                items={backgroundChartData}
              />
              <BreakdownChartCard
                title="Location breakdown"
                items={locationChartData}
              />
              <BreakdownChartCard
                title="Age range breakdown"
                items={ageRangeChartData}
              />
              <BreakdownChartCard
                title="Gender breakdown"
                items={genderChartData}
              />
              <BreakdownChartCard
                title="Experience level breakdown"
                items={experienceLevelChartData}
              />
              <BreakdownChartCard
                title="Relationship to area breakdown"
                items={relationshipToAreaChartData}
              />
            </div>

            <BreakdownBlock
              title="Stakeholder breakdown"
              items={stakeholderChartData}
            />

            <BreakdownBlock
              title="Background breakdown"
              items={backgroundChartData}
            />

            <BreakdownBlock
              title="Location breakdown"
              items={locationChartData}
            />

            <BreakdownBlock
              title="Age range breakdown"
              items={ageRangeChartData}
            />

            <BreakdownBlock
              title="Gender breakdown"
              items={genderChartData}
            />

            <BreakdownBlock
              title="Experience level breakdown"
              items={experienceLevelChartData}
            />

            <BreakdownBlock
              title="Relationship to area breakdown"
              items={relationshipToAreaChartData}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function formatBreakdownItems(
  items?: AnalyticsBreakdownItem[],
): AnalyticsBreakdownItem[] {
  return (items ?? []).map((item) => ({
    ...item,
    label: formatEnumLabel(item.label),
  }));
}

function NoticeBox({
  children,
  tone,
}: {
  children: ReactNode;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const className =
    tone === 'success'
      ? 'mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700'
      : tone === 'warning'
      ? 'mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'
      : tone === 'danger'
      ? 'mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
      : 'mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700';

  return <div className={className}>{children}</div>;
}

function SummaryStrip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-5 py-4 shadow-sm ring-1 ${
        highlight ? 'bg-green-50 ring-green-200' : 'bg-white ring-slate-200'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 text-xl font-semibold ${
          highlight ? 'text-green-700' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function OptionResultPieCard({
  title,
  items,
}: {
  title: string;
  items: Array<{
    label: string;
    fullLabel: string;
    count: number;
    percentage: number;
    color: string;
  }>;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>

      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items}
              dataKey="count"
              nameKey="label"
              outerRadius={90}
              innerRadius={42}
              paddingAngle={2}
            >
              {items.map((item, index) => (
                <Cell
                  key={`${item.label}-${index}`}
                  fill={item.color}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, entry) => [
                `${value}`,
                `${entry.payload.fullLabel} (${entry.payload.percentage}%)`,
              ]}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                boxShadow:
                  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              }}
            />
            {items.length > 1 ? <Legend /> : null}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BreakdownBlock({
  title,
  items,
}: {
  title: string;
  items: Array<{
    label: string;
    count: number;
    percentage: number;
  }>;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>

      <div className="mt-3 grid gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200"
          >
            <p className="text-sm text-slate-700">
              <span className="font-medium text-slate-900">{item.label}</span> —{' '}
              {item.count} ({item.percentage}%)
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakdownChartCard({
  title,
  items,
}: {
  title: string;
  items: Array<{
    label: string;
    count: number;
    percentage: number;
  }>;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>

      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items}
              dataKey="count"
              nameKey="label"
              outerRadius={90}
              innerRadius={42}
              paddingAngle={2}
            >
              {items.map((item, index) => (
                <Cell
                  key={`${item.label}-${index}`}
                  fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, entry) => [
                `${value} (${entry.payload.percentage}%)`,
                entry.payload.label,
              ]}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                boxShadow:
                  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              }}
            />
            {items.length > 1 ? <Legend /> : null}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
