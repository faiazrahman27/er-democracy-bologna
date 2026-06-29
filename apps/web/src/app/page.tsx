import Image from "next/image";
import Link from "next/link";
import { HomeHeroActions } from "./home-hero-actions";
import { HomeTypewriter } from "./home-typewriter";

const TYPEWRITER_TEXT = "ER Democracy Bologna";

const QUICK_PATHS = [
  {
    title: "Open a consultation",
    body: "Read the question, the choices, the deadline, and who can take part.",
  },
  {
    title: "Understand the vote",
    body: "Each consultation explains the voting method before you submit your choice.",
  },
  {
    title: "Follow the result",
    body: "After publication, see the outcome, vote totals, and next steps in one place.",
  },
];

const PLATFORM_AREAS = [
  {
    title: "Consultations",
    body: "Open public questions where you can read the context, compare the available choices, and participate when voting is available.",
  },
  {
    title: "Results",
    body: "Published outcomes show what people chose, how votes were counted, and what happens after the consultation closes.",
  },
  {
    title: "Articles",
    body: "Updates, announcements, guides, and civic explainers help you understand the platform and the topics being discussed.",
  },
];

const VOTE_TYPES = [
  {
    title: "General vote",
    body: "A direct vote. You choose one available option, and each valid vote counts equally.",
  },
  {
    title: "Specialized vote",
    body: "Used when a topic needs more context. Extra questions or assessment answers can help explain how the final voting weight is calculated.",
  },
  {
    title: "Self-assessment vote",
    body: "You choose an option and also give a self-assessment score, such as how connected, informed, or affected you are by the topic.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <section className="relative min-h-[100svh] overflow-hidden bg-slate-950">
        <div className="absolute inset-x-0 top-0 z-30 h-[2px] bg-gradient-to-r from-green-600 via-white to-red-600" />

        <Image
          src="/images/hero.jpg"
          alt="People participating in a civic discussion"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/82 via-slate-950/46 to-slate-950/16" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/78 via-slate-950/10 to-slate-950/22" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_42%,rgba(22,163,74,0.28),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.12),transparent_30%)]" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col px-5 pb-10 pt-24 sm:px-6 md:pb-14 lg:px-10 xl:px-14">
          <div className="flex justify-start">
            <HomeTypewriter text={TYPEWRITER_TEXT} />
          </div>

          <div className="mt-auto max-w-6xl">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-green-300 drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]">
              Civic participation for Bologna
            </p>

            <h1 className="mt-5 max-w-5xl break-words text-4xl font-black tracking-[-0.07em] text-white drop-shadow-[0_18px_44px_rgba(0,0,0,0.62)] sm:text-5xl md:text-6xl lg:text-7xl">
              Read the issue, understand the vote, follow the result.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-100 drop-shadow-[0_10px_28px_rgba(0,0,0,0.55)] md:text-lg md:leading-9">
              ER Democracy Bologna helps people take part in public
              consultations with clear questions, clear voting methods, and
              clear results after the process closes.
            </p>

            <div className="mt-8">
              <HomeHeroActions />
            </div>
          </div>

          <div className="mt-14 grid gap-4 border-t border-white/20 pt-6 sm:grid-cols-3">
            {QUICK_PATHS.map((item) => (
              <article key={item.title} className="min-w-0">
                <h2 className="break-words text-lg font-black tracking-[-0.03em] text-white drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]">
                  {item.title}
                </h2>

                <p className="mt-2 max-w-sm text-sm leading-7 text-slate-200 drop-shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
            <section className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-green-700">
                Platform
              </p>

              <h2 className="mt-3 max-w-3xl break-words text-3xl font-black tracking-[-0.055em] text-slate-950 sm:text-4xl md:text-5xl">
                One place to read consultations, vote clearly, and understand
                what happened.
              </h2>
            </section>

            <section className="grid gap-0 border-t border-slate-200">
              {PLATFORM_AREAS.map((item) => (
                <article
                  key={item.title}
                  className="group grid gap-5 border-b border-slate-200 py-8 transition duration-300 hover:pl-3 active:pl-3 sm:grid-cols-[12rem_minmax(0,1fr)]"
                >
                  <h3 className="break-words text-2xl font-black tracking-[-0.045em] text-slate-950">
                    {item.title}
                  </h3>

                  <p className="max-w-2xl text-base leading-8 text-slate-600">
                    {item.body}
                  </p>
                </article>
              ))}
            </section>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-6 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
          <div className="relative h-[46vh] min-h-[360px] overflow-hidden bg-white shadow-[0_30px_96px_rgba(15,23,42,0.10)] md:min-h-[540px] lg:h-[64vh]">
            <Image
              src="/images/participation.jpg"
              alt="Community participation"
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-center transition duration-700 hover:scale-[1.012] active:scale-[1.012]"
            />
          </div>

          <section className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-green-700">
              Participation
            </p>

            <h2 className="mt-3 max-w-3xl break-words text-3xl font-black tracking-[-0.055em] text-slate-950 sm:text-4xl md:text-5xl">
              Before voting, you should know what your vote means.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              A consultation should make the question easy to understand, show
              the available choices, explain who can participate, and tell you
              how the vote will be counted.
            </p>
          </section>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-6 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 border-y border-slate-200 py-16 md:py-24 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start">
          <section className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-green-700">
              Voting methods
            </p>

            <h2 className="mt-3 max-w-3xl break-words text-3xl font-black tracking-[-0.055em] text-slate-950 sm:text-4xl md:text-5xl">
              Different consultations can use different voting methods.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Some topics need a simple vote. Others need extra context. The
              platform shows the voting method clearly so people know how their
              choice will be used.
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            {VOTE_TYPES.map((item) => (
              <article key={item.title} className="group min-w-0">
                <div className="h-1 w-12 bg-green-600 transition duration-300 group-hover:w-24" />

                <h3 className="mt-5 break-words text-2xl font-black tracking-[-0.045em] text-slate-950">
                  {item.title}
                </h3>

                <p className="mt-3 text-base leading-8 text-slate-600">
                  {item.body}
                </p>
              </article>
            ))}
          </section>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-6 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
          <div className="relative h-[42vh] min-h-[340px] overflow-hidden bg-white shadow-[0_30px_96px_rgba(15,23,42,0.10)] lg:h-[58vh]">
            <Image
              src="/images/city.jpg"
              alt="Bologna civic environment"
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-center transition duration-700 hover:scale-[1.012] active:scale-[1.012]"
            />
          </div>

          <section className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-green-700">
              Start here
            </p>

            <h2 className="mt-3 max-w-3xl break-words text-3xl font-black tracking-[-0.055em] text-slate-950 sm:text-4xl">
              Start with an open consultation.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Browse consultations to see where participation is open. Read
              articles for updates and explanations. Check results to understand
              the outcome after a consultation closes.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/consultations"
                className="inline-flex min-h-12 w-full items-center justify-center border border-green-700 bg-green-700 px-6 text-sm font-black text-white shadow-[0_20px_54px_rgba(22,163,74,0.22)] transition duration-300 hover:-translate-y-1 hover:bg-green-800 hover:shadow-[0_28px_74px_rgba(22,163,74,0.32)] active:-translate-y-1 active:scale-[0.98] active:bg-green-800 sm:w-auto"
              >
                View consultations
              </Link>

              <Link
                href="/articles"
                className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-6 text-sm font-black text-slate-950 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-green-600 hover:text-green-700 hover:shadow-md active:-translate-y-1 active:scale-[0.98] active:border-green-600 active:text-green-700 sm:w-auto"
              >
                Read articles
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
