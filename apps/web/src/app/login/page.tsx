'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { isAdminRole } from '@/lib/roles';
import { apiRequest } from '@/lib/api';

type ResendVerificationResponse = {
  message: string;
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Sign in
              </p>

              <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
                Access your civic workspace.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                Participate in consultations, explore results, and manage your
                account with a secure and transparent platform.
              </p>

              <div className="mt-8 flex gap-4">
                <Link
                  href="/consultations"
                  className="text-sm font-medium text-slate-700 hover:text-green-700"
                >
                  Browse consultations →
                </Link>

                <Link
                  href="/register"
                  className="text-sm font-medium text-slate-700 hover:text-red-600"
                >
                  Create account →
                </Link>
              </div>
            </section>

            <section>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    disabled
                    className="mt-2 w-full border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">
                      Password
                    </label>

                    <span className="text-xs text-slate-400">
                      Forgot password?
                    </span>
                  </div>

                  <input
                    type="password"
                    disabled
                    className="mt-2 w-full border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none"
                  />
                </div>

                <button
                  type="button"
                  disabled
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-sm font-medium text-white opacity-60"
                >
                  Sign in
                </button>
              </div>

              <p className="mt-6 text-sm text-slate-600">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="font-medium text-slate-900 hover:text-red-600"
                >
                  Sign up
                </Link>
              </p>
            </section>
          </div>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, isLoading } = useAuth();

  const redirectTo = searchParams.get('redirectTo');
  const verified = searchParams.get('verified');
  const emailFromQuery = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(emailFromQuery);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;

    if (redirectTo) {
      router.replace(redirectTo);
    } else if (isAdminRole(user.role)) {
      router.replace('/admin');
    } else {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router, redirectTo]);

  useEffect(() => {
    if (verified === 'true') {
      setSuccessMessage('Email verified successfully. You can sign in now.');
    }
  }, [verified]);

  const showResendVerification = useMemo(() => {
    if (!error) return false;

    const normalized = error.toLowerCase();
    return normalized.includes('verify your email');
  }, [error]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setResendMessage(null);
    setResendError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendVerification() {
    setResendMessage(null);
    setResendError(null);
    setIsResending(true);

    try {
      const response = await apiRequest<ResendVerificationResponse>(
        '/auth/resend-verification',
        {
          method: 'POST',
          body: {
            email: email.trim().toLowerCase(),
          },
        },
      );

      setResendMessage(response.message);
    } catch (err) {
      setResendError(
        err instanceof Error
          ? err.message
          : 'Failed to resend verification email',
      );
    } finally {
      setIsResending(false);
    }
  }

  const forgotPasswordHref = email.trim()
    ? `/forgot-password?email=${encodeURIComponent(email.trim().toLowerCase())}`
    : '/forgot-password';

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Sign in
          </p>

          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
            Access your civic workspace.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Participate in consultations, explore results, and manage your
            account with a secure and transparent platform.
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              href="/consultations"
              className="text-sm font-medium text-slate-700 hover:text-green-700"
            >
              Browse consultations →
            </Link>

            <Link
              href="/register"
              className="text-sm font-medium text-slate-700 hover:text-red-600"
            >
              Create account →
            </Link>
          </div>
        </section>

        <section>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none transition focus:border-green-600"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>

                <Link
                  href={forgotPasswordHref}
                  className="text-xs text-slate-500 transition hover:text-red-600"
                >
                  Forgot password?
                </Link>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none transition focus:border-green-600"
                required
              />
            </div>

            {successMessage ? (
              <p className="text-sm text-green-700">{successMessage}</p>
            ) : null}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            {showResendVerification ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending || !email.trim()}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white disabled:opacity-60"
                >
                  {isResending
                    ? 'Sending verification...'
                    : 'Resend verification email'}
                </button>

                {resendMessage ? (
                  <p className="text-sm text-green-700">{resendMessage}</p>
                ) : null}

                {resendError ? (
                  <p className="text-sm text-red-600">{resendError}</p>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-medium text-slate-900 hover:text-red-600"
            >
              Sign up
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
