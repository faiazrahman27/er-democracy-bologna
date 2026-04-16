import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchPublicVoteBySlug } from '@/lib/votes';
import { formatDateTime, formatEnumLabel } from '@/lib/format';
import { ConsultationInteractions } from './consultation-interactions';

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const RAW_OPTION_COLORS = [
  '#2563eb',
  '#0ea5e9',
  '#7c3aed',
  '#8b5cf6',
  '#1d4ed8',
  '#0891b2',
  '#6366f1',
  '#4f46e5',
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
];

const NEUTRAL_OPTION_COLORS = [
  '#64748b',
  '#475569',
  '#6b7280',
  '#78716c',
  '#52525b',
  '#4b5563',
  '#71717a',
  '#334155',
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
    vote.displaySettings?.resultVisibilityMode ?? 'HIDE_ALL';
  const showAfterVotingOnly = vote.displaySettings?.showAfterVotingOnly ?? false;
  const showOnlyAfterVoteCloses =
    vote.displaySettings?.showOnlyAfterVoteCloses ?? false;

  const isVisibilityGated = showAfterVotingOnly || showOnlyAfterVoteCloses;

  const showRawDots =
    !isVisibilityGated &&
    (resultVisibilityMode === 'SHOW_RAW_ONLY' ||
      resultVisibilityMode === 'SHOW_BOTH');

  const showWeightedDots =
    !isVisibilityGated &&
    (resultVisibilityMode === 'SHOW_WEIGHTED_ONLY' ||
      resultVisibilityMode === 'SHOW_BOTH');

  const showNeutralDots =
    isVisibilityGated || resultVisibilityMode === 'HIDE_ALL';

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            href="/consultations"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            ← Back to consultations
          </Link>
        </div>

        <section className="pb-10">
          <div className="mb-8 h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                <StatusBadge label={formatEnumLabel(vote.voteType)} />
                <StatusBadge
                  label={formatEnumLabel(vote.topicCategory)}
                  tone="muted"
                />
                <StatusBadge
                  label={
                    vote.derivedStatus
                      ? formatEnumLabel(vote.derivedStatus)
                      : 'Unknown'
                  }
                  tone={deriveStatusTone(vote.derivedStatus)}
                />
              </div>

              <h1 className="mt-5 max-w-4xl break-words text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                {vote.title}
              </h1>

              <p className="mt-5 max-w-3xl break-words text-base leading-7 text-slate-600">
                {vote.summary}
              </p>

              {vote.methodologySummary ? (
                <div className="mt-8 max-w-4xl rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-200 min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Methodology
                  </p>
                  <p className="mt-3 break-words text-sm leading-7 text-slate-600">
                    {vote.methodologySummary}
                  </p>
                </div>
              ) : null}
            </div>

            <aside className="min-w-0 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Consultation overview
              </p>

              <div className="mt-5 grid gap-4">
                <OverviewRow
                  label="Vote type"
                  value={formatEnumLabel(vote.voteType)}
                />
                <OverviewRow
                  label="Topic category"
                  value={formatEnumLabel(vote.topicCategory)}
                />
                <OverviewRow
                  label="Status"
                  value={
                    vote.derivedStatus
                      ? formatEnumLabel(vote.derivedStatus)
                      : 'Unknown'
                  }
                />
                <OverviewRow
                  label="Starts"
                  value={formatDateTime(vote.startAt)}
                />
                <OverviewRow
                  label="Ends"
                  value={formatDateTime(vote.endAt)}
                />
                <OverviewRow
                  label="Published"
                  value={
                    vote.publishedAt
                      ? formatDateTime(vote.publishedAt)
                      : 'Not published'
                  }
                />
              </div>
            </aside>
          </div>
        </section>

        {vote.coverImageUrl ? (
          <section className="border-t border-slate-200 pt-10">
            <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
              <img
                src={vote.coverImageUrl}
                alt={vote.coverImageAlt ?? vote.title}
                className="h-72 w-full object-cover md:h-[28rem]"
              />
            </div>
          </section>
        ) : null}

        <section className="border-t border-slate-200 pt-10">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Consultation details
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Key information
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
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
                      : 'Unknown'
                  }
                />
                <InfoCard title="Starts" value={formatDateTime(vote.startAt)} />
                <InfoCard title="Ends" value={formatDateTime(vote.endAt)} />
                <InfoCard
                  title="Published"
                  value={
                    vote.publishedAt
                      ? formatDateTime(vote.publishedAt)
                      : 'Not published'
                  }
                />
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Available options
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Review the choices
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Read through the available consultation options before you move
                to the participation section below.
              </p>

              <div className="mt-5 grid gap-4">
                {vote.options.map((option, index) => (
                  <div
                    key={option.id}
                    className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex shrink-0 items-center gap-2">
                        {showNeutralDots ? (
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                NEUTRAL_OPTION_COLORS[
                                  index % NEUTRAL_OPTION_COLORS.length
                                ],
                            }}
                            aria-label={`Option color for option ${option.displayOrder}`}
                          />
                        ) : (
                          <>
                            {showRawDots ? (
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                  backgroundColor:
                                    RAW_OPTION_COLORS[
                                      index % RAW_OPTION_COLORS.length
                                    ],
                                }}
                                aria-label={`Option color for option ${option.displayOrder}`}
                              />
                            ) : null}

                            {showWeightedDots ? (
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                  backgroundColor:
                                    WEIGHTED_OPTION_COLORS[
                                      index % WEIGHTED_OPTION_COLORS.length
                                    ],
                                }}
                                aria-label={`Option color for option ${option.displayOrder}`}
                              />
                            ) : null}
                          </>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Option {option.displayOrder}
                        </p>
                        <p className="mt-2 break-words text-sm leading-6 text-slate-900">
                          {option.optionText}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10">
          <ConsultationInteractions vote={vote} />
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200 min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}

function OverviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0 min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-900">
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

function deriveStatusTone(
  status:
    | 'UPCOMING'
    | 'ONGOING'
    | 'PAST'
    | 'CANCELLED'
    | 'ARCHIVED'
    | undefined,
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
