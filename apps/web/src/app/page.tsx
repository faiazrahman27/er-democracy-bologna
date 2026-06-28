import Image from "next/image";
import Link from "next/link";
import { HomeHeroActions } from "./home-hero-actions";

const TYPEWRITER_TEXT = "ER Democracy Bologna";

const QUICK_PATHS = [
  {
    title: "Open a consultation",
    body: "Read the public question, the available choices, the deadline, and how voting works.",
  },
  {
    title: "Submit your vote",
    body: "Follow the voting method shown on that consultation page and take part clearly.",
  },
  {
    title: "Check the results",
    body: "Return after publication to see vote totals, weighted outcomes, or next steps.",
  },
];

const PLATFORM_AREAS = [
  {
    title: "Consultations",
    body: "The main participation area. Each consultation explains the question, choices, deadline, eligibility, and voting method.",
  },
  {
    title: "Results",
    body: "Published outcomes help people understand what was submitted, how votes were counted, and what happens next.",
  },
  {
    title: "Articles",
    body: "Public updates, announcements, explainers, and civic stories that help people stay informed.",
  },
];

const VOTE_TYPES = [
  {
    title: "General vote",
    body: "The simplest format. A participant selects an option, and each valid vote counts equally.",
  },
  {
    title: "Specialized vote",
    body: "Used when a topic needs more context. Participant assessment or extra questions can help explain the final voting weight.",
  },
  {
    title: "Self-assessment vote",
    body: "The participant selects an option and also gives a self-assessment score, showing how strongly they relate to the issue.",
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

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/78 via-slate-950/42 to-slate-950/12" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/74 via-transparent to-slate-950/18" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col px-5 pb-10 pt-24 sm:px-6 md:pb-14 lg:px-10 xl:px-14">
          <div className="flex justify-start">
            <HeroTypewriter text={TYPEWRITER_TEXT} />
          </div>

          <div className="mt-auto max-w-6xl">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-green-300">
              Civic participation for Bologna
            </p>

            <h1 className="mt-5 max-w-5xl break-words text-4xl font-black tracking-[-0.07em] text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Public consultations with clearer voting and results.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-100 md:text-lg md:leading-9">
              ER Democracy Bologna helps people understand open consultations,
              choose the right voting path, and follow what happens afterwards.
            </p>

            <div className="mt-8">
              <HomeHeroActions />
            </div>
          </div>

          <div className="mt-14 grid gap-4 border-t border-white/20 pt-6 sm:grid-cols-3">
            {QUICK_PATHS.map((item) => (
              <article key={item.title} className="min-w-0">
                <h2 className="break-words text-lg font-black tracking-[-0.03em] text-white">
                  {item.title}
                </h2>

                <p className="mt-2 max-w-sm text-sm leading-7 text-slate-200">
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
                A clear place for participation, outcomes, and public updates.
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
              Every consultation should explain how your vote is counted.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Before submitting, people should know what the question is, which
              options are available, who can participate, and which voting method
              is being used.
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
              Three ways a consultation can collect and explain votes.
            </h2>
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
              Go where you need to go.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Open consultations to participate, check results to understand
              outcomes, or read articles for public updates and civic explainers.
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

function HeroTypewriter({ text }: { text: string }) {
  return (
    <div className="max-w-full bg-transparent text-left">
      <style>
        {`
          @keyframes heroClassicTypewriter {
            0% {
              width: 0;
            }
            52% {
              width: 100%;
            }
            78% {
              width: 100%;
            }
            100% {
              width: 0;
            }
          }

          @keyframes heroClassicCursor {
            0%, 48% {
              border-color: #ffffff;
            }

            49%, 100% {
              border-color: transparent;
            }
          }
        `}
      </style>

      <span className="inline-block max-w-[calc(100vw-2.5rem)] bg-transparent font-mono text-[clamp(1.5rem,6.4vw,4.5rem)] font-black uppercase leading-none tracking-[-0.065em] text-white">
        <span
          className="inline-block overflow-hidden whitespace-nowrap border-r-[0.095em] border-white bg-transparent pr-[0.06em]"
          style={{
            animation:
              "heroClassicTypewriter 4s steps(21, end) infinite, heroClassicCursor 0.72s step-end infinite",
          }}
        >
          {text}
        </span>
      </span>
    </div>
  );
}
