'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { isAdminRole } from '@/lib/roles';

export function ConsultationsHeroActions() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-4">
        <Link
          href="/articles"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
        >
          Read articles
        </Link>
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <div className="flex flex-wrap gap-4">
      <Link
        href="/articles"
        className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
      >
        Read articles
      </Link>

      {!isAuthenticated ? (
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md"
        >
          Sign in to participate
        </Link>
      ) : isAdminRole(user.role) ? (
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
        >
          Open admin dashboard
        </Link>
      ) : (
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md"
        >
          Open dashboard
        </Link>
      )}
    </div>
  );
}
