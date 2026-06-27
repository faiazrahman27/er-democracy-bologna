"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useParams } from "next/navigation";
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
} from "recharts";
import { useAuth } from "@/providers/auth-provider";
import {
  exportAdminAnalyticsExcel,
  fetchAdminAnalytics,
  fetchAdminParticipants,
  fetchAdminResults,
  fetchAdminVoteBySlug,
} from "@/lib/admin-votes";
import { isAdminRole } from "@/lib/roles";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { formatDateTime, formatEnumLabel } from "@/lib/format";
import { formatWeight } from "@/lib/admin-format";
import type {
  AdminAnalyticsResponse,
  AdminParticipantsResponse,
  AdminResultsResponse,
  AdminVoteListItem,
} from "@/lib/admin-votes";
import type { AnalyticsBreakdownItem } from "@/types/analytics";

const PIE_CHART_COLORS = [
  "#E6194B",
  "#3CB44B",
  "#4363D8",
  "#F58231",
  "#911EB4",
  "#46F0F0",
  "#F032E6",
  "#BCF60C",
  "#FABE28",
  "#008080",
  "#E6BEFF",
  "#9A6324",
  "#800000",
  "#AAFFC3",
  "#808000",
  "#FFD8B1",
  "#000075",
  "#A9A9A9",
  "#FF1493",
  "#00CED1",
  "#7FFF00",
  "#DC143C",
  "#1E90FF",
  "#FF8C00",
  "#9400D3",
  "#00FA9A",
  "#FF4500",
  "#2E8B57",
  "#8B4513",
  "#6A5ACD",
  "#20B2AA",
  "#FF69B4",
  "#B8860B",
  "#4682B4",
  "#D2691E",
  "#32CD32",
  "#8B0000",
  "#00BFFF",
  "#9932CC",
  "#ADFF2F",
  "#FF6347",
  "#40E0D0",
  "#DAA520",
  "#BA55D3",
  "#228B22",
];

const RAW_OPTION_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0f766e",
  "#c2410c",
  "#be185d",
  "#4f46e5",
  "#65a30d",
  "#0891b2",
  "#854d0e",
];

const WEIGHTED_OPTION_COLORS = [
  "#f97316",
  "#9333ea",
  "#059669",
  "#b91c1c",
  "#0e7490",
  "#be123c",
  "#4338ca",
  "#4d7c0f",
  "#92400e",
  "#0369a1",
  "#a21caf",
  "#7c2d12",
];

export default function AdminConsultationDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const { user, token, isLoading } = useAuth();

  const [vote, setVote] = useState<AdminVoteListItem | null>(null);
  const [results, setResults] = useState<
    AdminResultsResponse["results"] | null
  >(null);
  const [analytics, setAnalytics] = useState<
    AdminAnalyticsResponse["analytics"] | null
  >(null);
  const [participants, setParticipants] = useState<
    AdminParticipantsResponse["participants"] | null
  >(null);

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
      router.replace("/dashboard");
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
          err instanceof Error ? err.message : "Failed to load consultation",
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

  const yearsOfExperienceChartData = useMemo(() => {
    return formatBreakdownItems(
      analytics?.breakdowns.yearsOfExperienceBreakdown,
    );
  }, [analytics]);

  const studyLevelChartData = useMemo(() => {
    return formatBreakdownItems(analytics?.breakdowns.studyLevelBreakdown);
  }, [analytics]);

  const relationshipToAreaChartData = useMemo(() => {
    return formatBreakdownItems(
      analytics?.breakdowns.relationshipToAreaBreakdown,
    );
  }, [analytics]);

  if (isLoading || pageLoading) {
    return (
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="border-y border-slate-200 py-6">
            <p className="text-sm font-medium text-slate-500">
              Loading consultation...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  if (!hasPermission(user.role, PERMISSIONS.CONSULTATION_VIEW_ADMIN)) {
    return (
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="border-y border-red-200 py-4 text-sm font-bold text-red-700">
            You do not have permission to view this admin consultation page.
          </div>
        </div>
      </main>
    );
  }

  if (pageError || !vote) {
    return (
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/admin/consultations"
            className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
          >
            ← Back to consultation management
          </Link>

          <div className="mt-6 border-y border-red-200 py-4 text-sm font-bold text-red-700">
            {pageError ?? "Consultation not found"}
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
  const canLookupSpecializedAssessment =
    canLookupAssessment && vote.voteType === "SPECIALIZED";

  const rawLegendColors = resultsChartData.map((option) => option.rawColor);
  const weightedLegendColors = resultsChartData.map(
    (option) => option.weightedColor,
  );

  async function handleExportExcel() {
    if (!token) {
      setExportError("You must be signed in");
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
      const anchor = document.createElement("a");
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
          : "Failed to export analytics Excel file",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <section className="px-5 py-10 sm:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <header className="mt-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
              <div className="min-w-0">
                <Link
                  href="/admin/consultations"
                  className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                >
                  ← Back to consultations
                </Link>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <StatusBadge label={formatEnumLabel(vote.voteType)} />
                  <StatusBadge
                    label={formatEnumLabel(vote.topicCategory)}
                    tone="muted"
                  />
                  {vote.isPublished ? (
                    <StatusBadge label="Published" tone="success" />
                  ) : (
                    <StatusBadge
                      label={formatEnumLabel(vote.status)}
                      tone={deriveWorkflowTone(vote.status)}
                    />
                  )}
                  {vote.derivedStatus ? (
                    <StatusBadge
                      label={formatEnumLabel(vote.derivedStatus)}
                      tone={deriveStatusTone(vote.derivedStatus)}
                    />
                  ) : null}
                </div>

                <p className="mt-7 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Consultation detail
                </p>

                <h1 className="mt-4 max-w-4xl break-words text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                  {vote.title}
                </h1>

                <p className="mt-6 max-w-3xl break-words text-base leading-8 text-slate-600">
                  {vote.summary}
                </p>
              </div>

              <aside className="border-y border-slate-200 py-5 lg:mt-11">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Admin actions
                </p>

                <div className="mt-4 grid gap-3">
                  {canViewAnalytics ? (
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      disabled={isExporting}
                      className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-500 hover:text-green-700 hover:shadow-md active:-translate-y-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isExporting ? "Exporting..." : "Export Excel"}
                    </button>
                  ) : null}

                  {canEditConsultation ? (
                    <Link
                      href={`/admin/consultations/${vote.slug}/edit`}
                      className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                    >
                      Edit consultation
                    </Link>
                  ) : null}

                  <Link
                    href={`/consultations/${vote.slug}`}
                    className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-500 hover:text-green-700 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                  >
                    Open public view
                  </Link>
                </div>
              </aside>
            </div>
          </header>

          {exportError ? (
            <div className="mt-8 border-y border-red-200 py-4 text-sm font-bold text-red-700">
              {exportError}
            </div>
          ) : null}

          <section className="mt-12 border-y border-slate-200 py-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
              <div className="min-w-0">
                <SectionHeader
                  eyebrow="Consultation content"
                  title="Options and key details"
                  description="This view focuses on the consultation record, voting options, and admin results. Detailed configuration remains available from the edit page."
                />

                <div className="mt-8">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                        Voting options
                      </p>
                      <h3 className="mt-2 max-w-2xl text-2xl font-black tracking-[-0.045em] text-slate-950">
                        What participants are voting on
                      </h3>
                    </div>

                    {typeof vote.submissionCount === "number" ? (
                      <p className="text-sm font-black text-green-700">
                        {vote.submissionCount}{" "}
                        {vote.submissionCount === 1
                          ? "submission"
                          : "submissions"}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
                    {vote.options?.map((option, index) => (
                      <div
                        key={option.id}
                        className="py-4 transition duration-200 hover:bg-slate-50/70 active:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-start gap-3">
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
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                              Option {option.displayOrder}
                            </p>
                            <p className="mt-2 max-w-3xl break-words text-base font-bold leading-7 text-slate-900">
                              {option.optionText}
                            </p>
                          </div>
                        </div>
                      </div>
                    )) ?? (
                      <p className="py-4 text-sm text-slate-600">
                        No options loaded.
                      </p>
                    )}
                  </div>
                </div>

                {vote.methodologySummary ? (
                  <div className="mt-8 border-t border-slate-200 pt-6">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                      Methodology
                    </p>
                    <p className="mt-3 max-w-3xl break-words text-sm leading-7 text-slate-600">
                      {vote.methodologySummary}
                    </p>
                  </div>
                ) : null}
              </div>

              <aside className="min-w-0">
                {vote.coverImageUrl ? (
                  <div className="flex items-center justify-center bg-slate-50 p-5">
                    <img
                      src={vote.coverImageUrl}
                      alt={vote.coverImageAlt ?? vote.title}
                      className="block h-auto max-h-[380px] max-w-full object-contain"
                    />
                  </div>
                ) : null}

                <SideSection title="Timing">
                  <InfoLine label="Starts" value={formatDateTime(vote.startAt)} />
                  <InfoLine label="Ends" value={formatDateTime(vote.endAt)} />
                  <InfoLine
                    label="Updated"
                    value={formatDateTime(vote.updatedAt)}
                  />
                </SideSection>
              </aside>
            </div>
          </section>

          <div className="mt-12 grid gap-14">
            {canViewResults ? (
              <section className="border-t border-slate-200 pt-8">
                <SectionHeader
                  eyebrow="Results"
                  title="Consultation outcome"
                />

                {results ? (
                  <>
                    <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:max-w-3xl">
                      <StatLine
                        label="Raw votes"
                        value={String(results.totals.totalRawVotes)}
                      />
                      <StatLine
                        label="Weighted votes"
                        value={String(results.totals.totalWeightedVotes)}
                        positive
                      />
                    </div>

                    {resultsChartData.length > 0 ? (
                      <div className="mt-8 border-y border-slate-200 py-6">
                        <div className="max-w-3xl">
                          <h3 className="text-2xl font-black tracking-[-0.045em] text-slate-950">
                            Raw vs weighted results
                          </h3>
                          <p className="mt-3 text-sm leading-7 text-slate-600">
                            Each option keeps its own color in both series. Raw
                            bars and weighted bars are grouped side by side for
                            admin comparison.
                          </p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <PaletteLegendChip
                              colors={rawLegendColors}
                              label="Raw votes by option"
                            />
                            <PaletteLegendChip
                              colors={weightedLegendColors}
                              label="Weighted votes by option"
                            />
                          </div>
                        </div>

                        <div className="mt-6 h-80 w-full min-w-0 overflow-hidden">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={resultsChartData}
                              barCategoryGap="42%"
                              barGap={10}
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
                                tick={{ fill: "#475569", fontSize: 12 }}
                              />
                              <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
                              <Tooltip
                                formatter={(value, name, entry) => {
                                  const label =
                                    name === "rawVotes"
                                      ? "Raw votes"
                                      : name === "weightedVotes"
                                        ? "Weighted votes"
                                        : String(name);

                                  return [
                                    String(value),
                                    `${entry.payload.fullName} — ${label}`,
                                  ];
                                }}
                                contentStyle={{
                                  border: "1px solid #e2e8f0",
                                  boxShadow:
                                    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                                }}
                              />
                              <Bar
                                dataKey="rawVotes"
                                name="rawVotes"
                                maxBarSize={46}
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
                                maxBarSize={46}
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
                      </div>
                    ) : null}

                    <div className="mt-8 grid gap-8 xl:grid-cols-2">
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

                    <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
                      {results.options.map((option, index) => (
                        <div
                          key={option.optionId}
                          className="py-5 transition duration-200 hover:bg-slate-50/70 active:bg-slate-50"
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
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                                Option {option.displayOrder}
                              </p>
                              <p className="mt-2 max-w-4xl break-words text-base font-bold leading-7 text-slate-900">
                                {option.optionText}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
                                <span>
                                  <span className="font-bold text-slate-900">
                                    Raw:
                                  </span>{" "}
                                  {option.rawCount} ({option.rawPercentage}%)
                                </span>
                                <span>
                                  <span className="font-bold text-slate-900">
                                    Weighted:
                                  </span>{" "}
                                  {option.weightedCount} (
                                  {option.weightedPercentage}%)
                                </span>
                              </div>
                            </div>
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
              </section>
            ) : null}

            {canViewAnalytics ? (
              <section className="border-t border-slate-200 pt-8">
                <SectionHeader
                  eyebrow="Analytics"
                  title="Participation insights"
                />

                {analytics ? (
                  <>
                    <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:max-w-3xl">
                      <StatLine
                        label="Participants"
                        value={String(analytics.totals.totalParticipants)}
                      />
                      <StatLine
                        label="Weighted total"
                        value={String(analytics.totals.totalWeightedVotes)}
                        positive
                      />
                    </div>

                    <div className="mt-8 grid gap-x-10 gap-y-12 md:grid-cols-2">
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
                        title="Years of experience breakdown"
                        description="Shows participation by years of experience."
                        items={yearsOfExperienceChartData}
                      />
                      <BreakdownChartCard
                        title="Study level breakdown"
                        description="Shows participation by study level."
                        items={studyLevelChartData}
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
              </section>
            ) : null}

            {canViewParticipants ? (
              <section className="border-t border-slate-200 pt-8">
                <SectionHeader eyebrow="Participants" title="Submission records" />

                {participants ? (
                  <div className="mt-7 divide-y divide-slate-200 border-y border-slate-200">
                    {participants.participants.length === 0 ? (
                      <p className="py-5 text-sm text-slate-600">
                        No participants yet.
                      </p>
                    ) : (
                      participants.participants.map((participant) => (
                        <div
                          key={participant.submissionId}
                          className="min-w-0 py-5 text-sm text-slate-700 transition duration-200 hover:bg-slate-50/70 active:bg-slate-50"
                        >
                          <div className="grid gap-x-8 gap-y-2 md:grid-cols-2 xl:grid-cols-3">
                            {canLookupSpecializedAssessment ? (
                              <ParticipantField label="Secret ID">
                                {participant.secretUserId ? (
                                  <Link
                                    href={`/admin/assessments/${participant.secretUserId}`}
                                    className="break-all font-mono text-green-700 underline underline-offset-4 hover:text-green-800"
                                  >
                                    {participant.secretUserId}
                                  </Link>
                                ) : (
                                  "Not available"
                                )}
                              </ParticipantField>
                            ) : null}

                            <ParticipantField label="Option">
                              {participant.selectedOptionText}
                            </ParticipantField>

                            <ParticipantField label="Weight">
                              {formatWeight(participant.weightUsed)}
                            </ParticipantField>

                            {canLookupSpecializedAssessment &&
                            participant.specializedBaseWeightUsed !== null &&
                            typeof participant.specializedBaseWeightUsed !==
                              "undefined" ? (
                              <ParticipantField label="Specialized base weight">
                                {formatWeight(
                                  participant.specializedBaseWeightUsed,
                                )}
                              </ParticipantField>
                            ) : null}

                            {canLookupSpecializedAssessment &&
                            participant.specializedQuestionModifierTotal !== null &&
                            typeof participant.specializedQuestionModifierTotal !==
                              "undefined" ? (
                              <ParticipantField label="Question modifier total">
                                {formatSignedWeight(
                                  participant.specializedQuestionModifierTotal,
                                )}
                              </ParticipantField>
                            ) : null}

                            <ParticipantField label="Calculation">
                              {formatEnumLabel(participant.calculationType)}
                            </ParticipantField>

                            {participant.selfAssessmentScore !== null ? (
                              <ParticipantField label="Self score">
                                {participant.selfAssessmentScore}
                              </ParticipantField>
                            ) : null}

                            <ParticipantField label="Assessment complete">
                              {participant.hasCompletedAssessment ? "Yes" : "No"}
                            </ParticipantField>
                          </div>

                          {canLookupSpecializedAssessment &&
                          participant.weightedQuestionAnswers &&
                          participant.weightedQuestionAnswers.length > 0 ? (
                            <div className="mt-5 border-t border-slate-200 pt-4">
                              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                                Weighted question answers
                              </p>
                              <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                                {participant.weightedQuestionAnswers.map(
                                  (answer) => (
                                    <div
                                      key={`${participant.submissionId}-${answer.questionId}`}
                                      className="py-4"
                                    >
                                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                                        Question {answer.questionDisplayOrder}
                                      </p>
                                      <p className="mt-1 max-w-3xl text-sm font-bold text-slate-900">
                                        {answer.questionPrompt}
                                      </p>
                                      <p className="mt-2 text-sm text-slate-700">
                                        <span className="font-bold text-slate-900">
                                          Selected answer:
                                        </span>{" "}
                                        {answer.selectedOptionText}
                                      </p>
                                      <p className="mt-1 text-sm text-slate-700">
                                        <span className="font-bold text-slate-900">
                                          Modifier:
                                        </span>{" "}
                                        {formatSignedWeight(answer.modifierUsed)}
                                      </p>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">
                    No participant data available.
                  </p>
                )}
              </section>
            ) : null}
          </div>
        </div>
      </section>
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

function formatSignedWeight(value: string | number) {
  const numeric = typeof value === "number" ? value : Number(value);

  if (Number.isNaN(numeric)) {
    return String(value);
  }

  return `${numeric >= 0 ? "+" : ""}${numeric.toFixed(4)}`;
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950 md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

function SideSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-6 border-y border-slate-200 py-5 first:mt-0">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
        {title}
      </p>
      <div className="mt-4 grid gap-4">{children}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-slate-200 pt-3 first:border-t-0 first:pt-0">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 min-w-0 break-words text-sm font-bold leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatLine({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="border-y border-slate-200 py-4">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-black tracking-[-0.05em] ${
          positive ? "text-green-700" : "text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "muted" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "border-green-200 text-green-700"
      : tone === "warning"
        ? "border-amber-200 text-amber-700"
        : tone === "danger"
          ? "border-red-200 text-red-600"
          : tone === "muted"
            ? "border-slate-200 text-slate-500"
            : "border-slate-200 text-slate-700";

  return (
    <span
      className={`border bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${toneClass}`}
    >
      {label}
    </span>
  );
}

function ColorDot({ color }: { color: string }) {
  return (
    <span
      className="h-3 w-3 shrink-0"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

function PaletteLegendChip({
  colors,
  label,
}: {
  colors: string[];
  label: string;
}) {
  const visibleColors = colors.slice(0, 8);

  return (
    <span className="inline-flex items-center gap-3 border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
      <span className="flex items-center gap-1" aria-hidden="true">
        {visibleColors.map((color, index) => (
          <span
            key={`${label}-${color}-${index}`}
            className="h-3 w-3 shrink-0"
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
      {label}
    </span>
  );
}

function ParticipantField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 border-t border-slate-200 pt-3">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-900">
        {children}
      </p>
    </div>
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
    <div className="border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <div className="flex items-start gap-3">
        <ColorDot color={item.color} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">{item.label}</p>
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
      <div className="border-y border-slate-200 py-6">
        <h3 className="text-2xl font-black tracking-[-0.045em] text-slate-950">
          {title}
        </h3>
        <p className="mt-4 text-sm text-slate-600">No data available.</p>
      </div>
    );
  }

  return (
    <div className="border-y border-slate-200 py-6">
      <h3 className="text-2xl font-black tracking-[-0.045em] text-slate-950">
        {title}
      </h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
        {description}
      </p>

      <div className="mt-5 grid gap-5">
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={items}
                dataKey="count"
                nameKey="label"
                outerRadius={86}
                innerRadius={40}
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
                  border: "1px solid #e2e8f0",
                  boxShadow:
                    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {items.map((item) => (
            <div key={`result-pie-legend-${item.label}`} className="py-3">
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <ColorDot color={item.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">
                    {item.label}
                  </p>
                  <p className="mt-1 break-words text-xs leading-5 text-slate-600">
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
      <div className="border-y border-slate-200 py-6">
        <h3 className="text-xl font-black tracking-[-0.04em] text-slate-950">
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
    <div className="min-w-0 border-y border-slate-200 py-6">
      <h3 className="max-w-md text-xl font-black tracking-[-0.04em] text-slate-950">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        {description}
      </p>

      <div className="mt-5 grid gap-5">
        <div className="flex justify-center">
          <div className="aspect-square w-full max-w-[13.5rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Pie
                  data={chartItems}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius="90%"
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

function BreakdownLegendList({ items }: { items: BreakdownChartLegendItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:-translate-y-0.5 active:shadow-md"
          style={{ borderLeftColor: item.color, borderLeftWidth: 6 }}
        >
          <span className="hidden" aria-hidden="true">
            {item.label} — {item.count} ({item.percentage}%)
          </span>
          <div className="min-w-0">
            <p className="break-words text-sm font-bold text-slate-900">
              {item.label}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-slate-700">
              <span className="border border-slate-200 bg-white px-2.5 py-1">
                {item.count} participants
              </span>
              <span className="border border-slate-200 bg-white px-2.5 py-1">
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
  status: AdminVoteListItem["derivedStatus"],
): "success" | "warning" | "muted" | "danger" {
  if (status === "ONGOING") {
    return "success";
  }

  if (status === "UPCOMING") {
    return "warning";
  }

  if (status === "CANCELLED") {
    return "danger";
  }

  return "muted";
}

function deriveWorkflowTone(
  status: AdminVoteListItem["status"],
): "success" | "warning" | "muted" | "danger" {
  if (status === "PUBLISHED" || status === "APPROVED") {
    return "success";
  }

  if (status === "REVIEW" || status === "DRAFT") {
    return "warning";
  }

  if (status === "CANCELLED") {
    return "danger";
  }

  return "muted";
}
