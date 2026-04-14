'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';

type HeaderProps = {
  variant?: 'public' | 'admin';
};

export default function Header({ variant = 'public' }: HeaderProps) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAuthenticated = !!user;
  const isAdminVariant = variant === 'admin';

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace('/login');
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
          href={isAdminVariant ? '/admin' : '/'}
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
            <Link href="/" className={navLinkClass}>
              Home
            </Link>

            <Link href="/consultations" className={navLinkClass}>
              Consultations
            </Link>

            <Link href="/articles" className={navLinkClass}>
              Articles
            </Link>

            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className={navLinkClass}>
                  Dashboard
                </Link>

                <Link href="/assessment" className={navLinkClass}>
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
                <Link href="/login" className={subtleActionClass}>
                  Login
                </Link>

                <Link href="/register" className={primaryActionClass}>
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
            <Link href="/" className={navLinkClass}>
              Home
            </Link>

            <Link href="/admin" className={navLinkClass}>
              Overview
            </Link>

            <Link href="/admin/consultations" className={navLinkClass}>
              Consultations
            </Link>

            <Link href="/admin/articles" className={navLinkClass}>
              Articles
            </Link>

            <Link href="/consultations" className={subtleActionClass}>
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
              <Link href="/login" className={darkActionClass}>
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
