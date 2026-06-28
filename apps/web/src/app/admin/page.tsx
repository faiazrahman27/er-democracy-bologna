"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { isAdminRole } from "@/lib/roles";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
      return;
    }

    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace("/login");
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
  const canEditConsultations = hasPermission(
    userRole,
    PERMISSIONS.CONSULTATION_EDIT,
  );
  const canViewConsultations = hasPermission(
    userRole,
    PERMISSIONS.CONSULTATION_VIEW_ADMIN,
  );
  const canViewResults = hasPermission(
    userRole,
    PERMISSIONS.RESULTS_VIEW_ADMIN,
  );
  const canViewAnalytics = hasPermission(
    userRole,
    PERMISSIONS.ANALYTICS_VIEW_ADMIN,
  );
  const canViewParticipants = hasPermission(
    userRole,
    PERMISSIONS.PARTICIPANTS_VIEW_ADMIN,
  );
  const canLookupAssessment = hasPermission(
    userRole,
    PERMISSIONS.ASSESSMENT_SECRET_LOOKUP,
  );

  const canViewArticles = hasPermission(
    userRole,
    PERMISSIONS.ARTICLE_VIEW_ADMIN,
  );
  const canCreateArticles = hasPermission(
    userRole,
    PERMISSIONS.ARTICLE_CREATE,
  );
  const canEditArticles = hasPermission(userRole, PERMISSIONS.ARTICLE_EDIT);
  const canDeleteArticles = hasPermission(userRole, PERMISSIONS.ARTICLE_DELETE);
  const canPublishArticles = hasPermission(
    userRole,
    PERMISSIONS.ARTICLE_PUBLISH,
  );
  const canUploadMedia = hasPermission(userRole, PERMISSIONS.MEDIA_UPLOAD);

  const roleCopy = getRoleCopy(userRole);

  const permissionItems = [
    ["Consultation creation", canCreateConsultation],
    ["Consultation editing", canEditConsultations],
    ["Consultation admin view", canViewConsultations],
    ["Results access", canViewResults],
    ["Analytics access", canViewAnalytics],
    ["Participant access", canViewParticipants],
    ["Secret assessment lookup", canLookupAssessment],
    ["Article creation", canCreateArticles],
    ["Article editing", canEditArticles],
    ["Article deletion", canDeleteArticles],
    ["Article publishing", canPublishArticles],
    ["Article admin view", canViewArticles],
    ["Media upload", canUploadMedia],
  ] as const;

  const enabledCount = permissionItems.filter(([, allowed]) => allowed).length;
  const disabledCount = permissionItems.length - enabledCount;

  const adminSections = [
    {
      enabled: canViewConsultations,
      href: "/admin/consultations",
      eyebrow: "Consultations",
      title: canEditConsultations
        ? "Manage consultations"
        : "Review consultations",
      description: canEditConsultations
        ? "Review, edit, and manage consultation pages."
        : "Open consultation records available to this role.",
      disabledDescription: "This role cannot open the consultation admin area.",
    },
    {
      enabled: canCreateConsultation,
      href: "/admin/votes",
      eyebrow: "Creation",
      title: "Create consultation",
      description: "Create a new consultation.",
      disabledDescription: "This role cannot create consultations.",
    },
    {
      enabled: canViewArticles,
      href: "/admin/articles",
      eyebrow: "Articles",
      title:
        canEditArticles || canPublishArticles
          ? "Manage articles"
          : "Review articles",
      description:
        canEditArticles || canPublishArticles
          ? "Create, edit, publish, and review articles."
          : "Open article records available to this role.",
      disabledDescription: "This role cannot open the article admin area.",
    },
    {
      enabled: true,
      href: "/assessment",
      eyebrow: "Profile",
      title: "My assessment",
      description: "Open your personal assessment profile.",
      disabledDescription: "",
    },
  ];

  const platformStatus = [
    ["Authentication", true],
    ["Role system", true],
    ["Personal assessment", true],
    ["Consultation admin view", canViewConsultations],
    ["Consultation editing", canEditConsultations],
    ["Consultation creation", canCreateConsultation],
    ["Results access", canViewResults],
    ["Analytics access", canViewAnalytics],
    ["Participant access", canViewParticipants],
    ["Assessment lookup", canLookupAssessment],
    ["Article admin view", canViewArticles],
    ["Article creation", canCreateArticles],
    ["Article editing", canEditArticles],
    ["Article publishing", canPublishArticles],
    ["Article deletion", canDeleteArticles],
    ["Media upload", canUploadMedia],
  ] as const;

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
                  {roleCopy.eyebrow}
                </p>

                <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                  {roleCopy.title}
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
                  Welcome back,{" "}
                  <span className="border-b-2 border-green-600 bg-green-50 px-1.5 py-0.5 font-black text-slate-950">
                    {user.fullName}
                  </span>
                  . {roleCopy.summary}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-red-500 hover:text-red-700 hover:shadow-md active:-translate-y-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </div>

              <aside className="min-w-0 border-t border-slate-200 bg-white px-5 py-7 sm:px-8 lg:border-l lg:border-t-0 lg:px-8 lg:py-12">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                      Current access
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Permissions assigned to this signed-in role.
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
                    value={user.emailVerified ? "Verified" : "Not verified"}
                    tone={user.emailVerified ? "success" : "danger"}
                  />
                  <SessionLine
                    label="Account"
                    value={user.isActive ? "Active" : "Inactive"}
                    tone={user.isActive ? "success" : "danger"}
                  />
                  <SessionLine
                    label="Permissions"
                    value={
                      <>
                        <span className="text-green-700">
                          {enabledCount} enabled
                        </span>{" "}
                        <span className="text-slate-950">/</span>{" "}
                        <span className="text-red-700">
                          {disabledCount} disabled
                        </span>
                      </>
                    }
                  />
                </div>
              </aside>
            </div>
          </section>

          <section className="mt-11">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Admin sections
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950 md:text-4xl">
                  {roleCopy.sectionsTitle}
                </h2>
              </div>

              <p className="max-w-md text-sm leading-6 text-slate-500">
                Enabled sections are clickable. Disabled sections are shown in
                red for this role.
              </p>
            </div>

            <div className="mt-7 grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
              {adminSections.map((item) =>
                item.enabled ? (
                  <ActionPath
                    key={item.title}
                    href={item.href}
                    eyebrow={item.eyebrow}
                    title={item.title}
                    description={item.description}
                  />
                ) : (
                  <DisabledActionPath
                    key={item.title}
                    eyebrow={item.eyebrow}
                    title={item.title}
                    description={item.disabledDescription}
                  />
                ),
              )}
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
                Signed in as{" "}
                <span className="border-b-2 border-green-600 font-black text-slate-950">
                  {user.fullName}
                </span>
                . {roleCopy.identityLine}
              </p>

              <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                <DetailLine label="Full name" value={user.fullName} />
                <DetailLine label="Email" value={user.email} />
                <DetailLine label="Role" value={user.role} />
                <DetailLine
                  label="Email verified"
                  value={user.emailVerified ? "Yes" : "No"}
                />
                <DetailLine
                  label="Active"
                  value={user.isActive ? "Yes" : "No"}
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
                    Permissions
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.12em]">
                  <span className="text-green-700">
                    {enabledCount} enabled
                  </span>
                  <span className="text-red-700">
                    {disabledCount} disabled
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {permissionItems.map(([label, allowed]) => (
                  <PermissionPill
                    key={label}
                    label={label}
                    enabled={allowed}
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
                  Admin access overview
                </h2>

                <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
                  This overview shows both enabled and disabled platform areas
                  for the current role.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {platformStatus.map(([label, enabled]) => (
                  <StatusPill key={label} label={label} enabled={enabled} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function getRoleCopy(role: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return {
        eyebrow: "Full administration",
        title: "Platform admin",
        summary:
          "This role can manage consultations, articles, results, participants, and media.",
        sectionsTitle: "All admin sections",
        identityLine: "This account has full administrative access.",
      };

    case "CONSULTATION_ADMIN":
      return {
        eyebrow: "Consultation administration",
        title: "Consultation admin",
        summary:
          "This role can manage consultations, results, analytics, and participant records.",
        sectionsTitle: "Consultation tools",
        identityLine: "This account can manage consultations.",
      };

    case "CONTENT_ADMIN":
      return {
        eyebrow: "Articles",
        title: "Article admin",
        summary:
          "This role can create, edit, publish, delete, and manage article media.",
        sectionsTitle: "Article tools",
        identityLine: "This account can manage articles, publishing, and media.",
      };

    case "ANALYTICS_ADMIN":
      return {
        eyebrow: "Results administration",
        title: "Results admin",
        summary: "This role can view consultations, results, and analytics.",
        sectionsTitle: "Results tools",
        identityLine: "This account can view results and analytics.",
      };

    case "AUDITOR":
      return {
        eyebrow: "Audit access",
        title: "Audit overview",
        summary:
          "This role can view consultations, results, analytics, participants, and assessment lookup pages.",
        sectionsTitle: "Review tools",
        identityLine: "This account can view audit and oversight areas.",
      };

    default:
      return {
        eyebrow: "Administration",
        title: "Admin dashboard",
        summary:
          "Available tools depend on the permissions attached to this role.",
        sectionsTitle: "Admin sections",
        identityLine: "This account can use the permissions attached to its role.",
      };
  }
}

function SessionLine({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  tone?: "success" | "warning" | "danger" | "default";
}) {
  const toneClass =
    tone === "success"
      ? "text-green-700"
      : tone === "warning"
        ? "text-amber-700"
        : tone === "danger"
          ? "text-red-700"
          : "text-slate-950";

  return (
    <div className="group flex min-w-0 items-center justify-between gap-5 border-b border-slate-200 pb-4 transition duration-200 hover:border-slate-400 active:border-slate-400">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>

      <div
        className={`min-w-0 break-words text-right text-base font-black tracking-[-0.03em] transition duration-200 group-hover:translate-x-1 group-active:translate-x-1 ${toneClass}`}
      >
        {value}
      </div>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
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
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex h-full min-w-0 cursor-pointer flex-col overflow-hidden border border-slate-200 bg-white px-5 py-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-xl active:-translate-y-1 active:scale-[0.985] active:border-slate-300 active:bg-white active:shadow-lg"
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-green-600 via-white to-red-600 transition duration-300 group-hover:w-1.5 group-active:w-2" />

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pl-2">
        <p className="min-w-0 truncate text-[0.7rem] font-black uppercase leading-none tracking-[0.22em] text-slate-500">
          {eyebrow}
        </p>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-xl font-black leading-none text-slate-400 transition duration-300 group-hover:translate-x-1 group-hover:text-slate-700 group-active:translate-x-1 group-active:text-slate-700">
          →
        </span>
      </div>

      <h3 className="mt-5 pl-2 text-xl font-black leading-tight tracking-[-0.04em] text-slate-950">
        {title}
      </h3>

      <p className="mt-4 pl-2 text-sm leading-7 text-slate-600">
        {description}
      </p>
    </Link>
  );
}

function DisabledActionPath({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex h-full min-w-0 cursor-not-allowed flex-col overflow-hidden border border-red-200 bg-red-50/40 px-5 py-5 shadow-sm">
      <span className="absolute inset-y-0 left-0 w-1 bg-red-600" />

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pl-2">
        <p className="min-w-0 truncate text-[0.7rem] font-black uppercase leading-none tracking-[0.22em] text-red-500">
          {eyebrow}
        </p>

        <span className="inline-flex h-8 shrink-0 items-center justify-center border border-red-200 bg-white px-3 text-[0.65rem] font-black uppercase leading-none tracking-[0.12em] text-red-700">
          Disabled
        </span>
      </div>

      <h3 className="mt-5 pl-2 text-xl font-black leading-tight tracking-[-0.04em] text-red-950">
        {title}
      </h3>

      <p className="mt-4 pl-2 text-sm leading-7 text-red-700">
        {description}
      </p>
    </div>
  );
}

function PermissionPill({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div
      className={`group flex min-w-0 cursor-default items-center justify-between gap-4 border px-4 py-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:-translate-y-0.5 ${
        enabled
          ? "border-slate-200 bg-white hover:border-slate-300 active:border-slate-300"
          : "border-red-200 bg-red-50/40 hover:border-red-300 active:border-red-300"
      }`}
    >
      <p
        className={`min-w-0 text-sm font-bold ${
          enabled ? "text-slate-700" : "text-red-800"
        }`}
      >
        {label}
      </p>

      <span
        className={`shrink-0 text-xs font-black uppercase tracking-[0.13em] transition duration-200 group-hover:scale-105 group-active:scale-105 ${
          enabled ? "text-green-700" : "text-red-700"
        }`}
      >
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}

function StatusPill({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div
      className={`group flex min-w-0 cursor-default items-center justify-between gap-4 border px-4 py-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:-translate-y-0.5 ${
        enabled
          ? "border-slate-200 bg-white hover:border-slate-300 active:border-slate-300"
          : "border-red-200 bg-red-50/40 hover:border-red-300 active:border-red-300"
      }`}
    >
      <p
        className={`min-w-0 text-sm font-bold ${
          enabled ? "text-slate-700" : "text-red-800"
        }`}
      >
        {label}
      </p>

      <span
        className={`shrink-0 text-xs font-black uppercase tracking-[0.13em] transition duration-200 group-hover:scale-105 group-active:scale-105 ${
          enabled ? "text-green-700" : "text-red-700"
        }`}
      >
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}
