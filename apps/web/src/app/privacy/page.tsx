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
            This Privacy Policy explains how ER Democracy Bologna collects, uses,
            stores, protects, and shares personal data in connection with account
            registration, authentication, consultations, assessments,
            participation, platform administration, and related services.
          </p>
        </div>

        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Introduction</h2>
            <p className="text-base leading-7 text-slate-700">
              ER Democracy Bologna is committed to protecting personal data and
              processing it lawfully, fairly, and transparently. This Privacy
              Policy describes what information may be collected through the
              platform, why it is processed, how long it may be retained, and the
              rights available to users under applicable data protection laws,
              including the General Data Protection Regulation (GDPR) where
              applicable.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Data controller and scope</h2>
            <p className="text-base leading-7 text-slate-700">
              This policy applies to personal data processed through the ER
              Democracy Bologna platform in relation to account access,
              consultation participation, assessment functionality, administrative
              review, audit logging, and security controls. It applies to both
              public-facing and authenticated areas of the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Categories of data we collect</h2>
            <p className="text-base leading-7 text-slate-700">
              We may collect and process account information such as full name,
              email address, user role, account status, email verification
              status, and the date on which legal terms were accepted during
              registration.
            </p>
            <p className="text-base leading-7 text-slate-700">
              We may also process authentication and security information such as
              encrypted password data, refresh tokens, verification tokens,
              password reset tokens, login timestamps, failed login counts,
              account lock status, and related security event logs.
            </p>
            <p className="text-base leading-7 text-slate-700">
              Where platform features require it, we may process consultation and
              participation data such as submitted votes, selected options,
              weighting inputs, self-assessment scores, and consultation-related
              activity needed to calculate results and maintain the integrity of
              the system.
            </p>
            <p className="text-base leading-7 text-slate-700">
              For assessment-based participation, we may process profile and
              contextual data such as age range, gender, city, region, country,
              stakeholder role, background category, experience level, and
              relationship to area where such data is submitted by the user as
              part of assessment functionality.
            </p>
            <p className="text-base leading-7 text-slate-700">
              We may also process technical and service information, including IP
              address, browser or device-related information, and request
              metadata where necessary for security, fraud prevention, audit, and
              system maintenance purposes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. How we use personal data</h2>
            <p className="text-base leading-7 text-slate-700">
              Personal data is processed to create and manage user accounts,
              authenticate users securely, verify email addresses, send password
              reset messages, manage consultations, record participation, compute
              voting results, apply visibility settings, administer the platform,
              support auditability, respond to user requests, and protect the
              platform against misuse, unauthorized access, and fraud.
            </p>
            <p className="text-base leading-7 text-slate-700">
              Data may also be used to generate aggregated analytics and
              breakdowns related to participation, provided that public-facing
              displays are configured to avoid exposing personal information more
              broadly than intended by the platform&apos;s visibility controls and
              administrative permissions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Legal bases for processing</h2>
            <p className="text-base leading-7 text-slate-700">
              Depending on the specific processing activity, personal data may be
              processed on one or more of the following legal bases:
            </p>
            <div className="space-y-3 text-base leading-7 text-slate-700">
              <p>
                <span className="font-semibold text-slate-900">Performance of a contract:</span>{' '}
                to create and manage accounts, provide authentication, enable
                platform access, and operate consultation participation features.
              </p>
              <p>
                <span className="font-semibold text-slate-900">Legitimate interests:</span>{' '}
                to protect the platform, prevent abuse, maintain audit logs,
                secure accounts, and ensure the reliability and integrity of
                services.
              </p>
              <p>
                <span className="font-semibold text-slate-900">Legal obligation:</span>{' '}
                where retention, disclosure, or other processing is required by
                applicable law or lawful authority.
              </p>
              <p>
                <span className="font-semibold text-slate-900">Consent:</span>{' '}
                where consent is specifically requested and relied upon for a
                distinct activity under applicable law.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Authentication, cookies, and security controls</h2>
            <p className="text-base leading-7 text-slate-700">
              The platform uses security-focused authentication controls,
              including hashed passwords, token-based authentication, refresh
              token cookies, account lock controls, input validation, and related
              security protections. Authentication cookies used to keep users
              signed in or to secure access are treated as essential platform
              cookies required for the service to function.
            </p>
            <p className="text-base leading-7 text-slate-700">
              Additional details about cookie use can be found in the platform
              Cookie Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Email communications</h2>
            <p className="text-base leading-7 text-slate-700">
              Email addresses may be used for registration confirmation, email
              verification, password reset flows, account security notices, and
              other essential service communications. These communications are
              used for operational and security purposes and are not required to
              include marketing consent in order to deliver core account and
              service functions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Consultation and assessment data visibility</h2>
            <p className="text-base leading-7 text-slate-700">
              Consultation participation and assessment-related data may be used
              to calculate raw or weighted results, participation summaries, and
              demographic or contextual breakdowns where such functionality is
              enabled. Public visibility of results and analytics is controlled by
              consultation display settings and administrative permissions.
            </p>
            <p className="text-base leading-7 text-slate-700">
              Personal information is not intended to be published directly in
              public consultation results. Internal administrative access is
              restricted by authentication, permissions, and role-based access
              controls.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Sharing of personal data</h2>
            <p className="text-base leading-7 text-slate-700">
              Personal data may be processed by service providers that support
              the technical operation of the platform, such as hosting,
              infrastructure, database, and transactional email providers. Such
              processing is limited to what is necessary for service delivery,
              security, and maintenance.
            </p>
            <p className="text-base leading-7 text-slate-700">
              We do not sell personal data. Data may also be disclosed where
              required by law, regulation, legal process, or lawful governmental
              request.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. International transfers</h2>
            <p className="text-base leading-7 text-slate-700">
              Where infrastructure or service providers process data outside the
              jurisdiction in which it was collected, such transfers should be
              subject to appropriate safeguards required by applicable law,
              including contractual or organizational protections where relevant.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">11. Data retention</h2>
            <p className="text-base leading-7 text-slate-700">
              We retain personal data only for as long as necessary to provide
              the platform, maintain consultation records, support legitimate
              administrative and audit needs, enforce security controls, resolve
              disputes, meet legal obligations, and preserve records required for
              system integrity.
            </p>
            <p className="text-base leading-7 text-slate-700">
              Retention periods may differ depending on the type of data,
              including account records, consultation submissions, security logs,
              password reset and verification records, and audit entries.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">12. Security measures</h2>
            <p className="text-base leading-7 text-slate-700">
              The platform applies technical and organizational safeguards to
              protect personal data, including access controls, password hashing,
              token-based session handling, request validation, account lock
              controls, audit logging, and other security-conscious design and
              operational measures appropriate to the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">13. Your rights</h2>
            <p className="text-base leading-7 text-slate-700">
              Subject to applicable law, users may have the right to request
              access to personal data, correction of inaccurate data, deletion of
              data, restriction of processing, objection to certain processing,
              and data portability. Rights may be limited where continued
              processing is necessary for legal compliance, security, audit,
              fraud prevention, or the establishment, exercise, or defense of
              legal claims.
            </p>
            <p className="text-base leading-7 text-slate-700">
              The platform may also provide account-related tools or request
              flows for access and deletion where implemented.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">14. Children&apos;s data</h2>
            <p className="text-base leading-7 text-slate-700">
              The platform is not intended for unlawful or unauthorized use by
              individuals who are not permitted to use the service under
              applicable law. Where age-related restrictions apply, users should
              access the platform only where legally permitted.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">15. Updates to this policy</h2>
            <p className="text-base leading-7 text-slate-700">
              This Privacy Policy may be updated from time to time to reflect
              legal, technical, or operational changes. The latest version will
              be published on this page with the updated wording applying from
              the time of publication unless a different effective date is stated.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">16. Contact</h2>
            <p className="text-base leading-7 text-slate-700">
              For privacy-related questions, data rights requests, or concerns,
              please use the platform contact page or the designated
              administrative contact channel made available by ER Democracy
              Bologna.
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
            href="/cookies"
            className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
          >
            View cookie policy →
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
