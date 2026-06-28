"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { isAdminRole } from "@/lib/roles";
import { hasPermission } from "@/lib/permissions";
import { ADMIN_NAV, PUBLIC_NAV } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type HeaderProps = {
  variant?: "public" | "admin";
};

function getPublicViewHref(pathname: string) {
  if (pathname === ROUTES.admin.root) {
    return ROUTES.public.home;
  }

  if (pathname === ROUTES.admin.consultations) {
    return ROUTES.public.consultations;
  }

  if (pathname.startsWith(`${ROUTES.admin.consultations}/`)) {
    const parts = pathname.split("/").filter(Boolean);
    const consultationSlug = parts[2];

    if (consultationSlug) {
      return `${ROUTES.public.consultations}/${consultationSlug}`;
    }

    return ROUTES.public.consultations;
  }

  if (pathname === ROUTES.admin.articles) {
    return ROUTES.public.articles;
  }

  if (pathname.startsWith(`${ROUTES.admin.articles}/`)) {
    return ROUTES.public.articles;
  }

  if (
    pathname === ROUTES.admin.createConsultation ||
    pathname.startsWith(`${ROUTES.admin.createConsultation}/`)
  ) {
    return ROUTES.public.consultations;
  }

  if (
    pathname === ROUTES.admin.assessments ||
    pathname.startsWith(`${ROUTES.admin.assessments}/`)
  ) {
    return ROUTES.public.home;
  }

  return ROUTES.public.home;
}

export default function Header({ variant = "public" }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAuthenticated = !!user;
  const isAdminVariant = variant === "admin";
  const isAdminUser = !!user && isAdminRole(user.role);

  const adminHomeHref = useMemo(() => {
    if (!user || !isAdminUser) {
      return ROUTES.admin.root;
    }

    const firstAllowedAdminItem = ADMIN_NAV.find((item) => {
      if (!item.permission) {
        return true;
      }

      return hasPermission(user.role, item.permission);
    });

    return firstAllowedAdminItem?.href ?? ROUTES.admin.root;
  }, [user, isAdminUser]);

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

  const publicViewHref = useMemo(() => {
    return getPublicViewHref(pathname);
  }, [pathname]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateHeaderVisibility() {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const scrollingUp = currentScrollY < lastScrollY;

      if (currentScrollY < 40 || scrollingUp) {
        setIsHeaderHidden(false);
      } else if (scrollingDown && currentScrollY > 96) {
        setIsHeaderHidden(true);
      }

      lastScrollY = currentScrollY;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateHeaderVisibility);
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace(ROUTES.public.login);
    } finally {
      setIsLoggingOut(false);
    }
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  const headerClass = [
    "relative sticky top-0 z-50 border-b transition-transform duration-300 ease-out",
    "border-white/50 bg-white/58 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur-2xl",
    "supports-[backdrop-filter]:bg-white/42",
    isAdminVariant ? "bg-slate-50/62" : "",
    isHeaderHidden && !isMobileMenuOpen ? "-translate-y-full" : "translate-y-0",
  ].join(" ");

  const navLinkClass =
    "inline-flex min-h-10 items-center whitespace-nowrap px-1 text-sm font-bold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:text-green-700 active:text-green-700";

  const subtleActionClass =
    "inline-flex min-h-11 items-center justify-center whitespace-nowrap border border-slate-300 bg-white px-5 text-sm font-black text-slate-900 shadow-[0_10px_28px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-0.5 hover:border-green-600 hover:bg-white hover:text-green-700 hover:shadow-[0_16px_38px_rgba(15,23,42,0.12)] active:-translate-y-0.5 active:scale-[0.98]";

  const primaryActionClass =
    "inline-flex min-h-11 items-center justify-center whitespace-nowrap border border-green-700 bg-green-700 px-5 text-sm font-black text-white shadow-[0_16px_34px_rgba(22,163,74,0.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-green-800 hover:shadow-[0_20px_46px_rgba(22,163,74,0.30)] active:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60";

  const darkActionClass =
    "inline-flex min-h-11 items-center justify-center whitespace-nowrap border border-slate-900 bg-slate-900 px-5 text-sm font-black text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800 active:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60";

  const mobileMenuButtonClass =
    "inline-flex h-12 w-12 shrink-0 list-none items-center justify-center border border-white/60 bg-white/62 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_12px_30px_rgba(15,23,42,0.10)] backdrop-blur-2xl transition duration-300 hover:border-green-500/60 hover:bg-white hover:text-green-700 active:scale-[0.98] lg:hidden [&::-webkit-details-marker]:hidden";

  const mobileMenuLinkClass =
    "group flex min-h-14 items-center justify-between border-b border-slate-200 bg-white px-6 text-sm font-black text-slate-800 transition duration-300 hover:bg-green-50 hover:text-green-700 active:bg-green-50 active:text-green-700";

  const mobileMenuArrowClass =
    "text-lg font-black text-slate-300 transition duration-300 group-hover:translate-x-1 group-hover:text-green-700";

  const mobileButtonWrapClass = "grid gap-3 bg-white p-4 sm:grid-cols-2";

  const publicAccountHref = isAdminUser
    ? adminHomeHref
    : ROUTES.user.dashboard;
  const publicAccountLabel = isAdminUser ? "Admin" : "Dashboard";
  const mobileMenuId = isAdminVariant
    ? "admin-mobile-navigation"
    : "public-mobile-navigation";

  return (
    <header className={headerClass}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
        <Link
          href={isAdminVariant ? adminHomeHref : ROUTES.public.home}
          className="group flex min-w-0 shrink items-center gap-3 sm:gap-4"
        >
          <Image
            src="/branding/ER-Democracy-Bologna-logo.png"
            alt="ER Democracy Bologna"
            width={72}
            height={72}
            className="h-14 w-14 shrink-0 object-contain transition duration-300 group-hover:scale-[1.03] sm:h-16 sm:w-16"
            priority
          />

          <div className="min-w-0 leading-tight">
            <p className="truncate text-base font-black text-slate-950 sm:text-lg">
              ER Democracy Bologna
            </p>
            <p className="truncate text-sm font-medium text-slate-500">
              {isAdminVariant ? "Administration" : "Digital voting platform"}
            </p>
          </div>
        </Link>

        <details
          open={isMobileMenuOpen}
          onToggle={(event) => {
            setIsMobileMenuOpen(event.currentTarget.open);
          }}
          className="group lg:hidden"
        >
          <summary
            aria-controls={mobileMenuId}
            aria-label={
              isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            className={mobileMenuButtonClass}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5 group-open:hidden"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>

            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="hidden h-5 w-5 group-open:block"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </summary>

          <div
            id={mobileMenuId}
            className="absolute left-0 right-0 top-full z-[90] w-full border-y border-slate-200 bg-white text-slate-950 shadow-[0_22px_70px_rgba(15,23,42,0.18)]"
          >
            {!isAdminVariant ? (
              <nav className="flex flex-col bg-white" aria-label="Mobile navigation">
                {PUBLIC_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={mobileMenuLinkClass}
                    onClick={closeMobileMenu}
                  >
                    <span>{item.label}</span>
                    <span aria-hidden="true" className={mobileMenuArrowClass}>
                      →
                    </span>
                  </Link>
                ))}

                {isAuthenticated ? (
                  <>
                    <Link
                      href={publicAccountHref}
                      className={mobileMenuLinkClass}
                      onClick={closeMobileMenu}
                    >
                      <span>{publicAccountLabel}</span>
                      <span aria-hidden="true" className={mobileMenuArrowClass}>
                        →
                      </span>
                    </Link>

                    <Link
                      href={ROUTES.user.assessment}
                      className={mobileMenuLinkClass}
                      onClick={closeMobileMenu}
                    >
                      <span>Assessment</span>
                      <span aria-hidden="true" className={mobileMenuArrowClass}>
                        →
                      </span>
                    </Link>

                    <div className="bg-white p-4">
                      <button
                        type="button"
                        onClick={() => {
                          closeMobileMenu();
                          void handleLogout();
                        }}
                        disabled={isLoggingOut}
                        className={`${darkActionClass} w-full`}
                      >
                        {isLoggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className={mobileButtonWrapClass}>
                    <Link
                      href={ROUTES.public.login}
                      className={`${subtleActionClass} w-full`}
                      onClick={closeMobileMenu}
                    >
                      Login
                    </Link>

                    <Link
                      href={ROUTES.public.register}
                      className={`${primaryActionClass} w-full`}
                      onClick={closeMobileMenu}
                    >
                      Sign up
                    </Link>
                  </div>
                )}

                {isLoading ? (
                  <span className="border-t border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-500">
                    Loading...
                  </span>
                ) : null}
              </nav>
            ) : (
              <nav className="flex flex-col bg-white" aria-label="Mobile navigation">
                {visibleAdminNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={mobileMenuLinkClass}
                    onClick={closeMobileMenu}
                  >
                    <span>{item.label}</span>
                    <span aria-hidden="true" className={mobileMenuArrowClass}>
                      →
                    </span>
                  </Link>
                ))}

                <div className={mobileButtonWrapClass}>
                  <Link
                    href={publicViewHref}
                    className={`${subtleActionClass} w-full`}
                    onClick={closeMobileMenu}
                  >
                    Public view
                  </Link>

                  {isLoading ? (
                    <span className="flex min-h-11 items-center justify-center text-sm font-medium text-slate-500">
                      Loading...
                    </span>
                  ) : isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => {
                        closeMobileMenu();
                        void handleLogout();
                      }}
                      disabled={isLoggingOut}
                      className={`${darkActionClass} w-full`}
                    >
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </button>
                  ) : (
                    <Link
                      href={ROUTES.public.login}
                      className={`${darkActionClass} w-full`}
                      onClick={closeMobileMenu}
                    >
                      Login
                    </Link>
                  )}
                </div>
              </nav>
            )}
          </div>
        </details>

        {!isAdminVariant ? (
          <nav className="hidden items-center gap-5 lg:flex">
            {PUBLIC_NAV.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass}>
                {item.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <Link
                  href={isAdminUser ? adminHomeHref : ROUTES.user.dashboard}
                  className={navLinkClass}
                >
                  {isAdminUser ? "Admin" : "Dashboard"}
                </Link>

                <Link href={ROUTES.user.assessment} className={navLinkClass}>
                  Assessment
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={darkActionClass}
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </>
            ) : (
              <>
                <Link href={ROUTES.public.login} className={subtleActionClass}>
                  Login
                </Link>

                <Link
                  href={ROUTES.public.register}
                  className={primaryActionClass}
                >
                  Sign up
                </Link>
              </>
            )}

            {isLoading ? (
              <span className="whitespace-nowrap text-sm text-slate-500">
                Loading...
              </span>
            ) : null}
          </nav>
        ) : (
          <nav className="hidden items-center gap-4 lg:flex">
            {visibleAdminNav.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass}>
                {item.label}
              </Link>
            ))}

            <Link href={publicViewHref} className={subtleActionClass}>
              Public view
            </Link>

            {isLoading ? (
              <span className="whitespace-nowrap text-sm text-slate-500">
                Loading...
              </span>
            ) : isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={darkActionClass}
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            ) : (
              <Link href={ROUTES.public.login} className={darkActionClass}>
                Login
              </Link>
            )}
          </nav>
        )}
      </div>

      <div className="h-[2px] w-full bg-gradient-to-r from-green-600/90 via-white/60 to-red-600/90" />
    </header>
  );
}
