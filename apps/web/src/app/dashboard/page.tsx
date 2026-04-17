'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { isAdminRole } from '@/lib/roles';
import { apiRequest } from '@/lib/api';

type ExportMyDataResponse = {
  message: string;
  data: unknown;
};

type DeleteMyAccountResponse = {
  message: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading, logout } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [accountActionError, setAccountActionError] = useState<string | null>(
    null,
  );
  const [accountActionMessage, setAccountActionMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
      return;
    }

    if (!isLoading && user && isAdminRole(user.role)) {
      router.replace('/admin');
    }
  }, [isLoading, user, router]);

  async function handleLogout() {
    setAccountActionError(null);
    setAccountActionMessage(null);
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace('/login');
    } finally {
      setIsLoggingOut(false);
    }
  }

  function isAuthenticationError(message: string) {
    const normalizedMessage = message.toLowerCase();

    return (
      normalizedMessage.includes('unauthorized') ||
      normalizedMessage.includes('token') ||
      normalizedMessage.includes('inactive') ||
      normalizedMessage.includes('no longer exists')
    );
  }

  async function redirectToLoginAfterAuthFailure(
    message = 'Your session has expired. Please sign in again.',
  ) {
    setAccountActionError(message);
    setAccountActionMessage(null);
    await logout();
    router.replace('/login');
  }

  async function handleExportMyData() {
    setAccountActionError(null);
    setAccountActionMessage(null);
    setIsExportingData(true);

    try {
      if (!token) {
        await redirectToLoginAfterAuthFailure();
        return;
      }

      const response = await apiRequest<ExportMyDataResponse>(
        '/users/me/export-data',
        {
          method: 'GET',
          token,
        },
      );

      const fileContent = JSON.stringify(response.data, null, 2);
      const blob = new Blob([fileContent], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `er-democracy-bologna-my-data-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setAccountActionMessage(
        response.message || 'Your personal data export is ready.',
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to export your data';

      if (isAuthenticationError(message)) {
        await redirectToLoginAfterAuthFailure();
        return;
      }

      setAccountActionError(message);
    } finally {
      setIsExportingData(false);
    }
  }

  async function handleDeleteMyAccount() {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
    );

    if (!confirmed) {
      return;
    }

    const secondConfirmation = window.prompt(
      'To confirm permanent deletion, type DELETE below.',
    );

    if (secondConfirmation !== 'DELETE') {
      setAccountActionError(
        'Account deletion was cancelled because confirmation did not match.',
      );
      return;
    }

    setAccountActionError(null);
    setAccountActionMessage(null);
    setIsDeletingAccount(true);

    try {
      if (!token) {
        await redirectToLoginAfterAuthFailure();
        return;
      }

      const response = await apiRequest<DeleteMyAccountResponse>('/users/me', {
        method: 'DELETE',
        token,
      });

      setAccountActionMessage(
        response.message || 'Your account has been permanently deleted.',
      );

      await logout();
      router.replace('/register');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete your account';

      if (isAuthenticationError(message)) {
        await redirectToLoginAfterAuthFailure();
        return;
      }

      setAccountActionError(message);
    } finally {
      setIsDeletingAccount(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-slate-600">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (!user || isAdminRole(user.role)) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <section className="pb-10">
          <div className="mb-8 h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                User Dashboard
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight break-all md:text-5xl">
                Welcome back, {user.fullName}.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Manage your account, continue your participation journey, and
                access consultations and assessment tools from one place.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/consultations"
                  className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md"
                >
                  Browse consultations
                </Link>

                <Link
                  href="/assessment"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
                >
                  Open assessment
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut || isDeletingAccount}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md disabled:opacity-60"
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
              <StatCard label="Role" value={user.role} />
              <StatCard label="Assessment" value="Available" muted />
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-10">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Participation
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Your next civic steps
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                Use your dashboard to move quickly into active consultations,
                complete your assessment profile, and stay ready for structured
                participation.
              </p>

              <div className="mt-6 grid gap-3">
                <ActionStrip
                  title="Browse consultations"
                  description="Explore current and published consultation opportunities."
                  href="/consultations"
                  hrefLabel="Open consultations"
                  highlight
                />
                <ActionStrip
                  title="Complete your assessment"
                  description="Prepare your participation profile for specialized consultations."
                  href="/assessment"
                  hrefLabel="Open assessment"
                />
                <ActionStrip
                  title="Read supporting content"
                  description="Review articles and public-facing explanatory content."
                  href="/articles"
                  hrefLabel="Read articles"
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Account
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Account details
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
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-10">
          <div className="grid gap-6 md:grid-cols-3">
            <QuickLinkCard
              title="Consultations"
              description="Explore current and published public consultations."
              href="/consultations"
              linkLabel="Browse consultations"
            />

            <QuickLinkCard
              title="Assessment"
              description="Complete or revisit your assessment profile."
              href="/assessment"
              linkLabel="Open assessment"
            />

            <QuickLinkCard
              title="Articles"
              description="Read public-facing explanations and institutional content."
              href="/articles"
              linkLabel="Read articles"
            />
          </div>
        </section>

        <section className="border-t border-slate-200 pt-10">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Participation guidance
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Build a stronger participation profile
            </h2>

            <div className="mt-4 grid gap-6 md:grid-cols-3">
              <GuidanceItem
                title="1. Review consultations"
                description="Start by exploring open and published consultations to understand current participation opportunities."
              />
              <GuidanceItem
                title="2. Complete assessment"
                description="Your assessment profile supports specialized consultations and more relevant governance workflows."
              />
              <GuidanceItem
                title="3. Stay ready to participate"
                description="Once your profile is ready, you can move faster through consultation flows and related public tools."
              />
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-10">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Privacy and account rights
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Manage your personal data
            </h2>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              You can export a copy of your personal data or permanently delete
              your account. Deleting your account will remove your access and
              cannot be undone.
            </p>

            {accountActionMessage ? (
              <p className="mt-4 text-sm text-green-700">
                {accountActionMessage}
              </p>
            ) : null}

            {accountActionError ? (
              <p className="mt-4 text-sm text-red-600">{accountActionError}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-4">
              <button
                onClick={handleExportMyData}
                disabled={isExportingData || isDeletingAccount}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md disabled:opacity-60"
              >
                {isExportingData ? 'Preparing export...' : 'Export my data'}
              </button>

              <button
                onClick={handleDeleteMyAccount}
                disabled={isDeletingAccount || isExportingData || isLoggingOut}
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md disabled:opacity-60"
              >
                {isDeletingAccount
                  ? 'Deleting account...'
                  : 'Delete my account'}
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Legal information
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Learn more in our{' '}
                <Link
                  href="/privacy"
                  className="font-medium text-slate-900 underline underline-offset-2 hover:text-green-700"
                >
                  Privacy Policy
                </Link>
                ,{' '}
                <Link
                  href="/terms"
                  className="font-medium text-slate-900 underline underline-offset-2 hover:text-red-600"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="/cookies"
                  className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
                >
                  Cookie Policy
                </Link>
                .
              </p>
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
        className={`mt-2 text-xl font-semibold break-all ${
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
      <p className="mt-2 text-sm font-medium leading-6 text-slate-900 break-all">
        {value}
      </p>
    </div>
  );
}

function QuickLinkCard({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
      <div className="mt-5">
        <Link
          href={href}
          className="text-sm font-semibold text-green-700 transition hover:text-green-800"
        >
          {linkLabel} →
        </Link>
      </div>
    </div>
  );
}

function ActionStrip({
  title,
  description,
  href,
  hrefLabel,
  highlight,
}: {
  title: string;
  description: string;
  href: string;
  hrefLabel: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-4 ring-1 ${
        highlight ? 'bg-green-50 ring-green-200' : 'bg-slate-50 ring-slate-200'
      }`}
    >
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4">
        <Link
          href={href}
          className={`text-sm font-semibold transition ${
            highlight
              ? 'text-green-700 hover:text-green-800'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          {hrefLabel} →
        </Link>
      </div>
    </div>
  );
}

function GuidanceItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}
