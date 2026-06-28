"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { isAdminRole } from "@/lib/roles";
import { apiRequest } from "@/lib/api";

type ExportMyDataResponse = {
  message: string;
  data: unknown;
};

type DeactivateMyAccountResponse = {
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
      router.replace("/login");
      return;
    }

    if (!isLoading && user && isAdminRole(user.role)) {
      router.replace("/admin");
    }
  }, [isLoading, user, router]);

  async function handleLogout() {
    setAccountActionError(null);
    setAccountActionMessage(null);
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  function isAuthenticationError(message: string) {
    const normalizedMessage = message.toLowerCase();

    return (
      normalizedMessage.includes("unauthorized") ||
      normalizedMessage.includes("token") ||
      normalizedMessage.includes("inactive") ||
      normalizedMessage.includes("no longer exists")
    );
  }

  async function redirectToLoginAfterAuthFailure(
    message = "Your session has expired. Please sign in again.",
  ) {
    setAccountActionError(message);
    setAccountActionMessage(null);
    await logout();
    router.replace("/login");
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
        "/users/me/export-data",
        {
          method: "GET",
          token,
        },
      );

      const fileContent = JSON.stringify(response.data, null, 2);
      const blob = new Blob([fileContent], { type: "application/json" });
      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `er-democracy-bologna-my-data-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setAccountActionMessage(
        response.message || "Your personal data export is ready.",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to export your data";

      if (isAuthenticationError(message)) {
        await redirectToLoginAfterAuthFailure();
        return;
      }

      setAccountActionError(message);
    } finally {
      setIsExportingData(false);
    }
  }

  async function handleDeactivateMyAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate your account? This will remove your access and anonymize identifying data that can be removed.",
    );

    if (!confirmed) {
      return;
    }

    const secondConfirmation = window.prompt(
      "To confirm account deactivation and anonymization, type DEACTIVATE below.",
    );

    if (secondConfirmation !== "DEACTIVATE") {
      setAccountActionError(
        "Account deactivation was cancelled because confirmation did not match.",
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

      const response = await apiRequest<DeactivateMyAccountResponse>(
        "/users/me",
        {
          method: "DELETE",
          token,
        },
      );

      setAccountActionMessage(
        response.message ||
          "Your account has been deactivated and identifying data anonymized.",
      );

      await logout();
      router.replace("/register");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to deactivate your account";

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
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="border-y border-slate-200 py-6">
            <p className="text-sm font-medium text-slate-500">
              Loading dashboard...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!user || isAdminRole(user.role)) {
    return null;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <section className="px-5 py-10 sm:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <header className="mt-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={user.emailVerified ? "Email verified" : "Email not verified"}
                    tone={user.emailVerified ? "success" : "warning"}
                  />
                  <StatusBadge
                    label={user.isActive ? "Account active" : "Account inactive"}
                    tone={user.isActive ? "success" : "muted"}
                  />
                </div>

                <p className="mt-7 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  User dashboard
                </p>

                <h1 className="mt-4 max-w-4xl break-words text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                  Welcome back, {user.fullName}.
                </h1>

                <p className="mt-6 max-w-3xl break-words text-base leading-8 text-slate-600">
                  Continue participation, update your assessment profile, read
                  public content, and manage your account from one place.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/consultations"
                    className="inline-flex min-h-12 w-full items-center justify-center border border-green-500 bg-white px-5 text-sm font-black text-green-700 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-green-50 hover:shadow-md active:-translate-y-1 active:scale-[0.98] sm:w-auto"
                  >
                    Browse consultations
                  </Link>

                  <Link
                    href="/assessment"
                    className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98] sm:w-auto"
                  >
                    Open assessment
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut || isDeletingAccount}
                    className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </div>

              <aside className="border-y border-slate-200 py-5 lg:mt-11">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Account snapshot
                </p>

                <div className="mt-4 grid gap-4">
                  <InfoLine label="Full name" value={user.fullName} />
                  <InfoLine label="Email" value={user.email} />
                  <InfoLine label="Role" value={user.role} />
                </div>
              </aside>
            </div>
          </header>

          <section className="mt-12 border-y border-slate-200 py-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
              <div className="min-w-0">
                <SectionHeader
                  eyebrow="Participation"
                  title="Your next steps"
                  description="Use these actions to move directly into the main participation areas."
                />

                <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
                  <ActionRow
                    title="Browse consultations"
                    description="Explore current and published public consultations."
                    href="/consultations"
                    hrefLabel="Open consultations"
                    highlight
                  />

                  <ActionRow
                    title="Complete your assessment"
                    description="Prepare your participation profile for specialized consultations."
                    href="/assessment"
                    hrefLabel="Open assessment"
                  />

                  <ActionRow
                    title="Read supporting content"
                    description="Review public articles, updates, and explanatory content."
                    href="/articles"
                    hrefLabel="Read articles"
                  />
                </div>
              </div>

              <aside className="min-w-0">
                <SidePanel eyebrow="Account details" title="Your information">
                  <InfoLine label="Email verified" value={user.emailVerified ? "Yes" : "No"} />
                  <InfoLine label="Active" value={user.isActive ? "Yes" : "No"} />
                  <InfoLine label="Assessment" value="Available" />
                </SidePanel>
              </aside>
            </div>
          </section>

          <section className="mt-12 border-t border-slate-200 pt-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
              <div className="min-w-0">
                <SectionHeader
                  eyebrow="Privacy and account rights"
                  title="Manage your personal data"
                  description="Export a copy of your data or deactivate your account when needed."
                />

                <p className="mt-6 max-w-4xl break-words text-sm leading-7 text-slate-600">
                  Account deactivation removes your access and anonymizes
                  identifying account details where they can be removed, while
                  preserving participation records needed for consultation
                  integrity.
                </p>

                {accountActionMessage ? (
                  <MessageBlock tone="success">{accountActionMessage}</MessageBlock>
                ) : null}

                {accountActionError ? (
                  <MessageBlock tone="danger">{accountActionError}</MessageBlock>
                ) : null}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={handleExportMyData}
                    disabled={isExportingData || isDeletingAccount}
                    className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {isExportingData ? "Preparing export..." : "Export my data"}
                  </button>

                  <button
                    type="button"
                    onClick={handleDeactivateMyAccount}
                    disabled={isDeletingAccount || isExportingData || isLoggingOut}
                    className="inline-flex min-h-12 w-full items-center justify-center border border-red-300 bg-white px-5 text-sm font-black text-red-700 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-red-50 hover:shadow-md active:-translate-y-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {isDeletingAccount
                      ? "Deactivating account..."
                      : "Deactivate account"}
                  </button>
                </div>
              </div>

              <aside className="min-w-0">
                <SidePanel eyebrow="Legal information" title="Helpful links">
                  <LegalLink href="/privacy">Privacy Policy</LegalLink>
                  <LegalLink href="/terms">Terms of Service</LegalLink>
                  <LegalLink href="/cookies">Cookie Policy</LegalLink>
                </SidePanel>
              </aside>
            </div>
          </section>
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
      <h2 className="mt-3 break-words text-3xl font-black tracking-[-0.05em] text-slate-950 md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

function ActionRow({
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
    <div className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <h3 className="break-words text-xl font-black tracking-[-0.04em] text-slate-950">
          {title}
        </h3>
        <p className="mt-2 max-w-2xl break-words text-sm leading-7 text-slate-600">
          {description}
        </p>
      </div>

      <Link
        href={href}
        className={`inline-flex min-h-11 w-full items-center justify-center border bg-white px-4 text-sm font-black shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md active:-translate-y-1 active:scale-[0.98] sm:w-auto ${
          highlight
            ? "border-green-500 text-green-700 hover:bg-green-50"
            : "border-slate-300 text-slate-800 hover:border-slate-400"
        }`}
      >
        {hrefLabel} →
      </Link>
    </div>
  );
}

function SidePanel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-y border-slate-200 py-6">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
        {eyebrow}
      </p>
      <h2 className="mt-3 break-words text-2xl font-black tracking-[-0.045em] text-slate-950">
        {title}
      </h2>
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
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

function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
    >
      {children}
    </Link>
  );
}

function MessageBlock({
  tone,
  children,
}: {
  tone: "success" | "danger";
  children: ReactNode;
}) {
  const toneClass =
    tone === "success" ? "border-green-200 text-green-700" : "border-red-200 text-red-700";

  return (
    <div className={`mt-6 border-y py-4 text-sm font-bold ${toneClass}`}>
      {children}
    </div>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "muted" | "default";
}) {
  const toneClass =
    tone === "success"
      ? "border-green-200 text-green-700"
      : tone === "warning"
        ? "border-amber-200 text-amber-700"
        : tone === "muted"
          ? "border-slate-200 text-slate-500"
          : "border-slate-200 text-slate-700";

  return (
    <span
      className={`max-w-full break-words border bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${toneClass}`}
    >
      {label}
    </span>
  );
}
