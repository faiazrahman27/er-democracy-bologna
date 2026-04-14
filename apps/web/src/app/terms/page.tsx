import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Legal
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            These terms define the conditions under which users access and use
            the ER Democracy Bologna platform, including participation in
            consultations, account usage, and administrative functions.
          </p>
        </div>

        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Acceptance of terms</h2>
            <p className="text-base leading-7 text-slate-700">
              By accessing or using the platform, you agree to comply with these
              terms. If you do not agree, you should not use the platform or its
              services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Platform purpose</h2>
            <p className="text-base leading-7 text-slate-700">
              ER Democracy Bologna provides a structured environment for civic
              participation, consultation processes, and analytical evaluation.
              The platform is designed to ensure transparency, accountability,
              and controlled access to participation features.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. User accounts</h2>
            <p className="text-base leading-7 text-slate-700">
              Users are responsible for maintaining the confidentiality of their
              login credentials and for all activities conducted under their
              account. Accounts must be registered with accurate and valid
              information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Acceptable use</h2>
            <p className="text-base leading-7 text-slate-700">
              Users agree not to misuse the platform, interfere with system
              integrity, attempt unauthorized access, or submit fraudulent or
              misleading information. The platform may restrict or terminate
              access in case of violations.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Participation and submissions</h2>
            <p className="text-base leading-7 text-slate-700">
              Participation in consultations, including voting or assessment,
              must follow the defined rules of each consultation. Submissions may
              be subject to validation, weighting, and administrative review
              depending on the consultation type.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Administrative roles</h2>
            <p className="text-base leading-7 text-slate-700">
              Certain users are assigned administrative roles with elevated
              permissions. These roles are governed by internal rules and are
              subject to audit and accountability mechanisms within the system.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Data and content</h2>
            <p className="text-base leading-7 text-slate-700">
              Content submitted to the platform may be stored, processed, and
              displayed according to the platform’s functionality. Aggregated or
              anonymized results may be published depending on visibility
              settings and consultation design.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Availability</h2>
            <p className="text-base leading-7 text-slate-700">
              The platform is provided on an as-available basis. While efforts
              are made to ensure reliability, uninterrupted access is not
              guaranteed, and maintenance or updates may temporarily affect
              availability.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Limitation of liability</h2>
            <p className="text-base leading-7 text-slate-700">
              ER Democracy Bologna is not liable for indirect damages, loss of
              data, or misuse of the platform resulting from user actions,
              technical failures, or external factors beyond reasonable control.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Changes to terms</h2>
            <p className="text-base leading-7 text-slate-700">
              These terms may be updated periodically. Continued use of the
              platform after changes implies acceptance of the updated terms.
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
            href="/contact"
            className="text-sm font-medium text-slate-700 transition hover:text-red-600"
          >
            Contact →
          </Link>
        </div>
      </div>
    </main>
  );
}
