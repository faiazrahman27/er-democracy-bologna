'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '@/providers/auth-provider';
import {
  exportAdminAnalyticsExcel,
  fetchAdminAnalytics,
  fetchAdminParticipants,
  fetchAdminResults,
  fetchAdminVoteBySlug,
} from '@/lib/admin-votes';
import { isAdminRole } from '@/lib/roles';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { formatDateTime, formatEnumLabel } from '@/lib/format';
import { formatWeight } from '@/lib/admin-format';
import type {
  AdminAnalyticsResponse,
  AdminParticipantsResponse,
  AdminResultsResponse,
  AdminVoteListItem,
} from '@/lib/admin-votes';
import type { AnalyticsBreakdownItem } from '@/types/analytics';

const PIE_CHART_COLORS = [
  '#2563eb',
  '#f97316',
  '#16a34a',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#ca8a04',
  '#db2777',
  '#4f46e5',
  '#0f766e',
  '#ea580c',
  '#65a30d',
];

const RAW_OPTION_COLORS = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#d97706',
  '#7c3aed',
  '#0f766e',
  '#c2410c',
  '#be185d',
  '#4f46e5',
  '#65a30d',
  '#0891b2',
  '#854d0e',
];

const WEIGHTED_OPTION_COLORS = [
  '#1d4ed8',
  '#b91c1c',
  '#15803d',
  '#b45309',
  '#6d28d9',
  '#0f766e',
  '#ea580c',
  '#db2777',
  '#4338ca',
  '#4d7c0f',
  '#0e7490',
  '#92400e',
];

const RAW_SERIES_LEGEND_COLOR = '#1d4ed8';
const WEIGHTED_SERIES_LEGEND_COLOR = '#b45309';

export default function AdminConsultationDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const { user, token, isLoading } = useAuth();

  const [vote, setVote] = useState<AdminVoteListItem | null>(null);
  const [results, setResults] = useState<AdminResultsResponse['results'] | null>(
    null,
  );
  const [analytics, setAnalytics] =
    useState<AdminAnalyticsResponse['analytics'] | null>(null);
  const [participants, setParticipants] =
    useState<AdminParticipantsResponse['participants'] | null>(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?redirectTo=/admin/consultations/${params.slug}`);
      return;
    }

    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router, params.slug]);

  useEffect(() => {
    async function loadAll() {
      if (!token || !user) {
        setPageLoading(false);
        return;
      }

      try {
        const voteResponse = await fetchAdminVoteBySlug(token, params.slug);
        setVote(voteResponse.vote);

        const requests: Promise<unknown>[] = [];

        if (hasPermission(user.role, PERMISSIONS.RESULTS_VIEW_ADMIN)) {
          requests.push(
            fetchAdminResults(token, params.slug).then((response) => {
              setResults(response.results);
            }),
          );
        }

        if (hasPermission(user.role, PERMISSIONS.ANALYTICS_VIEW_ADMIN)) {
          requests.push(
            fetchAdminAnalytics(token, params.slug).then((response) => {
              setAnalytics(response.analytics);
            }),
          );
        }

        if (hasPermission(user.role, PERMISSIONS.PARTICIPANTS_VIEW_ADMIN)) {
          requests.push(
            fetchAdminParticipants(token, params.slug).then((response) => {
              setParticipants(response.participants);
            }),
          );
        }

        await Promise.all(requests);
      } catch (err) {
        setPageError(
          err instanceof Error ? err.message : 'Failed to load consultation',
        );
      } finally {
        setPageLoading(false);
      }
    }

    if (
      user &&
      token &&
      isAdminRole(user.role) &&
      hasPermission(user.role, PERMISSIONS.CONSULTATION_VIEW_ADMIN)
    ) {
      void loadAll();
    } else if (user) {
      setPageLoading(false);
    }
  }, [user, token, params.slug]);

  const resultsChartData = useMemo(() => {
    if (!results) {
      return [];
    }

    return results.options.map((option, index) => ({
      name: `Option ${option.displayOrder}`,
      fullName: option.optionText,
      rawVotes: option.rawCount,
      weightedVotes: Number(option.weightedCount),
      rawPercentage: option.rawPercentage,
      weightedPercentage: option.weightedPercentage,
      rawColor: RAW_OPTION_COLORS[index % RAW_OPTION_COLORS.length],
      weightedColor:
        WEIGHTED_OPTION_COLORS[index % WEIGHTED_OPTION_COLORS.length],
    }));
  }, [results]);

  const rawPieData = useMemo(() => {
    if (!results) {
      return [];
    }

    return results.options.map((option, index) => ({
      label: `Option ${option.displayOrder}`,
      fullLabel: option.optionText,
      count: option.rawCount,
      percentage: option.rawPercentage,
      color: RAW_OPTION_COLORS[index % RAW_OPTION_COLORS.length],
    }));
  }, [results]);

  const weightedPieData = useMemo(() => {
    if (!results) {
      return [];
    }

    return results.options.map((option, index) => ({
      label: `Option ${option.displayOrder}`,
      fullLabel: option.optionText,
      count: Number(option.weightedCount),
      percentage: option.weightedPercentage,
      color: WEIGHTED_OPTION_COLORS[index % WEIGHTED_OPTION_COLORS.length],
    }));
  }, [results]);

  const stakeholderChartData = useMemo(() => {
    return formatBreakdownItems(analytics?.breakdowns.stakeholderBreakdown);
  }, [analytics]);

  const backgroundChartData = useMemo(() => {
    return formatBreakdownItems(analytics?.breakdowns.backgroundBreakdown);
  }, [analytics]);

  const locationChartData = useMemo(() => {
    return formatBreakdownItems(analytics?.breakdowns.locationBreakdown);
  }, [analytics]);

  const ageRangeChartData = useMemo(() => {
    return formatBreakdownItems(analytics?.breakdowns.ageRangeBreakdown);
  }, [analytics]);

  const genderChartData = useMemo(() => {
    return formatBreakdownItems(analytics?.breakdowns.genderBreakdown);
  }, [analytics]);

  const experienceLevelChartData = useMemo(() => {
    return formatBreakdownItems(analytics?.breakdowns.experienceLevelBreakdown);
  }, [analytics]);

  const relationshipToAreaChartData = useMemo(() => {
    return formatBreakdownItems(
      analytics?.breakdowns.relationshipToAreaBreakdown,
    );
  }, [analytics]);

  if (isLoading || pageLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-slate-600">Loading consultation...</p>
        </div>
      </main>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  if (!hasPermission(user.role, PERMISSIONS.CONSULTATION_VIEW_ADMIN)) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            You do not have permission to view this admin consultation page.
          </div>
        </div>
      </main>
    );
  }

  if (pageError || !vote) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/admin/consultations"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            ← Back to consultation management
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError ?? 'Consultation not found'}
          </div>
        </div>
      </main>
    );
  }

  const canEditConsultation = hasPermission(
    user.role,
    PERMISSIONS.CONSULTATION_EDIT,
  );
  const canViewResults = hasPermission(
    user.role,
    PERMISSIONS.RESULTS_VIEW_ADMIN,
  );
  const canViewAnalytics = hasPermission(
    user.role,
    PERMISSIONS.ANALYTICS_VIEW_ADMIN,
  );
  const canViewParticipants = hasPermission(
    user.role,
    PERMISSIONS.PARTICIPANTS_VIEW_ADMIN,
  );
  const canLookupAssessment = hasPermission(
    user.role,
    PERMISSIONS.ASSESSMENT_SECRET_LOOKUP,
  );

  async function handleExportExcel() {
    if (!token) {
      setExportError('You must be signed in');
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const { blob, fileName } = await exportAdminAnalyticsExcel(
        token,
        params.slug,
      );

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(
        err instanceof Error
          ? err.message
          : 'Failed to export analytics Excel file',
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <section className="pb-10">
          <div className="mb-8 h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-4xl">
              <Link
                href="/admin/consultations"
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                ← Back to consultation management
              </Link>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                <StatusBadge label={formatEnumLabel(vote.voteType)} />
                <StatusBadge
                  label={formatEnumLabel(vote.topicCategory)}
                  tone="muted"
                />
                <StatusBadge
                  label={formatEnumLabel(vote.status)}
                  tone={deriveWorkflowTone(vote.status)}
                />
                {vote.derivedStatus ? (
                  <StatusBadge
                    label={formatEnumLabel(vote.derivedStatus)}
                    tone={deriveStatusTone(vote.derivedStatus)}
                  />
                ) : null}
                <StatusBadge
                  label={vote.isPublished ? 'Published' : 'Unpublished'}
                  tone={vote.isPublished ? 'success' : 'warning'}
                />
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                {vote.title}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                {vote.summary}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {canViewAnalytics ? (
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-md disabled:opacity-60"
                >
                  {isExporting ? 'Exporting...' : 'Export Excel'}
                </button>
              ) : null}

              {canEditConsultation ? (
                <Link
                  href={`/admin/consultations/${vote.slug}/edit`}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
                >
                  Edit consultation
                </Link>
              ) : null}

              <Link
                href={`/consultations/${vote.slug}`}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
              >
                Open public view
              </Link>
            </div>
          </div>
        </section>

        {exportError ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {exportError}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="min-w-0 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
            {vote.coverImageUrl ? (
              <div className="mb-8 mx-auto aspect-square w-full max-w-3xl overflow-hidden rounded-3xl bg-slate-100 ring-1 ring-slate-200">
                <img
                  src={vote.coverImageUrl}
                  alt={vote.coverImageAlt ?? vote.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

            <div className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Consultation summary
              </p>
              <p className="mt-3 text-base leading-8 text-slate-700">
                {vote.summary}
              </p>
            </div>

            <div className="mt-6 min-w-0 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Voting options
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    What participants are voting on
                  </h2>
                </div>
                {typeof vote.submissionCount === 'number' ? (
                  <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                    {vote.submissionCount}{' '}
                    {vote.submissionCount === 1 ? 'submission' : 'submissions'}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 grid gap-4">
                {vote.options?.map((option, index) => (
                  <div
                    key={option.id}
                    className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex shrink-0 items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              RAW_OPTION_COLORS[index % RAW_OPTION_COLORS.length],
                          }}
                          aria-hidden="true"
                        />
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
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Option {option.displayOrder}
                        </p>
                        <p className="mt-2 break-words text-base font-medium leading-7 text-slate-900">
                          {option.optionText}
                        </p>
                      </div>
                    </div>
                  </div>
                )) ?? (
                  <p className="text-sm text-slate-600">No options loaded.</p>
                )}
              </div>
            </div>

            {vote.methodologySummary ? (
              <div className="mt-6 min-w-0 rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Methodology
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {vote.methodologySummary}
                </p>
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoCard
                title="Timing"
                rows={[
                  ['Starts', formatDateTime(vote.startAt)],
                  ['Ends', formatDateTime(vote.endAt)],
                  ['Updated', formatDateTime(vote.updatedAt)],
                ]}
              />
              <InfoCard
                title="Publication"
                rows={[
                  ['Published', vote.isPublished ? 'Yes' : 'No'],
                  [
                    'Published at',
                    vote.publishedAt
                      ? formatDateTime(vote.publishedAt)
                      : 'Not published',
                  ],
                  [
                    'Locked at',
                    vote.lockedAt ? formatDateTime(vote.lockedAt) : 'Not locked',
                  ],
                ]}
              />
            </div>
          </div>

          <div className="min-w-0 space-y-6">
            <div className="min-w-0 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold">Visibility controls</h2>
              {vote.displaySettings ? (
                <div className="mt-4 grid min-w-0 gap-3">
                  <VisibilityRow
                    label="Result visibility"
                    value={formatEnumLabel(vote.displaySettings.resultVisibilityMode)}
                  />
                  <VisibilityRow
                    label="Participation stats"
                    value={
                      vote.displaySettings.showParticipationStats
                        ? 'Shown'
                        : 'Hidden'
                    }
                  />
                  <VisibilityRow
                    label="Stakeholder breakdown"
                    value={
                      vote.displaySettings.showStakeholderBreakdown
                        ? 'Shown'
                        : 'Hidden'
                    }
                  />
                  <VisibilityRow
                    label="Background breakdown"
                    value={
                      vote.displaySettings.showBackgroundBreakdown
                        ? 'Shown'
                        : 'Hidden'
                    }
                  />
                  <VisibilityRow
                    label="Location breakdown"
                    value={
                      vote.displaySettings.showLocationBreakdown
                        ? 'Shown'
                        : 'Hidden'
                    }
                  />
                  <VisibilityRow
                    label="Age range breakdown"
                    value={
                      vote.displaySettings.showAgeRangeBreakdown
                        ? 'Shown'
                        : 'Hidden'
                    }
                  />
                  <VisibilityRow
                    label="Gender breakdown"
                    value={
                      vote.displaySettings.showGenderBreakdown
                        ? 'Shown'
                        : 'Hidden'
                    }
                  />
                  <VisibilityRow
                    label="Experience level breakdown"
                    value={
                      vote.displaySettings.showExperienceLevelBreakdown
                        ? 'Shown'
                        : 'Hidden'
                    }
                  />
                  <VisibilityRow
                    label="Relationship to area breakdown"
                    value={
                      vote.displaySettings.showRelationshipBreakdown
                        ? 'Shown'
                        : 'Hidden'
                    }
                  />
                  <VisibilityRow
                    label="After voting only"
                    value={vote.displaySettings.showAfterVotingOnly ? 'Yes' : 'No'}
                  />
                  <VisibilityRow
                    label="Only after close"
                    value={
                      vote.displaySettings.showOnlyAfterVoteCloses ? 'Yes' : 'No'
                    }
                  />
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-600">
                  No display settings found.
                </p>
              )}
            </div>

            {(vote.coverImageUrl || vote.coverImageAlt) && (
              <div className="min-w-0 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-lg font-semibold">Cover image metadata</h2>
                <div className="mt-4 grid min-w-0 gap-3">
                  <VisibilityRow
                    label="Image URL"
                    value={vote.coverImageUrl ?? 'Not provided'}
                  />
                  <VisibilityRow
                    label="Alt text"
                    value={vote.coverImageAlt ?? 'Not provided'}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6">
          {canViewResults ? (
            <div className="min-w-0 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Results
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    Consultation outcome
                  </h2>
                </div>
              </div>

              {results ? (
                <>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <StatCard
                      label="Raw votes"
                      value={String(results.totals.totalRawVotes)}
                    />
                    <StatCard
                      label="Weighted votes"
                      value={String(results.totals.totalWeightedVotes)}
                      highlight
                    />
                  </div>

                  {resultsChartData.length > 0 ? (
                    <div className="mt-6 min-w-0 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                      <h3 className="text-base font-semibold tracking-tight text-slate-900">
                        Raw vs weighted results
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Compare simple vote counts with weighted vote totals for
                        each option. Use the series chips and option color key
                        below to match the chart to each consultation option.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <SeriesLegendChip
                          color={RAW_SERIES_LEGEND_COLOR}
                          label="Raw votes"
                        />
                        <SeriesLegendChip
                          color={WEIGHTED_SERIES_LEGEND_COLOR}
                          label="Weighted votes"
                        />
                      </div>
                      <div className="mt-4 h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={resultsChartData}
                            margin={{ top: 8, right: 12, left: 0, bottom: 40 }}
                          >
                            <CartesianGrid
                              stroke="#e2e8f0"
                              strokeDasharray="3 3"
                            />
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

                                return [
                                  String(value),
                                  `${entry.payload.fullName} — ${label}`,
                                ];
                              }}
                              contentStyle={{
                                borderRadius: 12,
                                border: '1px solid #e2e8f0',
                                boxShadow:
                                  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                              }}
                            />
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
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="mt-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Option color key
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {results.options.map((option, index) => (
                            <div
                              key={`result-key-${option.optionId}`}
                              className="rounded-2xl bg-slate-50 px-4 py-3 shadow-sm ring-1 ring-slate-200"
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-1 flex shrink-0 items-center gap-2">
                                  <ColorDot
                                    color={
                                      RAW_OPTION_COLORS[
                                        index % RAW_OPTION_COLORS.length
                                      ]
                                    }
                                  />
                                  <ColorDot
                                    color={
                                      WEIGHTED_OPTION_COLORS[
                                        index % WEIGHTED_OPTION_COLORS.length
                                      ]
                                    }
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-900">
                                    Option {option.displayOrder}
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-slate-600">
                                    {option.optionText}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <OptionResultPieCard
                      title="Raw vote distribution"
                      description="Each slice shows the share of raw votes recorded for an option."
                      valueLabel="votes"
                      items={rawPieData}
                    />
                    <OptionResultPieCard
                      title="Weighted vote distribution"
                      description="Each slice shows the share of the weighted total assigned to an option."
                      valueLabel="weighted total"
                      items={weightedPieData}
                    />
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {results.options.map((option, index) => (
                      <div
                        key={option.optionId}
                        className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex shrink-0 items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor:
                                  RAW_OPTION_COLORS[index % RAW_OPTION_COLORS.length],
                              }}
                              aria-hidden="true"
                            />
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
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Option {option.displayOrder}
                            </p>
                            <p className="mt-2 break-words text-base font-medium leading-7 text-slate-900">
                              {option.optionText}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
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
                              <span className="font-medium text-slate-900">
                                Raw:
                              </span>{' '}
                              {option.rawCount} ({option.rawPercentage}%)
                            </span>
                          </span>

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
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-600">
                  No results available.
                </p>
              )}
            </div>
          ) : null}

          {canViewAnalytics ? (
            <div className="min-w-0 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Analytics
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Participation insights
                </h2>
              </div>

              {analytics ? (
                <>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <StatCard
                      label="Participants"
                      value={String(analytics.totals.totalParticipants)}
                    />
                    <StatCard
                      label="Weighted total"
                      value={String(analytics.totals.totalWeightedVotes)}
                      highlight
                    />
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-3">
                    <BreakdownChartCard
                      title="Stakeholder breakdown"
                      description="Shows which stakeholder categories participated in this consultation."
                      items={stakeholderChartData}
                    />
                    <BreakdownChartCard
                      title="Background breakdown"
                      description="Shows how participants are distributed across background categories."
                      items={backgroundChartData}
                    />
                    <BreakdownChartCard
                      title="Location breakdown"
                      description="Shows which reported locations participants came from."
                      items={locationChartData}
                    />
                    <BreakdownChartCard
                      title="Age range breakdown"
                      description="Shows participation by age range."
                      items={ageRangeChartData}
                    />
                    <BreakdownChartCard
                      title="Gender breakdown"
                      description="Shows participation by gender."
                      items={genderChartData}
                    />
                    <BreakdownChartCard
                      title="Experience level breakdown"
                      description="Shows participation by experience level."
                      items={experienceLevelChartData}
                    />
                    <BreakdownChartCard
                      title="Relationship to area breakdown"
                      description="Shows how participants relate to the consultation area."
                      items={relationshipToAreaChartData}
                    />
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-600">
                  No analytics available.
                </p>
              )}
            </div>
          ) : null}

          {canViewParticipants ? (
            <div className="min-w-0 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Participants
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Submission records
                </h2>
              </div>

              {participants ? (
                <div className="mt-4 space-y-3">
                  {participants.participants.length === 0 ? (
                    <p className="text-sm text-slate-600">No participants yet.</p>
                  ) : (
                    participants.participants.map((participant) => (
                      <div
                        key={participant.submissionId}
                        className="min-w-0 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700 ring-1 ring-slate-200"
                      >
                        <p className="break-words">
                          <span className="font-medium text-slate-900">
                            Secret ID:
                          </span>{' '}
                          {participant.secretUserId ? (
                            canLookupAssessment ? (
                              <Link
                                href={`/admin/assessments/${participant.secretUserId}`}
                                className="break-all font-mono text-blue-600 underline hover:text-blue-800"
                              >
                                {participant.secretUserId}
                              </Link>
                            ) : (
                              <span className="break-all font-mono">
                                {participant.secretUserId}
                              </span>
                            )
                          ) : (
                            'Not available'
                          )}
                        </p>
                        <p className="mt-1 break-words">
                          <span className="font-medium text-slate-900">Option:</span>{' '}
                          {participant.selectedOptionText}
                        </p>
                        <p className="mt-1">
                          <span className="font-medium text-slate-900">Weight:</span>{' '}
                          {formatWeight(participant.weightUsed)}
                        </p>
                        <p className="mt-1">
                          <span className="font-medium text-slate-900">
                            Calculation:
                          </span>{' '}
                          {formatEnumLabel(participant.calculationType)}
                        </p>
                        {participant.selfAssessmentScore !== null ? (
                          <p className="mt-1">
                            <span className="font-medium text-slate-900">
                              Self score:
                            </span>{' '}
                            {participant.selfAssessmentScore}
                          </p>
                        ) : null}
                        <p className="mt-1">
                          <span className="font-medium text-slate-900">
                            Assessment complete:
                          </span>{' '}
                          {participant.hasCompletedAssessment ? 'Yes' : 'No'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-600">
                  No participant data available.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </main>
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

function InfoCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm text-slate-700">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <p className="mt-1 break-words text-sm font-medium text-slate-900">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisibilityRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 min-w-0 break-all whitespace-normal text-sm font-medium text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatCard({
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
      className={`rounded-2xl px-4 py-4 shadow-sm ring-1 ${
        highlight ? 'bg-green-50 ring-green-200' : 'bg-slate-50 ring-slate-200'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-semibold ${
          highlight ? 'text-green-700' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'muted' | 'success' | 'warning' | 'danger';
}) {
  const toneClass =
    tone === 'success'
      ? 'bg-emerald-100 text-emerald-700'
      : tone === 'warning'
        ? 'bg-amber-100 text-amber-700'
        : tone === 'danger'
          ? 'bg-red-100 text-red-700'
          : tone === 'muted'
            ? 'bg-slate-200 text-slate-600'
            : 'bg-slate-100 text-slate-700';

  return <span className={`rounded-full px-3 py-1 ${toneClass}`}>{label}</span>;
}

function ColorDot({ color }: { color: string }) {
  return (
    <span
      className="h-3 w-3 rounded-full"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

function SeriesLegendChip({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
      <ColorDot color={color} />
      {label}
    </span>
  );
}

type BreakdownChartLegendItem = {
  label: string;
  count: number;
  percentage: number;
  color: string;
};

function BreakdownPieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: BreakdownChartLegendItem;
  }>;
}) {
  const item = payload?.[0]?.payload;

  if (!active || !item) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <div className="flex items-start gap-3">
        <span className="rounded-full p-0.5 ring-2 ring-white shadow-sm">
          <ColorDot color={item.color} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{item.label}</p>
          <p className="mt-1 text-xs font-medium text-slate-700">
            {item.count} participants
          </p>
          <p className="text-xs text-slate-600">{item.percentage}%</p>
        </div>
      </div>
    </div>
  );
}

function OptionResultPieCard({
  title,
  description,
  valueLabel,
  items,
}: {
  title: string;
  description: string;
  valueLabel: string;
  items: Array<{
    label: string;
    fullLabel: string;
    count: number;
    percentage: number;
    color: string;
  }>;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold tracking-tight text-slate-900">
          {title}
        </h3>
        <p className="mt-4 text-sm text-slate-600">No data available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h3 className="text-base font-semibold tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>

      <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-center">
        <div className="h-72 w-full">
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
                  `${value} ${valueLabel} (${entry.payload.percentage}%)`,
                  `${entry.payload.label}: ${entry.payload.fullLabel}`,
                ]}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow:
                    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={`result-pie-legend-${item.label}`}
              className="rounded-2xl bg-slate-50 px-3 py-3 ring-1 ring-slate-200"
            >
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <ColorDot color={item.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {item.fullLabel}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-700">
                    {item.count} {valueLabel} ({item.percentage}%)
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BreakdownChartCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{
    label: string;
    count: number;
    percentage: number;
  }>;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold tracking-tight text-slate-900">
          {title}
        </h3>
        <p className="mt-4 text-sm text-slate-600">No data available.</p>
      </div>
    );
  }

  const chartItems: BreakdownChartLegendItem[] = items.map((item, index) => ({
    ...item,
    color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
  }));

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h3 className="text-base font-semibold tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>

      <div className="mt-5 grid gap-5">
        <div className="flex justify-center">
          <div className="aspect-square w-full max-w-[15rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Pie
                  data={chartItems}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius="92%"
                  paddingAngle={chartItems.length > 1 ? 1 : 0}
                >
                  {chartItems.map((item) => (
                    <Cell
                      key={item.label}
                      fill={item.color}
                      stroke="#ffffff"
                      strokeWidth={3}
                    />
                  ))}
                </Pie>
                <Tooltip content={<BreakdownPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <BreakdownLegendList items={chartItems} />
      </div>
    </div>
  );
}

function BreakdownLegendList({
  items,
}: {
  items: BreakdownChartLegendItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 shadow-sm"
          style={{ borderLeftColor: item.color, borderLeftWidth: 6 }}
        >
          <span className="hidden" aria-hidden="true">
            {item.label} — {item.count} ({item.percentage}%)
          </span>
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold text-slate-900">
              {item.label}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-slate-700">
              <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                {item.count} participants
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                {item.percentage}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function deriveStatusTone(
  status: AdminVoteListItem['derivedStatus'],
): 'success' | 'warning' | 'muted' | 'danger' {
  if (status === 'ONGOING') {
    return 'success';
  }

  if (status === 'UPCOMING') {
    return 'warning';
  }

  if (status === 'CANCELLED') {
    return 'danger';
  }

  return 'muted';
}

function deriveWorkflowTone(
  status: AdminVoteListItem['status'],
): 'success' | 'warning' | 'muted' | 'danger' {
  if (status === 'PUBLISHED' || status === 'APPROVED') {
    return 'success';
  }

  if (status === 'REVIEW' || status === 'DRAFT') {
    return 'warning';
  }

  if (status === 'CANCELLED') {
    return 'danger';
  }

  return 'muted';
}
