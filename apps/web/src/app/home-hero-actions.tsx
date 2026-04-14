'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { isAdminRole } from '@/lib/roles';

export function HomeHeroActions() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-4">
        <Link
          href="/consultations"
          className="inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md active:translate-y-0"
        >
          Browse consultations
        </Link>
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <div className="flex flex-wrap gap-4">
      <Link
        href="/consultations"
        className="inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md active:translate-y-0"
      >
        Browse consultations
      </Link>

      {!isAuthenticated ? (
        <>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:translate-y-0"
          >
            Sign in
          </Link>

          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md active:translate-y-0"
          >
            Create account
          </Link>
        </>
      ) : isAdminRole(user.role) ? (
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:translate-y-0"
        >
          Open admin dashboard
        </Link>
      ) : (
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:translate-y-0"
        >
          Open dashboard
        </Link>
      )}
    </div>
  );
}
