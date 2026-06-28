import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPublicVoteBySlug } from "@/lib/votes";
import { formatDateTime, formatEnumLabel } from "@/lib/format";
import { ConsultationInteractions } from "./consultation-interactions";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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

const NEUTRAL_OPTION_COLORS = [
  "#64748b",
  "#475569",
  "#6b7280",
  "#78716c",
  "#52525b",
  "#4b5563",
  "#71717a",
  "#334155",
  "#0f172a",
  "#374151",
  "#57534e",
  "#3f3f46",
];

export default async function ConsultationDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let response;
  try {
    response = await fetchPublicVoteBySlug(slug);
  } catch {
    notFound();
  }

  const vote = response.vote;

  const resultVisibilityMode =
    vote.displaySettings?.resultVisibilityMode ?? "HIDE_ALL";
  const showAfterVotingOnly = vote.displaySettings?.showAfterVotingOnly ?? false;
  const showOnlyAfterVoteCloses =
    vote.displaySettings?.showOnlyAfterVoteCloses ?? false;
  const closeOnlyGateActive =
    showOnlyAfterVoteCloses && vote.derivedStatus !== "PAST";
  const isVisibilityGated = showAfterVotingOnly || closeOnlyGateActive;

  const showRawDots =
    !isVisibilityGated &&
    (resultVisibilityMode === "SHOW_RAW_ONLY" ||
      resultVisibilityMode === "SHOW_BOTH");

  const showWeightedDots =
    !isVisibilityGated &&
    (resultVisibilityMode === "SHOW_WEIGHTED_ONLY" ||
      resultVisibilityMode === "SHOW_BOTH");

  const showNeutralDots =
    isVisibilityGated || resultVisibilityMode === "HIDE_ALL";

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <section className="px-5 py-10 sm:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <header className="mt-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
              <div className="min-w-0">
                <Link
                  href="/consultations"
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
                  <StatusBadge
                    label={
                      vote.derivedStatus
                        ? formatEnumLabel(vote.derivedStatus)
                        : "Unknown"
                    }
                    tone={deriveStatusTone(vote.derivedStatus)}
                  />
                </div>

                <p className="mt-7 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Public consultation
                </p>

                <h1 className="mt-4 max-w-5xl break-words text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                  {vote.title}
                </h1>

                <p className="mt-6 max-w-4xl break-words text-base leading-8 text-slate-600 md:text-lg">
                  {vote.summary}
                </p>
              </div>

              <aside className="border-y border-slate-200 py-5 lg:mt-11">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Consultation overview
                </p>

                <div className="mt-4 grid gap-4">
                  <OverviewRow
                    label="Vote type"
                    value={formatEnumLabel(vote.voteType)}
                  />
                  <OverviewRow
                    label="Topic"
                    value={formatEnumLabel(vote.topicCategory)}
                  />
                  <OverviewRow
                    label="Status"
                    value={
                      vote.derivedStatus
                        ? formatEnumLabel(vote.derivedStatus)
                        : "Unknown"
                    }
                  />
                  <OverviewRow
                    label="Starts"
                    value={formatDateTime(vote.startAt)}
                  />
                  <OverviewRow label="Ends" value={formatDateTime(vote.endAt)} />
                </div>
              </aside>
            </div>
          </header>

          {vote.methodologySummary ? (
            <section className="mt-10 border-y border-slate-200 py-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                Methodology
              </p>
              <p className="mt-4 max-w-4xl break-words text-sm leading-7 text-slate-600">
                {vote.methodologySummary}
              </p>
            </section>
          ) : null}

          {vote.coverImageUrl ? (
            <section className="mt-10 border-y border-slate-200 py-5">
              <div className="mx-auto flex min-h-[180px] w-full max-w-3xl items-center justify-center bg-slate-50 p-4 sm:min-h-[220px] md:min-h-[260px]">
                <img
                  src={vote.coverImageUrl}
                  alt={vote.coverImageAlt ?? vote.title}
                  className="block h-auto max-h-[280px] max-w-full object-contain sm:max-h-[320px]"
                />
              </div>
            </section>
          ) : null}

          <section className="mt-12 border-t border-slate-200 pt-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start">
              <div className="min-w-0">
                <SectionHeader
                  eyebrow="Your choices"
                  title="What you are voting for"
                  description="Review each option carefully before submitting your vote."
                />

                <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
                  {vote.options.map((option, index) => (
                    <article
                      key={option.id}
                      className="group py-5 transition duration-300 hover:bg-slate-50/70 active:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <OptionColorMarkers
                          index={index}
                          displayOrder={option.displayOrder}
                          showNeutralDots={showNeutralDots}
                          showRawDots={showRawDots}
                          showWeightedDots={showWeightedDots}
                        />

                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                            Option {option.displayOrder}
                          </p>
                          <p className="mt-2 max-w-4xl break-words text-base font-bold leading-7 text-slate-950">
                            {option.optionText}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="min-w-0">
                <SectionHeader
                  eyebrow="Before you vote"
                  title="Key information"
                  description="Check the consultation timing and status before making your choice."
                />

                <div className="mt-8 grid gap-4">
                  <InfoCard
                    title="Type"
                    value={formatEnumLabel(vote.voteType)}
                  />
                  <InfoCard
                    title="Topic"
                    value={formatEnumLabel(vote.topicCategory)}
                  />
                  <InfoCard
                    title="Status"
                    value={
                      vote.derivedStatus
                        ? formatEnumLabel(vote.derivedStatus)
                        : "Unknown"
                    }
                  />
                  <InfoCard title="Starts" value={formatDateTime(vote.startAt)} />
                  <InfoCard title="Ends" value={formatDateTime(vote.endAt)} />
                  <InfoCard
                    title="Published"
                    value={
                      vote.publishedAt
                        ? formatDateTime(vote.publishedAt)
                        : "Not published"
                    }
                  />
                </div>
              </aside>
            </div>
          </section>

          <div className="mt-12 border-t border-slate-200 pt-8">
            <ConsultationInteractions vote={vote} />
          </div>
        </div>
      </section>
    </main>
  );
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

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="min-w-0 border-y border-slate-200 py-4">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-t border-slate-200 pt-3 first:border-t-0 first:pt-0">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}

function OptionColorMarkers({
  index,
  displayOrder,
  showNeutralDots,
  showRawDots,
  showWeightedDots,
}: {
  index: number;
  displayOrder: number;
  showNeutralDots: boolean;
  showRawDots: boolean;
  showWeightedDots: boolean;
}) {
  if (showNeutralDots) {
    return (
      <span
        className="mt-2 block h-3 w-3 shrink-0"
        style={{
          backgroundColor:
            NEUTRAL_OPTION_COLORS[index % NEUTRAL_OPTION_COLORS.length],
        }}
        aria-label={`Option color for option ${displayOrder}`}
      />
    );
  }

  return (
    <span className="mt-2 flex shrink-0 items-center gap-2">
      {showRawDots ? (
        <span
          className="block h-3 w-3"
          style={{
            backgroundColor: RAW_OPTION_COLORS[index % RAW_OPTION_COLORS.length],
          }}
          aria-label={`Raw result color for option ${displayOrder}`}
        />
      ) : null}

      {showWeightedDots ? (
        <span
          className="block h-3 w-3"
          style={{
            backgroundColor:
              WEIGHTED_OPTION_COLORS[index % WEIGHTED_OPTION_COLORS.length],
          }}
          aria-label={`Weighted result color for option ${displayOrder}`}
        />
      ) : null}
    </span>
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
          ? "border-red-200 text-red-700"
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

function deriveStatusTone(
  status:
    | "UPCOMING"
    | "ONGOING"
    | "PAST"
    | "CANCELLED"
    | "ARCHIVED"
    | undefined,
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
