'use client';

import Link from 'next/link';
import { startTransition, useEffect, useState } from 'react';

const COOKIE_KEY = 'cookie_banner_acknowledged';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let nextVisibility = true;

    try {
      const stored = localStorage.getItem(COOKIE_KEY);

      nextVisibility = !stored;
    } catch {
      nextVisibility = true;
    }

    startTransition(() => {
      setIsVisible(nextVisibility);
    });
  }, []);

  function handleAcknowledge() {
    try {
      localStorage.setItem(COOKIE_KEY, 'acknowledged');
    } catch {}

    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-700 leading-6">
          <p className="font-medium text-slate-900">
            This platform uses essential cookies for secure login, session
            management, and account protection.
          </p>
          <p className="mt-1 text-slate-600">
            These cookies remain active because they are required for the
            service to work. This banner only records that you have seen the
            notice. You can read more in our{' '}
            <Link
              href="/cookies"
              className="font-medium text-slate-900 underline hover:text-green-700"
            >
              Cookie Policy
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            onClick={handleAcknowledge}
            className="rounded-xl bg-green-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-green-700"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
