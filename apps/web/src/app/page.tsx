import Image from "next/image";
import Link from "next/link";
import { HomeHeroActions } from "./home-hero-actions";

import { HomeTypewriter } from "./home-typewriter";

const TYPEWRITER_TEXT = "ER Democracy Bologna";

const QUICK_PATHS = [
  {
    title: "See what is open",
    body: "Browse active consultations and understand which public questions are available now.",
  },
  {
    title: "Read the context",
    body: "Check the background, timing, options, and rules before taking part.",
  },
  {
    title: "Participate when available",
    body: "Vote, assess, or submit input through the method shown on each consultation page.",
  },
];

const PLATFORM_AREAS = [
  {
    title: "Consultations",
    body: "Public questions with context, timing, options, and participation rules.",
  },
  {
    title: "Participation",
    body: "A clearer place to take part when a consultation is open.",
  },
  {
    title: "Updates",
    body: "Published information that helps people follow what happens next.",
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
            <HomeTypewriter text={TYPEWRITER_TEXT} />
          </div>

          <div className="mt-auto max-w-6xl">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-green-300">
              Civic participation platform
            </p>

            <h1 className="mt-5 max-w-5xl break-words text-4xl font-black tracking-[-0.07em] text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Public consultations, easier to understand.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-100 md:text-lg md:leading-9">
              Find active consultations, read the context, and take part when
              participation is open.
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
                Built around what people actually need to do.
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
              The next step should be obvious.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              A consultation page should make the topic, rules, and available
              action easy to understand before people participate.
            </p>
          </section>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-6 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 border-y border-slate-200 py-16 md:py-24 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start">
          <section className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-green-700">
              Public record
            </p>

            <h2 className="mt-3 max-w-3xl break-words text-3xl font-black tracking-[-0.055em] text-slate-950 sm:text-4xl md:text-5xl">
              People should be able to return and follow updates.
            </h2>
          </section>

          <p className="max-w-3xl text-base leading-8 text-slate-600 md:text-lg md:leading-9">
            ER Democracy Bologna keeps consultations, public information, and
            participation paths in one place, so people can understand what is
            open now and what has been published afterwards.
          </p>
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
              Available now
            </p>

            <h2 className="mt-3 max-w-3xl break-words text-3xl font-black tracking-[-0.055em] text-slate-950 sm:text-4xl">
              Go to the consultation list.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Choose a consultation, read the context, and follow the
              participation method shown on that page.
            </p>

            <div className="mt-8">
              <Link
                href="/consultations"
                className="inline-flex min-h-12 w-full items-center justify-center border border-green-700 bg-green-700 px-6 text-sm font-black text-white shadow-[0_20px_54px_rgba(22,163,74,0.22)] transition duration-300 hover:-translate-y-1 hover:bg-green-800 hover:shadow-[0_28px_74px_rgba(22,163,74,0.32)] active:-translate-y-1 active:scale-[0.98] active:bg-green-800 sm:w-auto"
              >
                View consultations
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function LetterTypewriter({ text }: { text: string }) {
  const letters = text.split("");

  return (
    <div className="max-w-full bg-transparent text-left">
      <style>
        {`
          @keyframes letterTypeReveal {
            0%, 3% {
              opacity: 0;
              filter: brightness(0.8);
              text-shadow: none;
            }
            7%, 74% {
              opacity: 1;
              filter: brightness(1.12);
              text-shadow:
                0 0 18px rgba(255,255,255,0.28),
                0 0 34px rgba(34,197,94,0.36);
            }
            78% {
              opacity: 1;
              filter: brightness(1.45);
              text-shadow:
                2px 0 0 rgba(34,197,94,0.42),
                -2px 0 0 rgba(220,38,38,0.32),
                0 0 38px rgba(255,255,255,0.38);
            }
            84%, 100% {
              opacity: 0;
              filter: brightness(0.9);
              text-shadow: none;
            }
          }

          @keyframes cursorTypePulse {
            0%, 100% {
              opacity: 1;
              transform: scaleY(1);
              box-shadow:
                0 0 18px rgba(34,197,94,0.85),
                0 0 34px rgba(255,255,255,0.22);
            }
            50% {
              opacity: 0.18;
              transform: scaleY(0.7);
              box-shadow:
                0 0 8px rgba(34,197,94,0.48),
                0 0 18px rgba(255,255,255,0.12);
            }
          }
        `}
      </style>

      <div className="inline-flex max-w-full items-center bg-transparent">
        <div
          className="flex max-w-full flex-wrap bg-transparent text-left text-[clamp(1.65rem,7vw,4.75rem)] font-black uppercase leading-none tracking-[-0.055em] text-white drop-shadow-[0_20px_46px_rgba(0,0,0,0.5)]"
          aria-label={text}
        >
          {letters.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              aria-hidden="true"
              className="inline-block bg-transparent opacity-0"
              style={{
                animation: "letterTypeReveal 7s linear infinite",
                animationDelay: `${index * 0.055}s`,
                willChange: "opacity, filter, text-shadow",
              }}
            >
              {letter === " " ? "\u00A0" : letter}
            </span>
          ))}
        </div>

        <span
          aria-hidden="true"
          className="ml-2 inline-block h-[1em] w-1 bg-green-400"
          style={{
            animation: "cursorTypePulse 0.42s ease-in-out infinite",
            willChange: "opacity, transform",
          }}
        />
      </div>
    </div>
  );
}
