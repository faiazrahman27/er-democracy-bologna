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
            These Terms of Service define the conditions under which users access
            and use the ER Democracy Bologna platform, including account
            registration, authentication, consultations, assessments,
            participation features, public content, and administrative functions.
          </p>
        </div>

        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Acceptance of terms</h2>
            <p className="text-base leading-7 text-slate-700">
              By accessing, registering for, or using the platform, you agree to
              be bound by these Terms of Service and the related Privacy Policy
              and Cookie Policy. If you do not agree with these terms, you should
              not use the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Purpose of the platform</h2>
            <p className="text-base leading-7 text-slate-700">
              ER Democracy Bologna provides a structured digital environment for
              civic participation, consultations, assessments, result visibility,
              and related administrative review. The platform is intended to
              support transparent, secure, and accountable participation and
              governance-related processes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Eligibility and account registration</h2>
            <p className="text-base leading-7 text-slate-700">
              To use authenticated areas of the platform, you may be required to
              create an account and provide accurate, current, and complete
              information. You are responsible for ensuring that your registration
              details remain accurate and for updating them where necessary.
            </p>
            <p className="text-base leading-7 text-slate-700">
              You may only register and use an account where you are legally
              permitted to do so and where your use does not violate any
              applicable law, regulation, or valid platform rule.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Account security</h2>
            <p className="text-base leading-7 text-slate-700">
              You are responsible for maintaining the confidentiality of your
              login credentials and for activities carried out through your
              account. You must not share your password or knowingly allow
              unauthorized access to your account.
            </p>
            <p className="text-base leading-7 text-slate-700">
              The platform may apply security protections such as verification,
              refresh token controls, failed login tracking, temporary account
              locks, and other safeguards designed to protect users and the
              integrity of the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Acceptable use</h2>
            <p className="text-base leading-7 text-slate-700">
              You agree not to misuse the platform, interfere with its operation,
              attempt unauthorized access, bypass permissions, automate abuse,
              manipulate consultations, submit fraudulent or misleading
              information, or use the platform in a manner that could damage the
              service, other users, or public trust in consultation outcomes.
            </p>
            <p className="text-base leading-7 text-slate-700">
              You must also not introduce malicious code, attempt credential
              attacks, scrape restricted areas without authorization, or use the
              platform for unlawful, harmful, or deceptive purposes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Consultations, assessments, and submissions</h2>
            <p className="text-base leading-7 text-slate-700">
              Participation in consultations must follow the rules, timing,
              visibility settings, and methodology applicable to each
              consultation. Depending on the consultation type, participation may
              involve standard voting, assessment-based weighting, or
              self-assessment inputs.
            </p>
            <p className="text-base leading-7 text-slate-700">
              Users are responsible for reviewing the available options and
              consultation information before submitting a vote or related input.
              The platform may restrict, validate, or reject participation where
              rules are not met or where security and integrity controls require
              it.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Results, analytics, and public visibility</h2>
            <p className="text-base leading-7 text-slate-700">
              Consultation results and participation analytics may be displayed
              according to the visibility settings configured for each
              consultation. Some consultations may show no results, limited
              results, raw results, weighted results, or both, and visibility may
              depend on whether the user has voted or whether the consultation has
              closed.
            </p>
            <p className="text-base leading-7 text-slate-700">
              Aggregated or anonymized data may be displayed publicly where the
              platform configuration allows it. Individual personal information is
              not intended to be publicly exposed beyond what is necessary for
              legitimate platform administration and authorized functionality.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Administrative roles and internal access</h2>
            <p className="text-base leading-7 text-slate-700">
              Certain users may hold administrative roles with elevated
              permissions. Administrative access is limited by role-based
              permissions and may include the ability to manage consultations,
              review analytics, inspect participation records, manage published
              content, or view audit-related information as permitted by the
              system.
            </p>
            <p className="text-base leading-7 text-slate-700">
              Administrative use is expected to be responsible, authorized, and
              consistent with the purpose of the platform. Administrative actions
              may be logged for accountability and security purposes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Content and intellectual property</h2>
            <p className="text-base leading-7 text-slate-700">
              Platform structure, interface design, text, branding, code, and
              related content are protected to the extent permitted by applicable
              law. Except where otherwise stated, you may not copy, redistribute,
              modify, reverse engineer, or commercially exploit the platform or
              its protected content without appropriate authorization.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Suspension, restriction, and termination</h2>
            <p className="text-base leading-7 text-slate-700">
              The platform may suspend, restrict, or terminate access where
              necessary to protect security, enforce these terms, respond to
              misuse, address fraud or abuse, comply with legal obligations, or
              preserve the integrity of consultations and administrative
              operations.
            </p>
            <p className="text-base leading-7 text-slate-700">
              Restriction or termination may occur without advance notice where
              immediate action is reasonably required for security or legal
              reasons.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">11. Service availability</h2>
            <p className="text-base leading-7 text-slate-700">
              The platform is provided on an “as available” and “as provided”
              basis. While reasonable efforts may be made to maintain availability,
              reliability, and security, uninterrupted access, error-free
              operation, and permanent availability cannot be guaranteed.
            </p>
            <p className="text-base leading-7 text-slate-700">
              Maintenance, updates, security actions, infrastructure failures, or
              external provider issues may affect platform performance or
              availability from time to time.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">12. Limitation of liability</h2>
            <p className="text-base leading-7 text-slate-700">
              To the fullest extent permitted by applicable law, ER Democracy
              Bologna is not liable for indirect, incidental, consequential, or
              special damages, including loss of opportunity, loss of data, or
              service interruption arising from or related to platform use, user
              conduct, third-party services, infrastructure issues, or events
              outside reasonable control.
            </p>
            <p className="text-base leading-7 text-slate-700">
              Nothing in these terms excludes liability where exclusion is not
              permitted by applicable law.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">13. Privacy and data protection</h2>
            <p className="text-base leading-7 text-slate-700">
              Use of the platform is also governed by the Privacy Policy and
              Cookie Policy. Those pages explain how personal data is processed,
              what cookies are used, and what rights may apply to users under
              relevant data protection law.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">14. Changes to these terms</h2>
            <p className="text-base leading-7 text-slate-700">
              These Terms of Service may be updated periodically to reflect legal,
              operational, technical, or policy changes. Continued use of the
              platform after an updated version is published may constitute
              acceptance of the revised terms, unless applicable law requires a
              different form of notice or acceptance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">15. Governing law and interpretation</h2>
            <p className="text-base leading-7 text-slate-700">
              These terms are intended to operate in accordance with applicable
              law, including relevant European Union legal standards where
              applicable. If any part of these terms is found unenforceable, the
              remaining provisions will continue to apply to the extent permitted
              by law.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">16. Contact</h2>
            <p className="text-base leading-7 text-slate-700">
              For questions about these terms, platform use, or legal requests,
              please use the platform contact page or the designated
              administrative contact channel made available by ER Democracy
              Bologna.
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
            href="/cookies"
            className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
          >
            View cookie policy →
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
