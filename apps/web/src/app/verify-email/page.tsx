'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';

type VerifyEmailResponse = {
  message: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    emailVerified: boolean;
    isActive: boolean;
  };
};

type ResendVerificationResponse = {
  message: string;
};

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Email verification
            </p>

            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
              Verify your account
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Complete your email verification to activate sign-in access for ER
              Democracy Bologna.
            </p>

            <div className="mt-10">
              <p className="text-base text-slate-700">Verifying your email...</p>
            </div>
          </div>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();

  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

  const [status, setStatus] = useState<
    'loading' | 'success' | 'error' | 'idle'
  >(token ? 'loading' : 'idle');
  const [message, setMessage] = useState<string>(
    token ? 'Verifying your email...' : 'Verification token missing.',
  );
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus('idle');
        setMessage('Verification token missing.');
        return;
      }

      try {
        const response = await apiRequest<VerifyEmailResponse>(
          `/auth/verify-email?token=${encodeURIComponent(token)}`,
          {
            method: 'GET',
          },
        );

        setStatus('success');
        setMessage(response.message || 'Email verified successfully.');
        setVerifiedEmail(response.user?.email ?? '');
      } catch (err) {
        setStatus('error');
        setMessage(
          err instanceof Error
            ? err.message
            : 'Failed to verify your email.',
        );
      }
    }

    void verify();
  }, [token]);

  async function handleResendVerification() {
    setIsResending(true);
    setResendMessage(null);
    setResendError(null);

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
          : 'Failed to resend verification email.',
      );
    } finally {
      setIsResending(false);
    }
  }

  const loginHref = verifiedEmail
    ? `/login?verified=true&email=${encodeURIComponent(verifiedEmail)}`
    : '/login?verified=true';

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Email verification
        </p>

        <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
          Verify your account
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
          Complete your email verification to activate sign-in access for ER
          Democracy Bologna.
        </p>

        <div className="mt-10">
          {status === 'loading' ? (
            <p className="text-base text-slate-700">{message}</p>
          ) : null}

          {status === 'success' ? (
            <div className="space-y-5">
              <p className="text-base font-medium text-green-700">{message}</p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href={loginHref}
                  className="rounded-xl bg-green-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-700"
                >
                  Go to login
                </Link>

                <Link
                  href="/"
                  className="text-sm font-medium text-slate-700 transition hover:text-red-600"
                >
                  Back to home →
                </Link>
              </div>
            </div>
          ) : null}

          {status === 'error' || status === 'idle' ? (
            <div className="space-y-8">
              <p className="text-base font-medium text-red-600">{message}</p>

              <div className="max-w-md space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none transition focus:border-green-600"
                    placeholder="Enter your email to resend verification"
                  />
                </div>

                {resendMessage ? (
                  <p className="text-sm text-green-700">{resendMessage}</p>
                ) : null}

                {resendError ? (
                  <p className="text-sm text-red-600">{resendError}</p>
                ) : null}

                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isResending || !email.trim()}
                    className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {isResending
                      ? 'Sending verification...'
                      : 'Resend verification email'}
                  </button>

                  <Link
                    href="/login"
                    className="text-sm font-medium text-slate-700 transition hover:text-red-600"
                  >
                    Return to login →
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
