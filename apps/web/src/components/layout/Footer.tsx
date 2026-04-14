'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { isAdminRole } from '@/lib/roles';

export default function Footer() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAuthenticated = !!user;
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminUser = !!user && isAdminRole(user.role);

  return (
    <footer className="mt-20 bg-white text-slate-700">
      <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <Link
              href={isAdminRoute ? '/admin' : '/'}
              className="group inline-flex items-center gap-4 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition-all duration-200 group-hover:shadow-md">
                <Image
                  src="/branding/ER-Democracy-Bologna-logo.png"
                  alt="ER Democracy Bologna"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>

              <div>
                <p className="text-base font-semibold text-slate-900">
                  ER Democracy Bologna
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {isAdminRoute
                    ? 'Administrative control surface'
                    : 'Secure civic participation platform'}
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-600">
              {isAdminRoute
                ? 'Administrative access for consultation management, assessment review, analytics oversight, and governance workflows.'
                : 'A modern platform for transparent consultations, public participation, and trusted digital democratic processes.'}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {isAdminRoute ? 'Administration' : 'Platform'}
            </h3>

            <div className="mt-4 space-y-3 text-sm">
              {isAdminRoute ? (
                <>
                  <Link
                    href="/admin"
                    className="block transition-colors duration-200 hover:text-slate-900"
                  >
                    Admin dashboard
                  </Link>

                  <Link
                    href="/admin/consultations"
                    className="block transition-colors duration-200 hover:text-slate-900"
                  >
                    Consultations
                  </Link>

                  <Link
                    href="/admin/articles"
                    className="block transition-colors duration-200 hover:text-slate-900"
                  >
                    Articles
                  </Link>

                  <Link
                    href="/assessment"
                    className="block transition-colors duration-200 hover:text-slate-900"
                  >
                    My assessment
                  </Link>

                  <Link
                    href="/consultations"
                    className="block transition-colors duration-200 hover:text-slate-900"
                  >
                    Public consultations
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    className="block transition-colors duration-200 hover:text-slate-900"
                  >
                    Home
                  </Link>

                  <Link
                    href="/consultations"
                    className="block transition-colors duration-200 hover:text-slate-900"
                  >
                    Consultations
                  </Link>

                  <Link
                    href="/articles"
                    className="block transition-colors duration-200 hover:text-slate-900"
                  >
                    Articles
                  </Link>

                  {isAuthenticated ? (
                    <>
                      {!isAdminUser ? (
                        <Link
                          href="/dashboard"
                          className="block transition-colors duration-200 hover:text-slate-900"
                        >
                          Dashboard
                        </Link>
                      ) : (
                        <Link
                          href="/admin"
                          className="block transition-colors duration-200 hover:text-slate-900"
                        >
                          Admin dashboard
                        </Link>
                      )}

                      <Link
                        href="/assessment"
                        className="block transition-colors duration-200 hover:text-slate-900"
                      >
                        Assessment
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block transition-colors duration-200 hover:text-slate-900"
                      >
                        Login
                      </Link>

                      <Link
                        href="/register"
                        className="block font-medium text-slate-900 transition-colors duration-200 hover:text-green-700"
                      >
                        Sign up
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {isAdminRoute ? 'Reference' : 'Legal'}
            </h3>

            <div className="mt-4 space-y-3 text-sm">
              {isAdminRoute ? (
                <>
                  <Link
                    href="/privacy"
                    className="block transition-colors duration-200 hover:text-slate-900"
                  >
                    Privacy
                  </Link>

                  <Link
                    href="/terms"
                    className="block transition-colors duration-200 hover:text-slate-900"
                  >
                    Terms
                  </Link>

                  <Link
                    href="/contact"
                    className="block transition-colors duration-200 hover:text-slate-900"
                  >
                    Contact
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/privacy"
                    className="block transition-colors duration-200 hover:text-slate-900"
                  >
                    Privacy
                  </Link>

                  <Link
                    href="/terms"
                    className="block transition-colors duration-200 hover:text-slate-900"
                  >
                    Terms
                  </Link>

                  <Link
                    href="/contact"
                    className="block transition-colors duration-200 hover:text-slate-900"
                  >
                    Contact
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} ER Democracy Bologna. All rights
            reserved.
          </p>
          <p>
            {isAdminRoute
              ? 'Administrative workspace for secure and accountable civic operations.'
              : 'Designed for transparent and trustworthy civic participation.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
