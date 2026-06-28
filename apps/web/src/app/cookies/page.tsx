import Link from "next/link";

const CONTACT_EMAIL = "admin@er-democracy-bologna.xyz";

const COOKIE_SECTIONS = [
  {
    title: "1. What cookies are",
    body: [
      "Cookies are small text files stored on your device when you visit a website or use an online service. Similar technologies may include local storage, session storage, pixels, or device identifiers.",
      "Cookies and similar technologies can be used to keep a user signed in, protect account access, remember preferences, support platform functionality, and help operate online services securely.",
    ],
  },
  {
    title: "2. How ER Democracy Bologna uses cookies",
    body: [
      "ER Democracy Bologna uses cookies and similar technologies mainly to operate the platform, support account access, maintain secure sessions, remember choices, and protect the service against misuse.",
      "The platform is not intended to use non-essential advertising or profiling cookies as part of its core civic participation functionality.",
    ],
  },
  {
    title: "3. Essential cookies",
    body: [
      "Essential cookies are required for the platform to work properly. They may be used for authentication, session continuity, account security, request protection, cookie-preference storage, and access to secure areas.",
      "Because these cookies are necessary for core platform functionality, they cannot normally be disabled through the platform without affecting login, account access, or secure participation features.",
    ],
  },
  {
    title: "4. Authentication and security cookies",
    body: [
      "Authentication and security cookies help keep users signed in, protect sessions, support password and email-verification flows, and reduce the risk of unauthorized access.",
      "If these cookies are blocked or deleted, you may be logged out, unable to access account-based features, or required to sign in again.",
    ],
  },
  {
    title: "5. Preference cookies",
    body: [
      "Preference cookies may be used to remember choices such as cookie preferences, interface settings, or other user-selected options.",
      "Where preference cookies are necessary to respect a user choice or provide a requested setting, they may be treated as functional cookies.",
    ],
  },
  {
    title: "6. Analytics and non-essential cookies",
    body: [
      "At this time, the platform is intended to rely on essential and functional cookies for operation, security, and user preferences.",
      "If optional analytics, advertising, profiling, or third-party tracking technologies are introduced in the future, this Cookie Policy should be updated and any legally required consent mechanism should be provided before those technologies are activated.",
      "You should be able to refuse non-essential cookies without losing access to the core platform, unless a specific optional feature clearly depends on them.",
    ],
  },
  {
    title: "7. Third-party services",
    body: [
      "The platform may rely on service providers for hosting, infrastructure, database operation, email delivery, security, and other operational support.",
      "Those providers may process technical information necessary to deliver their services. They are not intended to place non-essential tracking cookies through the core platform unless this is clearly disclosed and, where required, consent is obtained.",
    ],
  },
  {
    title: "8. Managing cookies",
    body: [
      "You can control or delete cookies through your browser settings. Most browsers allow you to block cookies, delete stored cookies, or receive warnings before cookies are stored.",
      "Blocking essential cookies may prevent login, session continuity, email verification, password reset, secure participation, and other account-based functionality from working correctly.",
    ],
  },
  {
    title: "9. Consent and withdrawal",
    body: [
      "Where the platform uses cookies that require consent, consent should be requested before those cookies are used.",
      "Where consent is requested, you should be able to withdraw or change your choice through the available cookie controls or browser settings, subject to technical limitations.",
      "Essential cookies used for security, authentication, and core platform operation may continue to be used because they are necessary for the service.",
    ],
  },
  {
    title: "10. Relationship with the Privacy Policy",
    body: [
      "Cookies may involve the processing of personal data where they identify or can be linked to a user, device, account, or session.",
      "For more information about how personal data is processed, including purposes, legal bases, retention, rights, and contact details, please review the Privacy Policy.",
    ],
  },
  {
    title: "11. Updates to this Cookie Policy",
    body: [
      "This Cookie Policy may be updated to reflect legal, technical, operational, or platform changes.",
      "The latest version will be published on this page. Where required by law, additional notice or consent may be requested for material changes.",
    ],
  },
  {
    title: "12. Contact",
    body: [
      `For questions about cookies, privacy, or platform data practices, contact ${CONTACT_EMAIL}.`,
    ],
  },
];

export default function CookiesPage() {
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
                Cookie Policy.
              </h1>

              <p className="mt-6 max-w-3xl break-words text-base leading-8 text-slate-600">
                This Cookie Policy explains how ER Democracy Bologna uses cookies
                and similar technologies for authentication, security,
                preferences, and platform functionality.
              </p>

              <div className="mt-8 border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-[0_34px_90px_rgba(15,23,42,0.12)] active:-translate-y-1 active:scale-[0.99] active:border-green-200">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Last updated
                </p>

                <p className="mt-3 text-lg font-black tracking-[-0.03em] text-slate-950">
                  28 June 2026
                </p>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Cookie and privacy contact:
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
                <SideLink href="/terms">Terms of Service →</SideLink>
                <SideLink href="/contact">Contact →</SideLink>
              </div>
            </aside>

            <section className="grid min-w-0 gap-5">
              {COOKIE_SECTIONS.map((section) => (
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
            <FooterLink href="/terms">View terms →</FooterLink>
            <FooterLink href="/contact">Contact us →</FooterLink>
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
