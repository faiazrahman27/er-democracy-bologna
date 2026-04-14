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
    const upcoming = votes.filter((vote) => vote.derivedStatus === 'UPCOMING').length;
    const ongoing = votes.filter((vote) => vote.derivedStatus === 'ONGOING').length;
    const past = votes.filter((vote) => vote.derivedStatus === 'PAST').length;
    const drafts = votes.filter((vote) => vote.status === 'DRAFT').length;

    return {
      total,
      upcoming,
      ongoing,
      past,
      drafts,
    };
  }, [votes]);

  if (isLoading || pageLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">Loading consultations...</p>
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
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <section className="pb-10">
          <div className="mb-8 h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Consultation administration
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                Consultation management
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                Review consultations, monitor workflow state, open public and
                administrative views, and move into the next operational step.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
                >
                  ← Back to admin
                </Link>

                {canCreateConsultation ? (
                  <Link
                    href="/admin/votes"
                    className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md"
                  >
                    Create consultation
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                label="Total listed"
                value={String(consultationStats.total)}
              />
              <StatCard
                label="Drafts"
                value={String(consultationStats.drafts)}
                muted
              />
              <StatCard
                label="Upcoming"
                value={String(consultationStats.upcoming)}
              />
              <StatCard
                label="Ongoing"
                value={String(consultationStats.ongoing)}
                highlight
              />
              <StatCard
                label="Past"
                value={String(consultationStats.past)}
              />
            </div>
          </div>
        </section>

        {pageError ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        ) : null}

        {votes.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold">No consultations found</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              There are currently no consultations to display in this list.
            </p>

            {canCreateConsultation ? (
              <div className="mt-6">
                <Link
                  href="/admin/votes"
                  className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md"
                >
                  Create consultation
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-6">
            {votes.map((vote) => (
              <article
                key={vote.id}
                className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-200 hover:shadow-md"
              >
                {vote.coverImageUrl ? (
                  <div className="overflow-hidden border-b border-slate-100 bg-slate-100">
                    <img
                      src={vote.coverImageUrl}
                      alt={vote.coverImageAlt ?? vote.title}
                      className="h-56 w-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <StatusBadge label={formatEnumLabel(vote.voteType)} />
                        <StatusBadge label={vote.topicCategory} tone="muted" />
                        <StatusBadge
                          label={vote.status}
                          tone={deriveWorkflowTone(vote.status)}
                        />
                        <StatusBadge
                          label={vote.derivedStatus ?? 'Unknown'}
                          tone={deriveStatusTone(vote.derivedStatus)}
                        />
                        <StatusBadge
                          label={vote.isPublished ? 'Published' : 'Unpublished'}
                          tone={vote.isPublished ? 'success' : 'warning'}
                        />
                      </div>

                      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
                        {vote.title}
                      </h2>

                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                        {vote.summary}
                      </p>

                      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <InfoTile
                          label="Starts"
                          value={formatDateTime(vote.startAt)}
                        />
                        <InfoTile
                          label="Ends"
                          value={formatDateTime(vote.endAt)}
                        />
                        <InfoTile
                          label="Derived status"
                          value={vote.derivedStatus ?? 'Unknown'}
                        />
                        <InfoTile
                          label="Workflow status"
                          value={vote.status}
                        />
                        <InfoTile
                          label="Submissions"
                          value={String(vote.submissionCount ?? 0)}
                        />
                      </div>
                    </div>

                    <div className="flex w-full flex-wrap gap-3 sm:w-auto sm:flex-col sm:items-stretch">
                      <Link
                        href={`/consultations/${vote.slug}`}
                        className="inline-flex justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
                      >
                        Open public view
                      </Link>

                      {canViewAdminDetail ? (
                        <Link
                          href={`/admin/consultations/${vote.slug}`}
                          className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
                        >
                          Open admin detail
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
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
      className={`rounded-2xl px-4 py-4 shadow-sm ring-1 ${
        highlight
          ? 'bg-green-50 ring-green-200'
          : muted
          ? 'bg-slate-100 ring-slate-200'
          : 'bg-white ring-slate-200'
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
    <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
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
