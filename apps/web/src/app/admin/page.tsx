'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { isAdminRole } from '@/lib/roles';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
      return;
    }

    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router]);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace('/login');
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-slate-600">Loading admin dashboard...</p>
        </div>
      </main>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  const userRole = user.role;

  const canCreateConsultation = hasPermission(
    userRole,
    PERMISSIONS.CONSULTATION_CREATE,
  );
  const canViewConsultations = hasPermission(
    userRole,
    PERMISSIONS.CONSULTATION_VIEW_ADMIN,
  );
  const canViewArticles = hasPermission(
    userRole,
    PERMISSIONS.ARTICLE_VIEW_ADMIN,
  );
  const canCreateArticles = hasPermission(
    userRole,
    PERMISSIONS.ARTICLE_CREATE,
  );
  const canLookupAssessment = hasPermission(
    userRole,
    PERMISSIONS.ASSESSMENT_SECRET_LOOKUP,
  );
  const canViewParticipants = hasPermission(
    userRole,
    PERMISSIONS.PARTICIPANTS_VIEW_ADMIN,
  );
  const canViewAnalytics = hasPermission(
    userRole,
    PERMISSIONS.ANALYTICS_VIEW_ADMIN,
  );
  const canViewResults = hasPermission(
    userRole,
    PERMISSIONS.RESULTS_VIEW_ADMIN,
  );
  const canUploadMedia = hasPermission(
    userRole,
    PERMISSIONS.MEDIA_UPLOAD,
  );

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <section className="pb-10">
          <div className="mb-8 h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Administration
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                Admin Dashboard
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Welcome back, {user.fullName}. Manage consultations, oversee
                participation workflows, review permissions, and access core
                administrative tools from one place.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/assessment"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
                >
                  Open my assessment
                </Link>

                {canViewConsultations ? (
                  <Link
                    href="/admin/consultations"
                    className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md"
                  >
                    Manage consultations
                  </Link>
                ) : null}

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md disabled:opacity-60"
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="Role" value={user.role} />
              <StatCard
                label="Email status"
                value={user.emailVerified ? 'Verified' : 'Not verified'}
                highlight={user.emailVerified}
              />
              <StatCard
                label="Account status"
                value={user.isActive ? 'Active' : 'Inactive'}
                highlight={user.isActive}
              />
              <StatCard label="Admin access" value="Enabled" muted />
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Account
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Admin details
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoCard title="Full name" value={user.fullName} />
                <InfoCard title="Email" value={user.email} />
                <InfoCard title="Role" value={user.role} />
                <InfoCard
                  title="Email verified"
                  value={user.emailVerified ? 'Yes' : 'No'}
                />
                <InfoCard title="Active" value={user.isActive ? 'Yes' : 'No'} />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {canCreateConsultation ? (
                  <Link
                    href="/admin/votes"
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
                  >
                    Create consultation
                  </Link>
                ) : null}

                {canViewArticles ? (
                  <Link
                    href="/admin/articles"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
                  >
                    Manage articles
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Quick actions
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Admin shortcuts
              </h2>

              <div className="mt-6 grid gap-3">
                {canViewConsultations ? (
                  <QuickActionLink
                    href="/admin/consultations"
                    title="Consultation management"
                    description="Review, edit, and administer consultations."
                  />
                ) : null}

                {canCreateConsultation ? (
                  <QuickActionLink
                    href="/admin/votes"
                    title="Create consultation"
                    description="Start a new consultation workflow."
                  />
                ) : null}

                {canViewArticles ? (
                  <QuickActionLink
                    href="/admin/articles"
                    title="Article management"
                    description="Maintain public-facing articles and content."
                  />
                ) : null}

                <QuickActionLink
                  href="/assessment"
                  title="My assessment"
                  description="Open your personal assessment profile."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Permission summary
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Current access
              </h2>

              <div className="mt-6 grid gap-3">
                <PermissionRow
                  label="Consultation creation"
                  allowed={canCreateConsultation}
                />
                <PermissionRow
                  label="Consultation management"
                  allowed={canViewConsultations}
                />
                <PermissionRow
                  label="Article management"
                  allowed={canViewArticles}
                />
                <PermissionRow
                  label="Article creation"
                  allowed={canCreateArticles}
                />
                <PermissionRow
                  label="Results access"
                  allowed={canViewResults}
                />
                <PermissionRow
                  label="Analytics access"
                  allowed={canViewAnalytics}
                />
                <PermissionRow
                  label="Participant access"
                  allowed={canViewParticipants}
                />
                <PermissionRow
                  label="Secret assessment lookup"
                  allowed={canLookupAssessment}
                />
                <PermissionRow
                  label="Media upload"
                  allowed={canUploadMedia}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Platform status
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Current system overview
              </h2>

              <div className="mt-6 grid gap-3">
                <StatusRow label="Authentication" status="Active" />
                <StatusRow label="Role system" status="Active" />
                <StatusRow label="Assessment module" status="Active" />
                <StatusRow label="Vote creation and submission" status="Active" />
                <StatusRow label="Results and analytics routes" status="Active" />
                <StatusRow label="Audit logging" status="Active" />
                <StatusRow label="Article module" status="Active" />
              </div>
            </div>
          </div>
        </section>
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
      className={`rounded-2xl px-4 py-5 shadow-sm ring-1 ${
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
        className={`mt-2 text-xl font-semibold ${
          highlight ? 'text-green-700' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
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
    <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}

function QuickActionLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-sm"
    >
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </Link>
  );
}

function PermissionRow({
  label,
  allowed,
}: {
  label: string;
  allowed: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <p className="text-sm text-slate-700">{label}</p>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          allowed
            ? 'bg-green-100 text-green-700'
            : 'bg-slate-200 text-slate-600'
        }`}
      >
        {allowed ? 'Allowed' : 'Not allowed'}
      </span>
    </div>
  );
}

function StatusRow({
  label,
  status,
  muted,
}: {
  label: string;
  status: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <p className="text-sm text-slate-700">{label}</p>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          muted
            ? 'bg-amber-100 text-amber-700'
            : 'bg-green-100 text-green-700'
        }`}
      >
        {status}
      </span>
    </div>
  );
}
