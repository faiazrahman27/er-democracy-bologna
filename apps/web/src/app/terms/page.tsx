import Link from "next/link";

const CONTACT_EMAIL = "admin@er-democracy-bologna.xyz";

const TERMS_SECTIONS = [
  {
    title: "1. Acceptance of these Terms",
    body: [
      "By accessing or using ER Democracy Bologna, you agree to these Terms of Service, together with the Privacy Policy and Cookie Policy. If you do not agree, you should not use the platform.",
      "These Terms apply to visitors, registered users, participants, and any person who accesses public or account-based areas of the platform.",
    ],
  },
  {
    title: "2. Platform purpose",
    body: [
      "ER Democracy Bologna is a civic participation platform for publishing consultations, sharing public information, collecting participation inputs, and displaying consultation-related results or updates where available.",
      "The platform supports civic engagement and public discussion. Unless clearly stated for a specific consultation, use of the platform does not create a legally binding public decision, public authority procedure, contract award, entitlement, or official administrative act.",
    ],
  },
  {
    title: "3. Accounts and eligibility",
    body: [
      "Some features require an account. When creating an account, you must provide accurate information and keep your account details up to date.",
      "You are responsible for maintaining the confidentiality of your login credentials and for activity carried out through your account. You must not share your password or allow unauthorized access.",
      "You may use the platform only where your use is lawful and where you have the capacity or required permission to accept these Terms.",
    ],
  },
  {
    title: "4. Acceptable use",
    body: [
      "You must use the platform responsibly and lawfully. You must not misuse the platform, interfere with its operation, attempt unauthorized access, bypass access controls, manipulate voting or participation, impersonate another person, or submit fraudulent, misleading, abusive, unlawful, or harmful material.",
      "You must not introduce malicious code, conduct credential attacks, scrape restricted areas, overload the service, or use the platform in a way that could damage the platform, other users, consultation integrity, or public trust.",
    ],
  },
  {
    title: "5. Consultations and participation",
    body: [
      "Each consultation may have its own timing, options, visibility settings, participation rules, and result-display method. You are responsible for reviewing the information shown before submitting any vote, assessment, comment, proposal, or other input.",
      "Participation may be accepted, restricted, rejected, corrected, or removed where necessary to enforce consultation rules, protect security, prevent abuse, comply with law, or preserve the integrity of the platform.",
      "Once submitted, certain participation inputs may not be editable, depending on the consultation design and integrity requirements.",
    ],
  },
  {
    title: "6. User content and submissions",
    body: [
      "You remain responsible for the content you submit. You must not submit content that is unlawful, discriminatory, threatening, defamatory, misleading, infringing, spam-like, or otherwise harmful.",
      "By submitting content, you allow ER Democracy Bologna to process, display, store, review, moderate, and use that content as needed to operate the platform, manage consultations, maintain records, and show participation outputs where applicable.",
      "Submitted content may be moderated, hidden, removed, or restricted if it breaches these Terms, consultation rules, legal requirements, or platform safety standards.",
    ],
  },
  {
    title: "7. Results and public visibility",
    body: [
      "Consultation results may be displayed publicly, privately, after participation, after closure, or not at all, depending on the settings and purpose of each consultation.",
      "Displayed results may be aggregated, summarized, weighted, or otherwise presented according to the consultation method. Public result pages should not be interpreted as exposing individual personal data unless the platform clearly states otherwise.",
      "Results, statistics, and participation summaries are provided for transparency and information. They may be corrected, updated, delayed, or removed where needed for accuracy, security, moderation, or legal reasons.",
    ],
  },
  {
    title: "8. Platform content",
    body: [
      "Text, interface elements, branding, layout, software, and other platform materials are protected where applicable. You may access and use them only for normal platform use unless separate permission is granted.",
      "You must not copy, reproduce, modify, reverse engineer, commercially exploit, or redistribute protected platform materials except where allowed by law or written authorization.",
    ],
  },
  {
    title: "9. Third-party services and links",
    body: [
      "The platform may rely on external service providers or link to external websites. ER Democracy Bologna is not responsible for third-party websites, services, content, availability, or policies.",
      "When you access third-party services or websites, their own terms and privacy rules may apply.",
    ],
  },
  {
    title: "10. Suspension and restriction",
    body: [
      "Access may be suspended, restricted, or terminated where necessary to protect users, prevent abuse, enforce these Terms, comply with legal obligations, protect consultation integrity, or maintain platform security.",
      "Immediate action may be taken without advance notice where reasonably necessary for security, legal, operational, or integrity reasons.",
    ],
  },
  {
    title: "11. Availability and changes",
    body: [
      "The platform is provided on an “as available” basis. Reasonable efforts may be made to maintain access, but uninterrupted availability, error-free operation, or permanent access cannot be guaranteed.",
      "Features, pages, consultations, content, or access conditions may be changed, suspended, or discontinued where needed for operational, legal, security, or policy reasons.",
    ],
  },
  {
    title: "12. Privacy and cookies",
    body: [
      "Use of the platform is also governed by the Privacy Policy and Cookie Policy. Those pages explain how personal data and cookies are handled, what rights may apply, and how to contact the platform about privacy-related matters.",
      "Where these Terms refer to account data, participation records, or security controls, those references should be read together with the Privacy Policy.",
    ],
  },
  {
    title: "13. Limitation of liability",
    body: [
      "To the fullest extent permitted by applicable law, ER Democracy Bologna is not liable for indirect, incidental, special, or consequential losses arising from platform use, unavailability, user conduct, third-party services, technical issues, or events outside reasonable control.",
      "Nothing in these Terms excludes or limits liability where exclusion or limitation is not permitted by applicable law.",
    ],
  },
  {
    title: "14. Changes to these Terms",
    body: [
      "These Terms may be updated to reflect legal, operational, technical, or policy changes. The latest version will be published on this page.",
      "Continued use of the platform after updated Terms are published means you accept the updated Terms, unless applicable law requires another form of notice or consent.",
    ],
  },
  {
    title: "15. Governing law",
    body: [
      "These Terms are intended to be interpreted in accordance with applicable Italian and European Union law, without prejudice to any mandatory rights or protections that cannot legally be excluded.",
      "If any part of these Terms is found invalid or unenforceable, the remaining parts will continue to apply to the fullest extent permitted by law.",
    ],
  },
  {
    title: "16. Contact",
    body: [
      `For questions about these Terms, platform use, legal notices, or administrative matters, contact ${CONTACT_EMAIL}.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <section className="px-5 py-10 sm:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1fr)] lg:items-start">
            <aside className="min-w-0 lg:sticky lg:top-28">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                Legal
              </p>

              <h1 className="mt-4 max-w-4xl break-words text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                Terms of Service.
              </h1>

              <p className="mt-6 max-w-3xl break-words text-base leading-8 text-slate-600">
                These Terms explain how ER Democracy Bologna may be accessed and
                used, including accounts, consultations, submissions, public
                content, acceptable use, and service limitations.
              </p>

              <div className="mt-8 border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-[0_34px_90px_rgba(15,23,42,0.12)] active:-translate-y-1 active:scale-[0.99] active:border-green-200">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Last updated
                </p>

                <p className="mt-3 text-lg font-black tracking-[-0.03em] text-slate-950">
                  28 June 2026
                </p>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Contact for legal or administrative questions:
                </p>

                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="mt-2 block break-words text-sm font-black text-green-700 underline underline-offset-4 transition duration-300 hover:text-green-800 active:text-green-800"
                >
                  {CONTACT_EMAIL}
                </a>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-col">
                <SideLink href="/privacy">Privacy Policy →</SideLink>
                <SideLink href="/cookies">Cookie Policy →</SideLink>
                <SideLink href="/contact">Contact →</SideLink>
              </div>
            </aside>

            <section className="grid min-w-0 gap-5">
              {TERMS_SECTIONS.map((section) => (
                <article
                  key={section.title}
                  className="min-w-0 border border-slate-200 bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_26px_74px_rgba(15,23,42,0.10)] active:-translate-y-1 active:scale-[0.99]"
                >
                  <h2 className="break-words text-xl font-black tracking-[-0.035em] text-slate-950 sm:text-2xl">
                    {section.title}
                  </h2>

                  <div className="mt-4 grid gap-4">
                    {section.body.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="break-words text-base leading-8 text-slate-700"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </section>
          </div>

          <div className="mt-14 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:flex-wrap">
            <FooterLink href="/privacy">View privacy →</FooterLink>
            <FooterLink href="/cookies">View cookie policy →</FooterLink>
            <FooterLink href="/contact">Contact →</FooterLink>
          </div>
        </div>
      </section>
    </main>
  );
}

function SideLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 w-full items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98] active:border-slate-400 active:bg-slate-50 sm:w-auto lg:w-full"
    >
      {children}
    </Link>
  );
}

function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 w-full items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98] active:border-slate-400 active:bg-slate-50 sm:w-auto"
    >
      {children}
    </Link>
  );
}
