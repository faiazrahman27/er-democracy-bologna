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
      <main className="min-h-screen bg-white px-6 py-16 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-slate-500">
            Loading admin dashboard...
          </p>
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
  const canUploadMedia = hasPermission(userRole, PERMISSIONS.MEDIA_UPLOAD);

  const permissions = [
    ['Consultation creation', canCreateConsultation],
    ['Consultation management', canViewConsultations],
    ['Article management', canViewArticles],
    ['Article creation', canCreateArticles],
    ['Results access', canViewResults],
    ['Analytics access', canViewAnalytics],
    ['Participant access', canViewParticipants],
    ['Secret assessment lookup', canLookupAssessment],
    ['Media upload', canUploadMedia],
  ] as const;

  const systemStatus = [
    'Authentication',
    'Role system',
    'Assessment module',
    'Vote creation and submission',
    'Results and analytics routes',
    'Audit logging',
    'Article module',
  ];

  const enabledPermissions = permissions.filter(([, allowed]) => allowed).length;

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <section className="px-5 py-10 sm:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <section className="relative mt-10 overflow-hidden border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.06)] transition duration-300 active:scale-[0.997] md:hover:shadow-[0_28px_90px_rgba(15,23,42,0.09)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-600 via-white to-red-600" />

            <div className="relative grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="min-w-0 px-5 py-8 sm:px-8 md:px-10 md:py-12">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Administration
                </p>

                <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                  Administrative workspace
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
                  Welcome back,{' '}
                  <span className="border-b-2 border-green-600 bg-green-50 px-1.5 py-0.5 font-black text-slate-950">
                    {user.fullName}
                  </span>
                  . Coordinate consultations, articles, access, and review work
                  from one focused space.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-red-500 hover:text-red-700 hover:shadow-md active:-translate-y-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              </div>

              <aside className="min-w-0 border-t border-slate-200 bg-white px-5 py-7 sm:px-8 lg:border-l lg:border-t-0 lg:px-8 lg:py-12">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                      Session state
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Current access for this admin session.
                    </p>
                  </div>

                  <span className="w-fit shrink-0 border border-green-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-green-700">
                    Active
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  <SessionLine label="Role" value={user.role} />
                  <SessionLine
                    label="Email"
                    value={user.emailVerified ? 'Verified' : 'Not verified'}
                    positive={user.emailVerified}
                  />
                  <SessionLine
                    label="Account"
                    value={user.isActive ? 'Active' : 'Inactive'}
                    positive={user.isActive}
                  />
                  <SessionLine label="Admin access" value="Enabled" positive />
                </div>
              </aside>
            </div>
          </section>

          <section className="mt-11">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Work routes
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950 md:text-4xl">
                  Continue the work
                </h2>
              </div>

              <p className="max-w-md text-sm leading-6 text-slate-500">
                Core admin paths, shown once, with enough breathing room to stay
                usable on every screen.
              </p>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {canViewConsultations ? (
                <ActionPath
                  href="/admin/consultations"
                  eyebrow="Consultations"
                  title="Manage consultations"
                  description="Review, edit, and administer active consultation work."
                  accent="tricolor"
                />
              ) : null}

              {canCreateConsultation ? (
                <ActionPath
                  href="/admin/votes"
                  eyebrow="Creation"
                  title="Create consultation"
                  description="Start a new consultation workflow from the admin side."
                  accent="tricolor"
                />
              ) : null}

              {canViewArticles ? (
                <ActionPath
                  href="/admin/articles"
                  eyebrow="Articles"
                  title="Manage articles"
                  description="Maintain the public content that supports the platform."
                  accent="tricolor"
                />
              ) : null}

              <ActionPath
                href="/assessment"
                eyebrow="Profile"
                title="My assessment"
                description="Open your personal assessment profile and review status."
                accent="tricolor"
              />
            </div>
          </section>

          <section className="mt-12 grid gap-8 lg:grid-cols-[0.84fr_1.16fr]">
            <div className="min-w-0 border-t border-slate-200 pt-8">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                Identity
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">
                Admin profile
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                Signed in as{' '}
                <span className="border-b-2 border-green-600 font-black text-slate-950">
                  {user.fullName}
                </span>
                . This identity is currently operating the workspace.
              </p>

              <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                <DetailLine label="Full name" value={user.fullName} />
                <DetailLine label="Email" value={user.email} />
                <DetailLine label="Role" value={user.role} />
                <DetailLine
                  label="Email verified"
                  value={user.emailVerified ? 'Yes' : 'No'}
                />
                <DetailLine
                  label="Active"
                  value={user.isActive ? 'Yes' : 'No'}
                />
              </div>
            </div>

            <div className="min-w-0 border-t border-slate-200 pt-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                    Access map
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">
                    Permissions in use
                  </h2>
                </div>

                <p className="text-sm font-black text-green-700">
                  {enabledPermissions}/{permissions.length} enabled
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {permissions.map(([label, allowed]) => (
                  <PermissionPill
                    key={label}
                    label={label}
                    allowed={allowed}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="mt-12 border-t border-slate-200 pt-8">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Platform status
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">
                  System overview
                </h2>

                <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
                  A compact readout of the platform areas available from this
                  admin workspace.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {systemStatus.map((label) => (
                  <StatusPill key={label} label={label} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function SessionLine({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="group flex min-w-0 items-center justify-between gap-5 border-b border-slate-200 pb-4 transition duration-200 hover:border-slate-400 active:border-slate-400">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>

      <p
        className={`min-w-0 break-words text-right text-base font-black tracking-[-0.03em] transition duration-200 group-hover:translate-x-1 group-active:translate-x-1 ${
          positive ? 'text-green-700' : 'text-slate-950'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function DetailLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-2 py-4 transition duration-200 hover:bg-slate-50 active:bg-slate-50 sm:grid-cols-[150px_1fr] sm:gap-6">
      <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>

      <p className="min-w-0 break-words text-sm font-bold leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ActionPath({
  href,
  eyebrow,
  title,
  description,
  accent,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  accent: 'tricolor';
}) {
  return (
    <Link
      href={href}
      className="group relative min-w-0 cursor-pointer overflow-hidden border border-slate-200 bg-white px-5 py-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-xl active:-translate-y-1 active:scale-[0.985] active:border-slate-300 active:bg-white active:shadow-lg"
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-green-600 via-white to-red-600 transition duration-300 group-hover:w-1.5 group-active:w-2" />

      <div className="flex min-w-0 items-start justify-between gap-4 pl-2">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-slate-500">
            {eyebrow}
          </p>

          <h3 className="mt-4 text-xl font-black tracking-[-0.04em] text-slate-950">
            {title}
          </h3>
        </div>

        <span className="shrink-0 text-xl font-black text-slate-400 transition duration-300 group-hover:translate-x-1 group-hover:text-slate-700 group-active:translate-x-1 group-active:text-slate-700">
          →
        </span>
      </div>

      <p className="mt-4 pl-2 text-sm leading-7 text-slate-600">
        {description}
      </p>
    </Link>
  );
}

function PermissionPill({
  label,
  allowed,
}: {
  label: string;
  allowed: boolean;
}) {
  return (
    <div className="group flex min-w-0 cursor-default items-center justify-between gap-4 border border-slate-200 bg-white px-4 py-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:-translate-y-0.5 active:border-slate-300 active:bg-white active:shadow-md">
      <p className="min-w-0 text-sm font-bold text-slate-700">{label}</p>

      <span
        className={`shrink-0 text-xs font-black uppercase tracking-[0.13em] transition duration-200 group-hover:scale-105 group-active:scale-105 ${
          allowed ? 'text-green-700' : 'text-red-500'
        }`}
      >
        {allowed ? 'Allowed' : 'Locked'}
      </span>
    </div>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <div className="group flex min-w-0 cursor-default items-center justify-between gap-4 border border-slate-200 bg-white px-4 py-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:-translate-y-0.5 active:border-slate-300 active:bg-white active:shadow-md">
      <p className="min-w-0 text-sm font-bold text-slate-700">{label}</p>

      <span className="shrink-0 text-xs font-black uppercase tracking-[0.13em] text-green-700 transition duration-200 group-hover:scale-105 group-active:scale-105">
        Active
      </span>
    </div>
  );
}