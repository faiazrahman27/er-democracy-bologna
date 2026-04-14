import Link from 'next/link';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Contact
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
            Get in touch
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            For questions related to the platform, participation, or technical
            issues, you can reach out using the contact information below.
          </p>
        </div>

        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">General inquiries</h2>
            <p className="text-base leading-7 text-slate-700">
              For general questions about ER Democracy Bologna, platform usage,
              or consultations, please contact:
            </p>

            <p className="text-base font-medium text-slate-900">
              info@er-democracy-bologna.xyz
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Technical support</h2>
            <p className="text-base leading-7 text-slate-700">
              If you experience issues related to login, verification, access,
              or platform functionality, you can contact technical support at:
            </p>

            <p className="text-base font-medium text-slate-900">
              support@er-democracy-bologna.xyz
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Privacy requests</h2>
            <p className="text-base leading-7 text-slate-700">
              For requests regarding your personal data, including access,
              correction, or deletion, please contact:
            </p>

            <p className="text-base font-medium text-slate-900">
              privacy@er-democracy-bologna.xyz
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Response time</h2>
            <p className="text-base leading-7 text-slate-700">
              We aim to respond to inquiries within a reasonable timeframe.
              Response times may vary depending on the nature of the request and
              platform activity.
            </p>
          </section>
        </div>

        <div className="mt-14 flex flex-wrap gap-4 border-t border-slate-200 pt-6">
          <Link
            href="/privacy"
            className="text-sm font-medium text-slate-700 transition hover:text-green-700"
          >
            Privacy →
          </Link>

          <Link
            href="/terms"
            className="text-sm font-medium text-slate-700 transition hover:text-red-600"
          >
            Terms →
          </Link>
        </div>
      </div>
    </main>
  );
}
