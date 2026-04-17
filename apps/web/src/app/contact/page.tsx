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
            For questions related to the platform, consultations, account access,
            privacy, legal requests, or technical issues, you can use the contact
            information below.
          </p>
        </div>

        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">General inquiries</h2>
            <p className="text-base leading-7 text-slate-700">
              For general questions about ER Democracy Bologna, platform usage,
              consultations, public content, or participation flows, please
              contact:
            </p>

            <p className="text-base font-medium text-slate-900">
              info@er-democracy-bologna.xyz
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Technical support</h2>
            <p className="text-base leading-7 text-slate-700">
              If you experience issues related to login, email verification,
              password reset, access, participation, consultation pages, or
              platform functionality, please contact:
            </p>

            <p className="text-base font-medium text-slate-900">
              support@er-democracy-bologna.xyz
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Privacy and GDPR requests</h2>
            <p className="text-base leading-7 text-slate-700">
              For requests relating to your personal data, including access,
              correction, deletion, restriction, objection, or data portability,
              please contact:
            </p>

            <p className="text-base font-medium text-slate-900">
              privacy@er-democracy-bologna.xyz
            </p>

            <p className="text-base leading-7 text-slate-700">
              When making a privacy request, please include enough information to
              identify your account and describe your request clearly. Additional
              verification may be required before any account or personal data is
              disclosed, exported, modified, or deleted.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Legal and administrative contact</h2>
            <p className="text-base leading-7 text-slate-700">
              For legal notices, policy questions, or administrative matters
              related to the operation of the platform, please contact:
            </p>

            <p className="text-base font-medium text-slate-900">
              admin@er-democracy-bologna.xyz
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">What to include in your message</h2>
            <div className="space-y-3 text-base leading-7 text-slate-700">
              <p>
                For faster support, please include your account email address and
                a clear explanation of the issue or request.
              </p>
              <p>
                For technical issues, include the page you were using, the action
                you attempted, and any visible error message.
              </p>
              <p>
                For privacy or account requests, include the nature of your
                request and any context necessary to identify the relevant data.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Response time</h2>
            <p className="text-base leading-7 text-slate-700">
              We aim to respond within a reasonable timeframe. Technical and
              general inquiries are handled as operational capacity allows.
              Privacy and data protection requests are handled in accordance with
              applicable legal requirements and may require identity verification
              before action is taken.
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

          <Link
            href="/cookies"
            className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
          >
            Cookie policy →
          </Link>
        </div>
      </div>
    </main>
  );
}
