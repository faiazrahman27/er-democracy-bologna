import Link from "next/link";

const CONTACT_EMAIL = "admin@er-democracy-bologna.xyz";

export default function ContactPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <section className="px-5 py-10 sm:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:items-start">
            <section className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                Contact
              </p>

              <h1 className="mt-4 max-w-4xl break-words text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                Get in touch.
              </h1>

              <p className="mt-6 max-w-3xl break-words text-base leading-8 text-slate-600">
                For questions related to the platform, consultations, account
                access, privacy, legal requests, or platform issues, contact ER
                Democracy Bologna through the official email below.
              </p>

              <div className="mt-8 border border-slate-200 bg-white px-5 py-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-[0_34px_90px_rgba(15,23,42,0.12)] active:-translate-y-1 active:scale-[0.99] active:border-green-200">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Official email
                </p>

                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="mt-3 block break-words text-xl font-black tracking-[-0.03em] text-green-700 underline underline-offset-4 transition duration-300 hover:text-green-800 active:text-green-800 sm:text-2xl"
                >
                  {CONTACT_EMAIL}
                </a>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Use this address for general, technical, privacy, legal, and
                  administrative matters.
                </p>
              </div>
            </section>

            <section className="grid min-w-0 gap-5">
              <ContactBlock
                title="General inquiries"
                body="For questions about ER Democracy Bologna, platform usage, consultations, public content, or participation flows."
              />

              <ContactBlock
                title="Platform support"
                body="For issues related to login, email verification, password reset, account access, consultation pages, or platform functionality."
              />

              <ContactBlock
                title="Privacy and GDPR requests"
                body="For personal data requests, including access, correction, deletion, restriction, objection, or data portability."
              />

              <ContactBlock
                title="Legal and administrative matters"
                body="For legal notices, policy questions, or administrative matters related to the operation of the platform."
              />
            </section>
          </div>

          <section className="mt-12 grid gap-5 md:grid-cols-2">
            <div className="min-w-0 border border-slate-200 bg-white p-6 shadow-[0_20px_64px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_28px_80px_rgba(15,23,42,0.10)] active:-translate-y-1 active:scale-[0.99]">
              <h2 className="break-words text-2xl font-black tracking-[-0.04em] text-slate-950">
                What to include
              </h2>

              <div className="mt-5 grid gap-4 text-base leading-8 text-slate-700">
                <p>
                  Include your account email address and a clear explanation of
                  the issue or request.
                </p>

                <p>
                  For platform issues, include the page you were using, the
                  action you attempted, and any visible error message.
                </p>

                <p>
                  For privacy or account requests, include the nature of your
                  request and the context needed to identify the relevant data.
                </p>
              </div>
            </div>

            <div className="min-w-0 border border-slate-200 bg-white p-6 shadow-[0_20px_64px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_28px_80px_rgba(15,23,42,0.10)] active:-translate-y-1 active:scale-[0.99]">
              <h2 className="break-words text-2xl font-black tracking-[-0.04em] text-slate-950">
                Response time
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-700">
                We aim to respond within a reasonable timeframe. Privacy and data
                protection requests are handled in accordance with applicable
                legal requirements and may require identity verification before
                action is taken.
              </p>
            </div>
          </section>

          <div className="mt-14 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:flex-wrap">
            <FooterLink href="/privacy">Privacy →</FooterLink>
            <FooterLink href="/terms">Terms →</FooterLink>
            <FooterLink href="/cookies">Cookie policy →</FooterLink>
          </div>
        </div>
      </section>
    </main>
  );
}

function ContactBlock({ title, body }: { title: string; body: string }) {
  return (
    <article className="min-w-0 border border-slate-200 bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-[0_26px_74px_rgba(15,23,42,0.10)] active:-translate-y-1 active:scale-[0.99] active:border-green-200">
      <h2 className="break-words text-xl font-black tracking-[-0.035em] text-slate-950">
        {title}
      </h2>

      <p className="mt-3 text-base leading-7 text-slate-700">{body}</p>

      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center border border-green-500 bg-white px-4 text-sm font-black text-green-700 shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-green-50 hover:shadow-md active:-translate-y-1 active:scale-[0.98] active:bg-green-50 sm:w-auto"
      >
        Email us →
      </a>
    </article>
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
