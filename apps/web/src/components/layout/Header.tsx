'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { isAdminRole } from '@/lib/roles';
import { hasPermission } from '@/lib/permissions';
import { ADMIN_NAV, PUBLIC_NAV } from '@/lib/navigation';
import { ROUTES } from '@/lib/routes';

type HeaderProps = {
  variant?: 'public' | 'admin';
};

export default function Header({ variant = 'public' }: HeaderProps) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAuthenticated = !!user;
  const isAdminVariant = variant === 'admin';
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

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace(ROUTES.public.login);
    } finally {
      setIsLoggingOut(false);
    }
  }

  const headerClass = isAdminVariant
    ? 'sticky top-0 z-50 border-b border-slate-200 bg-slate-50/95 backdrop-blur'
    : 'sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur';

  const navLinkClass =
    'text-sm font-medium text-slate-700 transition-all duration-200 hover:text-slate-900';

  const subtleActionClass =
    'inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md active:translate-y-0';

  const primaryActionClass =
    'inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md active:translate-y-0 disabled:opacity-60';

  const darkActionClass =
    'inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:translate-y-0 disabled:opacity-60';

  return (
    <header className={headerClass}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href={isAdminVariant ? adminHomeHref : ROUTES.public.home}
          className="group flex shrink-0 items-center gap-3"
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
            <Image
              src="/branding/ER-Democracy-Bologna-logo.png"
              alt="ER Democracy Bologna"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>

          <div className="leading-tight">
            <p className="text-base font-semibold text-slate-900">
              ER Democracy Bologna
            </p>
            <p className="text-sm text-slate-500">
              {isAdminVariant ? 'Administration' : 'Digital voting platform'}
            </p>
          </div>
        </Link>

        {!isAdminVariant ? (
          <nav className="hidden items-center gap-6 md:flex">
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
                  {isAdminUser ? 'Admin' : 'Dashboard'}
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
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <Link href={ROUTES.public.login} className={subtleActionClass}>
                  Login
                </Link>

                <Link href={ROUTES.public.register} className={primaryActionClass}>
                  Sign up
                </Link>
              </>
            )}

            {isLoading ? (
              <span className="text-sm text-slate-400">Loading...</span>
            ) : null}
          </nav>
        ) : (
          <nav className="hidden items-center gap-4 md:flex">
            {visibleAdminNav.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass}>
                {item.label}
              </Link>
            ))}

            <Link href={ROUTES.public.consultations} className={subtleActionClass}>
              Public view
            </Link>

            {isLoading ? (
              <span className="text-sm text-slate-400">Loading...</span>
            ) : isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={darkActionClass}
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            ) : (
              <Link href={ROUTES.public.login} className={darkActionClass}>
                Login
              </Link>
            )}
          </nav>
        )}
      </div>

      <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />
    </header>
  );
}
