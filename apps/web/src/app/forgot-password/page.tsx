'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';

type ForgotPasswordResponse = {
  message: string;
};

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const emailFromQuery = useMemo(
    () => searchParams.get('email') ?? '',
    [searchParams],
  );

  const [email, setEmail] = useState(emailFromQuery);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await apiRequest<ForgotPasswordResponse>(
        '/auth/forgot-password',
        {
          method: 'POST',
          body: {
            email: email.trim().toLowerCase(),
          },
        },
      );

      setSuccessMessage(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send password reset email.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Account recovery
          </p>

          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
            Reset your password.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Enter your email address and we will send you a secure link to reset
            your password.
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-green-700"
            >
              Back to login →
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
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none transition focus:border-green-600"
                required
              />
            </div>

            {successMessage ? (
              <p className="text-sm text-green-700">{successMessage}</p>
            ) : null}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Remembered your password?{' '}
            <Link
              href="/login"
              className="font-medium text-slate-900 hover:text-red-600"
            >
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
