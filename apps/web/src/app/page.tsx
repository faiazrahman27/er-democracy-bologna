import Image from "next/image";
import Link from "next/link";
import { HomeHeroActions } from "./home-hero-actions";
import { HomeTypewriter } from "./home-typewriter";

const TYPEWRITER_TEXT = "ER Democracy Bologna";

const QUICK_PATHS = [
  {
    title: "Open a consultation",
    body: "See the public question, the available choices, the deadline, and the participation rules before you take part.",
  },
  {
    title: "Understand the vote",
    body: "Each consultation clearly explains which voting method is being used before you submit your choice.",
  },
  {
    title: "Follow the result",
    body: "After publication, you can return to see the outcome, the counted votes, and the next public step.",
  },
];

const PLATFORM_AREAS = [
  {
    title: "Consultations",
    body: "Open public questions where you can read the issue, check the available choices, and participate when voting is active.",
  },
  {
    title: "Results",
    body: "Published outcomes show what people chose, how the vote was counted, and what happens after the consultation closes.",
  },
  {
    title: "Articles",
    body: "Announcements, explainers, guides, and public updates that help people stay informed about the platform and its topics.",
  },
];

const VOTE_TYPES = [
  {
    title: "General vote",
    body: "A straightforward format where you choose one option and every valid vote counts equally.",
  },
  {
    title: "Specialized vote",
    body: "Used when a topic needs more context. The consultation can include extra questions or additional information before the final vote is counted.",
  },
  {
    title: "Self-assessment vote",
    body: "You choose an option and add a self-assessment score, helping show how closely you relate to the issue being discussed.",
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
            <p className="micro text-green-300 drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]">
              Civic participation for Bologna
            </p>

            <h1 className="hero-title mt-5 max-w-5xl text-white drop-shadow-[0_18px_44px_rgba(0,0,0,0.62)]">
              Public consultations with clearer voting and results.
            </h1>

            <p className="body-copy mt-6 max-w-2xl text-slate-100 drop-shadow-[0_10px_28px_rgba(0,0,0,0.55)]">
              ER Democracy Bologna gives people one clear place to understand a
              consultation, choose the right voting path, and follow what
              happens after the vote.
            </p>

            <div className="mt-8">
              <HomeHeroActions />
            </div>
          </div>

          <div className="mt-14 grid gap-6 border-t border-white/20 pt-6 md:grid-cols-3">
            {QUICK_PATHS.map((item) => (
              <article key={item.title} className="min-w-0">
                <h2
                  className="card-title max-w-[18rem] text-white drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)] md:max-w-none"
                  style={{
                    wordBreak: "normal",
                    overflowWrap: "normal",
                    hyphens: "none",
                  }}
                >
                  {item.title}
                </h2>

                <p className="body-copy mt-3 max-w-sm text-slate-200 drop-shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.74fr)_minmax(0,1.26fr)]">
            <section className="min-w-0">
              <p className="micro text-green-700">Platform</p>

              <h2 className="section-title mt-3 max-w-3xl text-slate-950">
                One place to understand the question, take part, and follow the
                outcome.
              </h2>
            </section>

            <section className="grid gap-0 border-t border-slate-200">
              {PLATFORM_AREAS.map((item) => (
                <article
                  key={item.title}
                  className="group grid gap-4 border-b border-slate-200 py-8 transition duration-300 hover:pl-3 active:pl-3 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-6"
                >
                  <h3
                    className="consultation-title max-w-[18rem] text-slate-950"
                    style={{
                      wordBreak: "normal",
                      overflowWrap: "normal",
                      hyphens: "none",
                    }}
                  >
                    {item.title}
                  </h3>

                  <p className="body-copy max-w-2xl text-slate-600">
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
          <div className="relative h-[46vh] min-h-[360px] overflow-hidden bg-transparent md:min-h-[540px] lg:h-[64vh]">
            <Image
              src="/images/participation.jpg"
              alt="Community participation"
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-center transition duration-700 hover:scale-[1.012] active:scale-[1.012]"
            />
          </div>

          <section className="min-w-0">
            <p className="micro text-green-700">Participation</p>

            <h2 className="section-title mt-3 max-w-3xl text-slate-950">
              Every consultation should explain how your vote is counted.
            </h2>

            <p className="body-copy mt-5 max-w-2xl text-slate-600">
              Before participating, people should be able to understand the
              issue, review the options, check who can vote, and see which
              voting method is being used.
            </p>
          </section>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-6 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 border-y border-slate-200 py-16 md:py-24 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start">
          <section className="min-w-0">
            <p className="micro text-green-700">Voting methods</p>

            <h2 className="section-title mt-3 max-w-3xl text-slate-950">
              Three ways a consultation can collect and explain votes.
            </h2>

            <p className="body-copy mt-5 max-w-2xl text-slate-600">
              Some public questions need a simple vote. Others need more
              context. The platform shows the method clearly before
              participation begins.
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            {VOTE_TYPES.map((item) => (
              <article key={item.title} className="group min-w-0">
                <div className="h-1 w-12 bg-green-600 transition duration-300 group-hover:w-24" />

                <h3
                  className="card-title mt-5 text-slate-950"
                  style={{
                    wordBreak: "normal",
                    overflowWrap: "normal",
                    hyphens: "none",
                  }}
                >
                  {item.title}
                </h3>

                <p className="body-copy mt-3 text-slate-600">{item.body}</p>
              </article>
            ))}
          </section>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-6 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
          <div className="relative h-[42vh] min-h-[340px] overflow-hidden bg-transparent lg:h-[58vh]">
            <Image
              src="/images/city.jpg"
              alt="Bologna civic environment"
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-center transition duration-700 hover:scale-[1.012] active:scale-[1.012]"
            />
          </div>

          <section className="min-w-0">
            <p className="micro text-green-700">Start here</p>

            <h2 className="section-title mt-3 max-w-3xl text-slate-950">
              Go where you need to go.
            </h2>

            <p className="body-copy mt-5 max-w-2xl text-slate-600">
              Open consultations to participate, check results to understand
              outcomes, or read articles for public updates, explainers, and
              guides.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/consultations"
                className="inline-flex min-h-12 w-full items-center justify-center border border-green-700 bg-green-700 px-6 text-sm font-medium text-white shadow-[0_20px_54px_rgba(22,163,74,0.22)] transition duration-300 hover:-translate-y-1 hover:bg-green-800 hover:shadow-[0_28px_74px_rgba(22,163,74,0.32)] active:-translate-y-1 active:scale-[0.98] active:bg-green-800 sm:w-auto"
              >
                View consultations
              </Link>

              <Link
                href="/articles"
                className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-6 text-sm font-medium text-slate-950 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-green-600 hover:text-green-700 hover:shadow-md active:-translate-y-1 active:scale-[0.98] active:border-green-600 active:text-green-700 sm:w-auto"
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
