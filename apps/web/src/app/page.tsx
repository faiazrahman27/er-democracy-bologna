import Link from 'next/link';
import Image from 'next/image';
import { HomeHeroActions } from './home-hero-actions';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-white px-6 py-20 md:py-24">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-600 via-white to-red-600" />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-7rem] top-12 h-52 w-52 rounded-full bg-green-100/40 blur-3xl" />
          <div className="absolute right-[-7rem] top-20 h-60 w-60 rounded-full bg-red-100/40 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              ER Democracy Bologna
            </p>

            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
              Modern civic participation with clarity, trust, and institutional
              seriousness.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              Explore consultations, understand public decision-making, and take
              part in a platform built for transparent participation, privacy,
              and responsible governance.
            </p>

            <div className="mt-8">
              <HomeHeroActions />
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
                Structured consultation workflows
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                Privacy-aware public insights
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                Role-based governance access
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="aspect-[4/3] w-full">
              <Image
                src="/images/hero.jpg"
                alt="ER Democracy Bologna civic participation"
                width={1600}
                height={1200}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              What the platform offers
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              A clearer and more responsible way to engage with public
              consultation
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              ER Democracy Bologna combines public participation, methodology
              transparency, and administrative accountability in one secure
              digital environment.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="mb-4 h-1 w-14 rounded-full bg-green-600" />
              <h3 className="text-xl font-semibold">Public participation</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Citizens and stakeholders can participate in structured
                consultations through a platform built for openness, clarity,
                and civic legitimacy.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="mb-4 h-1 w-14 rounded-full bg-slate-300" />
              <h3 className="text-xl font-semibold">Transparent methodology</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                General, specialized, and self-assessment-based consultation
                models are presented with clearer result and visibility
                controls.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="mb-4 h-1 w-14 rounded-full bg-red-600" />
              <h3 className="text-xl font-semibold">Privacy-conscious design</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Individual identities remain protected while aggregated insights
                and authorized governance review still support public trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-6 py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Participation
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Civic technology with a modern product feel and a serious public
              tone
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              The platform is designed to reduce confusion, support meaningful
              participation, and improve confidence in how consultations are
              structured, reviewed, and communicated.
            </p>

            <div className="mt-6">
              <Link
                href="/consultations"
                className="inline-flex items-center text-sm font-semibold text-green-700 transition-colors duration-200 hover:text-green-800"
              >
                Explore active consultations
                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="aspect-[4/3] w-full">
              <Image
                src="/images/participation.jpg"
                alt="Community participation"
                width={1400}
                height={1050}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
          <div className="grid md:grid-cols-[0.95fr_1.05fr]">
            <div className="border-b border-slate-200 md:border-b-0 md:border-r">
              <div className="aspect-[4/3] w-full md:aspect-auto md:h-full">
                <Image
                  src="/images/city.jpg"
                  alt="Bologna city"
                  width={1400}
                  height={1050}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
              </div>
            </div>

            <div className="flex flex-col justify-center p-8 md:p-10">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <Image
                    src="/branding/ER-Democracy-Bologna-logo.png"
                    alt="ER Democracy Bologna"
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Built for trust
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    Designed for modern civic environments
                  </h2>
                </div>
              </div>

              <p className="mt-6 text-sm leading-7 text-slate-600 md:text-base">
                ER Democracy Bologna connects institutions, communities, and
                stakeholders through a platform that supports transparency,
                accountability, and meaningful public engagement.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/consultations"
                  className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md active:translate-y-0"
                >
                  View consultations
                </Link>

                <Link
                  href="/articles"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md active:translate-y-0"
                >
                  Read articles
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
