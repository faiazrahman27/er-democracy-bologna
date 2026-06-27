'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { fetchAdminVotes } from '@/lib/admin-votes';
import { isAdminRole } from '@/lib/roles';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { formatDateTime, formatEnumLabel } from '@/lib/format';
import type { AdminVoteListItem } from '@/lib/admin-votes';

export default function AdminConsultationsPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [votes, setVotes] = useState<AdminVoteListItem[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?redirectTo=/admin/consultations');
      return;
    }

    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    async function loadVotes() {
      if (!token) {
        setPageLoading(false);
        return;
      }

      try {
        const response = await fetchAdminVotes(token);
        setVotes(response.votes);
      } catch (err) {
        setPageError(
          err instanceof Error ? err.message : 'Failed to load consultations',
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
      void loadVotes();
    } else if (user) {
      setPageLoading(false);
    }
  }, [user, token]);

  const consultationStats = useMemo(() => {
    const total = votes.length;
    const upcoming = votes.filter(
      (vote) => vote.derivedStatus === 'UPCOMING',
    ).length;
    const ongoing = votes.filter(
      (vote) => vote.derivedStatus === 'ONGOING',
    ).length;
    const past = votes.filter((vote) => vote.derivedStatus === 'PAST').length;
    const drafts = votes.filter((vote) => vote.status === 'DRAFT').length;
    const published = votes.filter((vote) => vote.isPublished).length;

    return {
      total,
      upcoming,
      ongoing,
      past,
      drafts,
      published,
    };
  }, [votes]);

  if (isLoading || pageLoading) {
    return (
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="border-y border-slate-200 py-6">
            <p className="text-sm font-medium text-slate-500">
              Loading consultations...
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
            You do not have permission to view admin consultations.
          </div>
        </div>
      </main>
    );
  }

  const canCreateConsultation = hasPermission(
    user.role,
    PERMISSIONS.CONSULTATION_CREATE,
  );

  const canViewAdminDetail = hasPermission(
    user.role,
    PERMISSIONS.CONSULTATION_VIEW_ADMIN,
  );

  const pageCopy = getConsultationPageCopy(canCreateConsultation);

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <section className="px-5 py-10 sm:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <section className="mt-10">
            <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Consultation administration
                </p>

                <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                  {pageCopy.title}
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
                  {pageCopy.summary}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/admin"
                    className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98] sm:w-auto"
                  >
                    ← Back to admin
                  </Link>

                  {canCreateConsultation ? (
                    <Link
                      href="/admin/votes"
                      className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-500 hover:text-green-700 hover:shadow-md active:-translate-y-1 active:scale-[0.98] sm:w-auto"
                    >
                      Create consultation
                    </Link>
                  ) : null}
                </div>
              </div>

              <aside className="border-y border-slate-200 py-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  List overview
                </p>

                <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                  <OverviewStat
                    label="Total"
                    value={String(consultationStats.total)}
                  />
                  <OverviewStat
                    label="Published"
                    value={String(consultationStats.published)}
                    positive
                  />
                  <OverviewStat
                    label="Drafts"
                    value={String(consultationStats.drafts)}
                  />
                  <OverviewStat
                    label="Upcoming"
                    value={String(consultationStats.upcoming)}
                  />
                  <OverviewStat
                    label="Ongoing"
                    value={String(consultationStats.ongoing)}
                    positive
                  />
                  <OverviewStat
                    label="Past"
                    value={String(consultationStats.past)}
                  />
                </div>
              </aside>
            </div>
          </section>

          {pageError ? (
            <div className="mt-8 border-y border-red-200 py-4 text-sm font-bold text-red-700">
              {pageError}
            </div>
          ) : null}

          {votes.length === 0 ? (
            <section className="mt-12 border-y border-slate-200 py-8">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                Consultation list
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">
                No consultations found
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                There are currently no consultations visible in this admin list.
              </p>

              {canCreateConsultation ? (
                <div className="mt-6">
                  <Link
                    href="/admin/votes"
                    className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-500 hover:text-green-700 hover:shadow-md active:-translate-y-1 active:scale-[0.98] sm:w-auto"
                  >
                    Create consultation
                  </Link>
                </div>
              ) : null}
            </section>
          ) : (
            <section className="mt-12 border-t border-slate-200 pt-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                    Consultation list
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950 md:text-4xl">
                    Review consultations
                  </h2>
                </div>

                <p className="max-w-md text-sm leading-6 text-slate-500">
                  Title, summary, timing, workflow, and actions stay clear
                  without adding heavy dashboard boxes.
                </p>
              </div>

              <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
                {votes.map((vote) => (
                  <ConsultationRecord
                    key={vote.id}
                    vote={vote}
                    canViewAdminDetail={canViewAdminDetail}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function getConsultationPageCopy(canCreateConsultation: boolean) {
  if (canCreateConsultation) {
    return {
      title: 'Consultation workspace',
      summary:
        'Create, review, and manage consultation records in a clear admin view that keeps each record readable.',
    };
  }

  return {
    title: 'Consultation review',
    summary:
      'Review consultation records available to your role. Creation controls stay hidden because this account is scoped for review, not setup.',
  };
}

function ConsultationRecord({
  vote,
  canViewAdminDetail,
}: {
  vote: AdminVoteListItem;
  canViewAdminDetail: boolean;
}) {
  const statusBadges = getConsultationStatusBadges(vote);

  return (
    <article className="group px-4 py-8 transition duration-300 hover:bg-slate-50/70 active:bg-slate-50 sm:px-6 lg:px-8">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={formatEnumLabel(vote.voteType)} />
            <StatusBadge
              label={formatEnumLabel(vote.topicCategory)}
              tone="muted"
            />
            {statusBadges.map((badge) => (
              <StatusBadge
                key={`${vote.id}-${badge.label}`}
                label={badge.label}
                tone={badge.tone}
              />
            ))}
          </div>

          <h3 className="mt-5 max-w-4xl break-words text-2xl font-black tracking-[-0.045em] text-slate-950 md:text-3xl">
            {vote.title}
          </h3>

          <p className="mt-4 max-w-3xl break-words text-sm leading-7 text-slate-600 md:text-base">
            {vote.summary}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <InfoBlock label="Starts" value={formatDateTime(vote.startAt)} />
            <InfoBlock label="Ends" value={formatDateTime(vote.endAt)} />
            <InfoBlock
              label="Timing"
              value={
                vote.derivedStatus
                  ? formatEnumLabel(vote.derivedStatus)
                  : 'Unknown'
              }
            />
            <InfoBlock label="Workflow" value={formatEnumLabel(vote.status)} />
            <InfoBlock
              label="Submissions"
              value={String(vote.submissionCount ?? 0)}
            />
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ActionButton
              href={`/consultations/${vote.slug}`}
              label="Open public view"
              emphasis="green"
            />

            {canViewAdminDetail ? (
              <ActionButton
                href={`/admin/consultations/${vote.slug}`}
                label="Open admin detail"
                emphasis="neutral"
              />
            ) : null}
          </div>
        </div>

        <div className="min-w-0 xl:pt-1">
          {vote.coverImageUrl ? (
            <div className="flex w-full items-center justify-center bg-slate-50 px-5 py-5 transition duration-300 group-hover:bg-white sm:px-6">
              <img
                src={vote.coverImageUrl}
                alt={vote.coverImageAlt ?? vote.title}
                className="block h-auto max-h-[260px] max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="border border-slate-200 px-5 py-7 text-center">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                No preview image
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Open the record to review its full consultation details.
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function OverviewStat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-black tracking-[-0.04em] ${
          positive ? 'text-green-700' : 'text-slate-950'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-t border-slate-200 pt-3">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  href,
  label,
  emphasis,
}: {
  href: string;
  label: string;
  emphasis: 'green' | 'neutral';
}) {
  return (
    <Link
      href={href}
      className={`group/button inline-flex min-h-11 items-center justify-center border bg-white px-4 py-3 text-center text-sm font-black shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md active:-translate-y-1 active:scale-[0.985] ${
        emphasis === 'green'
          ? 'border-slate-300 text-slate-800 hover:border-green-500 hover:text-green-700'
          : 'border-slate-300 text-slate-800 hover:border-slate-500'
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {label}
        <span className="transition duration-200 group-hover/button:translate-x-1 group-active/button:translate-x-1">
          →
        </span>
      </span>
    </Link>
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
      ? 'border-green-200 text-green-700'
      : tone === 'warning'
        ? 'border-amber-200 text-amber-700'
        : tone === 'danger'
          ? 'border-red-200 text-red-600'
          : tone === 'muted'
            ? 'border-slate-200 text-slate-500'
            : 'border-slate-200 text-slate-700';

  return (
    <span
      className={`border bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${toneClass}`}
    >
      {label}
    </span>
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

function getConsultationStatusBadges(
  vote: AdminVoteListItem,
): Array<{
  label: string;
  tone: 'default' | 'muted' | 'success' | 'warning' | 'danger';
}> {
  const badges: Array<{
    label: string;
    tone: 'default' | 'muted' | 'success' | 'warning' | 'danger';
  }> = [];

  const addBadge = (
    label: string,
    tone: 'default' | 'muted' | 'success' | 'warning' | 'danger',
  ) => {
    if (badges.some((badge) => badge.label === label)) {
      return;
    }

    badges.push({ label, tone });
  };

  if (vote.isPublished) {
    addBadge('Published', 'success');
  }

  if (!vote.isPublished || vote.status !== 'PUBLISHED') {
    addBadge(formatEnumLabel(vote.status), deriveWorkflowTone(vote.status));
  }

  const shouldShowTimingStatus =
    vote.status === 'PUBLISHED' &&
    (vote.derivedStatus === 'UPCOMING' ||
      vote.derivedStatus === 'ONGOING' ||
      vote.derivedStatus === 'PAST');

  if (shouldShowTimingStatus) {
    addBadge(
      formatEnumLabel(vote.derivedStatus ?? 'Unknown'),
      deriveStatusTone(vote.derivedStatus),
    );
  }

  return badges;
}