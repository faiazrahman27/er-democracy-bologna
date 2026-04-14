'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { isAdminRole } from '@/lib/roles';
import { apiRequest } from '@/lib/api';

type RegisterResponse = {
  message: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading || !user) {
      return;
    }

    if (isAdminRole(user.role)) {
      router.replace('/admin');
    } else {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedFullName) {
      setError('Full name is required.');
      return;
    }

    if (!trimmedEmail) {
      setError('Email is required.');
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
      const response = await apiRequest<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: {
          fullName: trimmedFullName,
          email: trimmedEmail,
          password,
        },
      });

      setSuccessMessage(
        response.message || 'Account created successfully. You can sign in now.',
      );

      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Create account
          </p>

          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
            Join the platform for civic participation.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Create your account to access consultations, participate securely,
            and manage your civic profile in one place.
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              href="/consultations"
              className="text-sm font-medium text-slate-700 hover:text-green-700"
            >
              Browse consultations →
            </Link>

            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-red-600"
            >
              Already have an account? →
            </Link>
          </div>
        </section>

        <section>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-2 w-full border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none transition focus:border-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none transition focus:border-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none transition focus:border-slate-900"
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
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 w-full border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none transition focus:border-slate-900"
                required
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {successMessage ? (
              <p className="text-sm text-green-700">{successMessage}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Already have an account?{' '}
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
