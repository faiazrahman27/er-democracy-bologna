import Link from 'next/link';
import { fetchPublicVotes } from '@/lib/votes';
import { formatDateTime, formatEnumLabel } from '@/lib/format';
import { ConsultationsHeroActions } from './consultations-hero-actions';

export default async function ConsultationsPage() {
  const response = await fetchPublicVotes();

  const totalCount = response.votes.length;
  const ongoingCount = response.votes.filter(
    (vote) => vote.derivedStatus === 'ONGOING',
  ).length;
  const upcomingCount = response.votes.filter(
    (vote) => vote.derivedStatus === 'UPCOMING',
  ).length;
  const pastCount = response.votes.filter(
    (vote) => vote.derivedStatus === 'PAST',
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <section className="pb-12">
          <div className="mb-8 h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Public Consultations
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                Open and published consultations
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Browse consultations, review methodologies, and explore
                structured participation opportunities across civic topics with
                transparent, privacy-conscious public access.
              </p>

              <div className="mt-8">
                <ConsultationsHeroActions />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="Total published" value={String(totalCount)} />
              <StatCard label="Ongoing" value={String(ongoingCount)} highlight />
              <StatCard label="Upcoming" value={String(upcomingCount)} />
              <StatCard label="Past" value={String(pastCount)} muted />
            </div>
          </div>
        </section>

        {response.votes.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">No consultations available</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              There are currently no published consultations to display.
            </p>
          </section>
        ) : (
          <section className="border-t border-slate-200 pt-10">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Consultation list
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Explore active and recent public consultations
              </h2>
            </div>

            <div className="grid gap-5">
              {response.votes.map((vote) => (
                <Link
                  key={vote.id}
                  href={`/consultations/${vote.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  {vote.coverImageUrl ? (
                    <div className="overflow-hidden border-b border-slate-100 bg-slate-100">
                      <img
                        src={vote.coverImageUrl}
                        alt={vote.coverImageAlt ?? vote.title}
                        className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : null}

                  <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge label={formatEnumLabel(vote.voteType)} />
                        <StatusBadge label={vote.topicCategory} tone="muted" />
                        <StatusBadge
                          label={vote.derivedStatus ?? 'Unknown'}
                          tone={deriveStatusTone(vote.derivedStatus)}
                        />
                      </div>

                      <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 transition-colors duration-200 group-hover:text-slate-700">
                        {vote.title}
                      </h3>

                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                        {vote.summary}
                      </p>

                      <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 xl:grid-cols-4">
                        <InfoTile
                          label="Starts"
                          value={formatDateTime(vote.startAt)}
                        />
                        <InfoTile
                          label="Ends"
                          value={formatDateTime(vote.endAt)}
                        />
                        <InfoTile
                          label="Status"
                          value={vote.derivedStatus ?? 'Unknown'}
                        />
                        <InfoTile
                          label="Topic"
                          value={vote.topicCategory}
                        />
                      </div>
                    </div>

                    <div className="flex items-center border-t border-slate-100 bg-slate-50 px-6 py-5 lg:border-l lg:border-t-0 lg:bg-slate-50/70">
                      <span className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 group-hover:bg-slate-800 group-hover:shadow-md">
                        Open consultation →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-5 shadow-sm ${
        highlight
          ? 'border-green-200 bg-green-50'
          : muted
          ? 'border-slate-200 bg-slate-100'
          : 'border-slate-200 bg-white'
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

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{value}</p>
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

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${toneClass}`}>
      {label}
    </span>
  );
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
  if (status === 'ONGOING') return 'success';
  if (status === 'UPCOMING') return 'warning';
  if (status === 'CANCELLED') return 'danger';
  return 'muted';
}
