"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, type ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";
import { isAdminRole } from "@/lib/roles";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { ADMIN_NAV, PUBLIC_NAV } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type FooterProfile = {
  label: string;
  description: string;
  closing: string;
  linkColumnTitle: string;
};

function getFooterProfile(
  role: string | null | undefined,
  isAuthenticated: boolean,
): FooterProfile {
  if (role === "SUPER_ADMIN") {
    return {
      label: "Super admin",
      description:
        "Full access to consultations, articles, results, and admin sections.",
      closing: "Full platform access.",
      linkColumnTitle: "Admin access",
    };
  }

  if (role === "CONSULTATION_ADMIN") {
    return {
      label: "Consultation admin",
      description:
        "Create and update consultations, check results, and keep voting pages ready.",
      closing: "Consultation tools.",
      linkColumnTitle: "Consultations",
    };
  }

  if (role === "CONTENT_ADMIN") {
    return {
      label: "Content admin",
      description:
        "Create and update articles and media shown on the public site.",
      closing: "Content tools.",
      linkColumnTitle: "Articles",
    };
  }

  if (role === "ANALYTICS_ADMIN") {
    return {
      label: "Results admin",
      description: "View consultation results and platform reports.",
      closing: "Results access.",
      linkColumnTitle: "Results",
    };
  }

  if (role === "AUDITOR") {
    return {
      label: "Audit access",
      description:
        "View consultations, results, reports, and assessment lookup pages.",
      closing: "Read-only admin access.",
      linkColumnTitle: "Audit access",
    };
  }

  if (isAuthenticated) {
    return {
      label: "Signed-in participant",
      description:
        "Browse consultations, read articles, and use your dashboard when participation requires an account.",
      closing: "Participant access.",
      linkColumnTitle: "Your area",
    };
  }

  return {
    label: "Civic participation platform",
    description:
      "Browse public consultations and articles. Sign in when a voting step requires an account.",
    closing: "Public civic participation.",
    linkColumnTitle: "Explore",
  };
}

export default function Footer() {
  const { user } = useAuth();

  const isAuthenticated = !!user;
  const isAdminUser = !!user && isAdminRole(user.role);

  const footerProfile = useMemo(() => {
    return getFooterProfile(user?.role, isAuthenticated);
  }, [user?.role, isAuthenticated]);

  const visibleAdminNav = useMemo(() => {
    if (!user) {
      return ADMIN_NAV.filter((item) => !item.permission);
    }

    return ADMIN_NAV.filter((item) => {
      if (!item.permission) {
        return true;
      }

      return hasPermission(user.role, item.permission);
    });
  }, [user]);

  const canCreateArticle = hasPermission(user?.role, PERMISSIONS.ARTICLE_CREATE);
  const canUseAssessmentLookup = hasPermission(
    user?.role,
    PERMISSIONS.ASSESSMENT_SECRET_LOOKUP,
  );

  return (
    <footer className="mt-20 bg-white text-slate-800">
      <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

      <section className="bg-white px-5 py-14 sm:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
            <section className="min-w-0">
              <Link
                href={isAdminUser ? ROUTES.admin.root : ROUTES.public.home}
                className="group inline-flex max-w-full items-center gap-4 overflow-visible"
              >
                <Image
                  src="/branding/ER-Democracy-Bologna-logo.png"
                  alt="ER Democracy Bologna"
                  width={84}
                  height={84}
                  className="h-16 w-16 shrink-0 object-contain transition duration-300 group-hover:scale-[1.03] sm:h-20 sm:w-20"
                />

                <div className="min-w-0 overflow-visible py-1">
                  <p className="footer-brand-title">ER Democracy Bologna</p>
                  <p className="footer-brand-subtitle mt-1 text-green-700">
                    {footerProfile.label}
                  </p>
                </div>
              </Link>

              <p className="body-copy mt-7 max-w-xl text-slate-600">
                {footerProfile.description}
              </p>

              <div className="mt-8 border-t border-slate-200 pt-6">
                <p className="micro text-slate-500">Contact</p>

                <a
                  href="mailto:admin@er-democracy-bologna.xyz"
                  className="mt-3 inline-flex break-all text-sm font-medium text-slate-950 transition duration-300 hover:text-green-700 active:text-green-700"
                >
                  admin@er-democracy-bologna.xyz
                </a>
              </div>
            </section>

            <FooterColumn title={footerProfile.linkColumnTitle}>
              {isAdminUser ? (
                <>
                  {visibleAdminNav.map((item) => (
                    <FooterLink key={item.href} href={item.href}>
                      {item.label}
                    </FooterLink>
                  ))}

                  {canCreateArticle ? (
                    <FooterLink href="/admin/articles/create">
                      Create article
                    </FooterLink>
                  ) : null}

                  {canUseAssessmentLookup ? (
                    <FooterLink href={ROUTES.admin.assessments}>
                      Assessment lookup
                    </FooterLink>
                  ) : null}

                  <FooterLink href={ROUTES.public.home}>Public home</FooterLink>
                  <FooterLink href={ROUTES.public.consultations}>
                    Public consultations
                  </FooterLink>
                  <FooterLink href={ROUTES.public.articles}>
                    Public articles
                  </FooterLink>
                </>
              ) : (
                <>
                  {PUBLIC_NAV.map((item) => (
                    <FooterLink key={item.href} href={item.href}>
                      {item.label}
                    </FooterLink>
                  ))}

                  {isAuthenticated ? (
                    <>
                      <FooterLink href={ROUTES.user.dashboard}>
                        Dashboard
                      </FooterLink>

                      <FooterLink href={ROUTES.user.assessment}>
                        Assessment
                      </FooterLink>
                    </>
                  ) : (
                    <>
                      <FooterLink href={ROUTES.public.login}>Login</FooterLink>

                      <FooterLink href={ROUTES.public.register}>
                        Sign up
                      </FooterLink>
                    </>
                  )}
                </>
              )}
            </FooterColumn>

            <FooterColumn title="Legal">
              <FooterLink href={ROUTES.public.privacy}>Privacy</FooterLink>
              <FooterLink href={ROUTES.public.terms}>Terms</FooterLink>
              <FooterLink href="/cookies">Cookies</FooterLink>
              <FooterLink href={ROUTES.public.contact}>Contact</FooterLink>
            </FooterColumn>
          </div>

          <div className="mt-12 grid gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <p>
              © {new Date().getFullYear()} ER Democracy Bologna. All rights
              reserved.
            </p>

            <p className="font-medium text-slate-500">
              {footerProfile.closing}
            </p>
          </div>
        </div>
      </section>

      <section className="w-full overflow-hidden bg-white" aria-hidden="true">
        <Image
          src="/footer.png"
          alt=""
          width={5444}
          height={1728}
          sizes="100vw"
          className="block h-auto w-full select-none"
          priority={false}
          unoptimized
        />
      </section>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0">
      <h3 className="micro text-green-700">{title}</h3>

      <div className="mt-5 grid gap-2">{children}</div>
    </section>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-11 items-center justify-between border-b border-slate-200 text-sm font-medium text-slate-700 transition duration-300 hover:border-green-600 hover:text-green-700 active:border-green-600 active:text-green-700"
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        className="text-lg font-medium text-slate-300 transition duration-300 group-hover:translate-x-1 group-hover:text-green-700"
      >
        →
      </span>
    </Link>
  );
}
