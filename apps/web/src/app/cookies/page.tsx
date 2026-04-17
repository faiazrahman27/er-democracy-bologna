import Link from 'next/link';

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Legal
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
            Cookie Policy
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            This Cookie Policy explains how ER Democracy Bologna uses cookies and
            similar technologies in connection with account access,
            authentication, security, and platform functionality.
          </p>
        </div>

        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. What cookies are</h2>
            <p className="text-base leading-7 text-slate-700">
              Cookies are small text files placed on your device when you visit a
              website or use an online service. They can be used to keep a user
              signed in, maintain secure sessions, remember preferences, and help
              a platform function correctly.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. How we use cookies</h2>
            <p className="text-base leading-7 text-slate-700">
              ER Democracy Bologna uses cookies and related browser storage only
              where necessary to operate core platform features, especially
              secure authentication and session continuity. These cookies help the
              platform protect user accounts, maintain signed-in sessions, and
              support secure access to authenticated areas.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Essential cookies</h2>
            <p className="text-base leading-7 text-slate-700">
              The platform uses essential cookies required for the operation of
              secure login and session handling. These may include refresh token
              cookies or equivalent authentication-related cookies used to keep
              users signed in and to support secure token refresh flows.
            </p>
            <p className="text-base leading-7 text-slate-700">
              These cookies are necessary for the service to function and do not
              require optional marketing-style consent where they are used solely
              for authentication, security, and core platform operation.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Security-related use</h2>
            <p className="text-base leading-7 text-slate-700">
              Cookies and related technologies may be used together with backend
              security mechanisms such as refresh token rotation, account lock
              protections, failed login tracking, request validation, and other
              safeguards designed to protect the platform and its users.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Analytics and tracking</h2>
            <p className="text-base leading-7 text-slate-700">
              At this time, the platform is intended to rely on essential cookies
              for authentication and platform operation. If non-essential
              analytics, advertising, or third-party tracking technologies are
              introduced in the future, this Cookie Policy should be updated and
              any legally required consent mechanisms should be implemented before
              those technologies are activated.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Third-party services</h2>
            <p className="text-base leading-7 text-slate-700">
              The platform may use third-party service providers for hosting,
              database infrastructure, email delivery, and related operational
              support. Where such providers are involved, they may process data
              necessary for service delivery and security, but they are not
              intended to place non-essential tracking cookies through the core
              platform without appropriate notice and, where required, consent.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Browser controls</h2>
            <p className="text-base leading-7 text-slate-700">
              Most browsers allow users to control cookies through browser
              settings. However, blocking or deleting essential authentication
              cookies may prevent login, session continuity, and access to secure
              parts of the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Related policies</h2>
            <p className="text-base leading-7 text-slate-700">
              For more information about how personal data is processed, please
              review the Privacy Policy. For rules governing use of the platform,
              please review the Terms of Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Updates to this policy</h2>
            <p className="text-base leading-7 text-slate-700">
              This Cookie Policy may be updated from time to time to reflect
              changes in law, technology, or platform functionality. The most
              recent version will be published on this page.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Contact</h2>
            <p className="text-base leading-7 text-slate-700">
              For questions about cookie use or related privacy matters, please
              use the platform contact page or the designated privacy contact
              channel made available by ER Democracy Bologna.
            </p>
          </section>
        </div>

        <div className="mt-14 flex flex-wrap gap-4 border-t border-slate-200 pt-6">
          <Link
            href="/privacy"
            className="text-sm font-medium text-slate-700 transition hover:text-green-700"
          >
            View privacy →
          </Link>

          <Link
            href="/terms"
            className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
          >
            View terms →
          </Link>

          <Link
            href="/contact"
            className="text-sm font-medium text-slate-700 transition hover:text-red-600"
          >
            Contact us →
          </Link>
        </div>
      </div>
    </main>
  );
}
