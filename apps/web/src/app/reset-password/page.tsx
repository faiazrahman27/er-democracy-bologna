'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

type ResetPasswordResponse = {
  message: string;
};

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = useMemo(
    () => searchParams.get('token') ?? '',
    [searchParams],
  );

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest<ResetPasswordResponse>(
        '/auth/reset-password',
        {
          method: 'POST',
          body: {
            token,
            password,
          },
        },
      );

      setSuccessMessage(response.message);

      // redirect after short delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to reset password.',
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
            Set a new password.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Enter your new password below. This will replace your current
            password and log out any active sessions.
          </p>

          <div className="mt-8">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-green-700"
            >
              Back to login →
            </Link>
          </div>
        </section>

        <section>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none transition focus:border-green-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isSubmitting ? 'Resetting password...' : 'Reset password'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
