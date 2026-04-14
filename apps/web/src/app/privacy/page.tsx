import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Legal
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            This page explains how ER Democracy Bologna collects, uses, stores,
            and protects personal information in connection with platform access,
            consultations, participation, and related services.
          </p>
        </div>

        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Introduction</h2>
            <p className="text-base leading-7 text-slate-700">
              ER Democracy Bologna is committed to protecting user privacy and
              handling personal data responsibly. This Privacy Policy describes
              the categories of data we collect, the reasons we process it, and
              the safeguards we apply across the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Information we collect</h2>
            <p className="text-base leading-7 text-slate-700">
              We may collect account information such as full name, email address, platform role, account status, and securely stored authentication data. Passwords are not stored in plain text and are protected using secure hashing methods.

            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. How we use information</h2>
            <p className="text-base leading-7 text-slate-700">
              Personal data is used to provide secure access to the platform,
              manage consultations, authenticate users, support participation
              features, enforce permissions, maintain auditability, and improve
              the reliability and transparency of platform operations.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Email and communications</h2>
            <p className="text-base leading-7 text-slate-700">
              Email addresses may be used for account verification, security
              notifications, login-related communication, and essential service
              messages. We do not use verification or security messaging for
              unrelated promotional communication.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Consultation and assessment data</h2>
            <p className="text-base leading-7 text-slate-700">
              Depending on platform functionality, participation-related data may
              include consultation submissions, weighted voting inputs,
              self-assessment inputs, and aggregated analytical breakdowns.
              Public-facing displays are designed to avoid exposing sensitive
              personal information directly.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Legal basis and access control</h2>
            <p className="text-base leading-7 text-slate-700">
              Data is processed only where necessary for platform operation,
              legitimate administrative purposes, consultation management, user
              authentication, and compliance requirements. Access to sensitive
              information is restricted by role-based permissions and internal
              security controls.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Data retention</h2>
            <p className="text-base leading-7 text-slate-700">
              We retain data only for as long as necessary to operate the
              platform, preserve consultation records, support security and audit
              requirements, and comply with applicable legal or institutional
              obligations.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Security</h2>
            <p className="text-base leading-7 text-slate-700">
              The platform applies technical and organizational safeguards to
              protect user data, including authenticated access, secure password
              handling, controlled administrative permissions, validation of
              submitted inputs, and security-conscious system design.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. User rights</h2>
            <p className="text-base leading-7 text-slate-700">
              Users may have rights regarding their personal data, including the
              right to access, correct, or request deletion of information where
              applicable. Requests may be subject to platform obligations,
              security considerations, and legal retention requirements.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Contact</h2>
            <p className="text-base leading-7 text-slate-700">
              For privacy-related questions, requests, or concerns, please use
              the contact page of the platform or the designated administrative
              contact channel provided by ER Democracy Bologna.
            </p>
          </section>
        </div>

        <div className="mt-14 flex flex-wrap gap-4 border-t border-slate-200 pt-6">
          <Link
            href="/terms"
            className="text-sm font-medium text-slate-700 transition hover:text-green-700"
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
