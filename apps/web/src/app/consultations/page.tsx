import Link from "next/link";
import { fetchPublicVotes } from "@/lib/votes";
import { formatDateTime, formatEnumLabel } from "@/lib/format";
import { ConsultationsHeroActions } from "./consultations-hero-actions";

export default async function ConsultationsPage() {
  const response = await fetchPublicVotes();

  const totalCount = response.votes.length;
  const ongoingCount = response.votes.filter(
    (vote) => vote.derivedStatus === "ONGOING",
  ).length;
  const upcomingCount = response.votes.filter(
    (vote) => vote.derivedStatus === "UPCOMING",
  ).length;
  const pastCount = response.votes.filter(
    (vote) => vote.derivedStatus === "PAST",
  ).length;

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <section className="px-5 py-10 sm:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <header className="mt-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Public consultations
                </p>

                <h1 className="mt-4 max-w-4xl break-words text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                  Open votes and public decisions
                </h1>

                <p className="mt-6 max-w-3xl break-words text-base leading-8 text-slate-600">
                  Browse published consultations, check their status, and open
                  the one you want to review or vote on.
                </p>

                <div className="mt-8">
                  <ConsultationsHeroActions />
                </div>
              </div>

              <aside className="border-y border-slate-200 py-5 lg:mt-11">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Consultation count
                </p>

                <div className="mt-4 grid gap-4">
                  <StatLine label="Total published" value={String(totalCount)} />
                  <StatLine
                    label="Ongoing"
                    value={String(ongoingCount)}
                    tone={ongoingCount > 0 ? "success" : "default"}
                  />
                  <StatLine
                    label="Upcoming"
                    value={String(upcomingCount)}
                    tone={upcomingCount > 0 ? "warning" : "default"}
                  />
                  <StatLine label="Past" value={String(pastCount)} tone="muted" />
                </div>
              </aside>
            </div>
          </header>

          {response.votes.length === 0 ? (
            <section className="mt-12 border-y border-slate-200 py-8">
              <h2 className="text-2xl font-black tracking-[-0.045em] text-slate-950">
                No consultations available
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                There are currently no published consultations to display.
              </p>
            </section>
          ) : (
            <section className="mt-12 border-t border-slate-200 pt-8">
              <div className="mb-8 max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Consultation list
                </p>
                <h2 className="mt-3 break-words text-3xl font-black tracking-[-0.05em] text-slate-950 md:text-4xl">
                  Available consultations
                </h2>
              </div>

              <div className="divide-y divide-slate-200 border-y border-slate-200">
                {response.votes.map((vote) => (
                  <Link
                    key={vote.id}
                    href={`/consultations/${vote.slug}`}
                    className="group block px-4 py-7 transition duration-300 hover:bg-slate-50/70 active:bg-slate-50 sm:px-6 lg:px-8"
                  >
                    <article className="grid min-w-0 gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(220px,300px)] lg:items-start">
                      <div className="min-w-0">
                        <div className="flex max-w-full flex-wrap items-center gap-2">
                          <StatusBadge label={formatEnumLabel(vote.voteType)} />
                          <StatusBadge
                            label={formatEnumLabel(vote.topicCategory)}
                            tone="muted"
                          />
                          <StatusBadge
                            label={
                              vote.derivedStatus
                                ? formatEnumLabel(vote.derivedStatus)
                                : "Unknown"
                            }
                            tone={deriveStatusTone(vote.derivedStatus)}
                          />
                        </div>

                        <h3 className="mt-5 max-w-4xl break-words text-2xl font-black tracking-[-0.045em] text-slate-950 transition duration-200 group-hover:text-green-700 md:text-3xl">
                          {vote.title}
                        </h3>

                        <p className="mt-4 max-w-4xl break-words text-sm leading-7 text-slate-600">
                          {vote.summary}
                        </p>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
                          <InfoLine
                            label="Starts"
                            value={formatDateTime(vote.startAt)}
                          />
                          <InfoLine
                            label="Ends"
                            value={formatDateTime(vote.endAt)}
                          />
                        </div>

                        <span className="mt-6 inline-flex min-h-11 max-w-full items-center justify-center border border-green-500 bg-white px-4 text-center text-sm font-black text-green-700 shadow-sm transition duration-200 group-hover:bg-green-50 group-hover:shadow-md group-active:scale-[0.98]">
                          <span className="min-w-0 break-words">
                            Open consultation →
                          </span>
                        </span>
                      </div>

                      <div className="min-w-0">
                        {vote.coverImageUrl ? (
                          <div className="flex min-h-[180px] items-center justify-center bg-slate-50 p-4 transition duration-300 group-hover:bg-white">
                            <img
                              src={vote.coverImageUrl}
                              alt={vote.coverImageAlt ?? vote.title}
                              className="block h-auto max-h-[220px] max-w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="flex min-h-[180px] items-center justify-center border border-slate-200 bg-white px-4 text-center text-sm font-bold text-slate-400">
                            No image
                          </div>
                        )}
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function StatLine({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "success" | "warning" | "muted" | "default";
}) {
  const valueClass =
    tone === "success"
      ? "text-green-700"
      : tone === "warning"
        ? "text-amber-700"
        : tone === "muted"
          ? "text-slate-500"
          : "text-slate-950";

  return (
    <div className="min-w-0 border-t border-slate-200 pt-3 first:border-t-0 first:pt-0">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 break-words text-3xl font-black tracking-[-0.05em] ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-t border-slate-200 pt-3">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "muted" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "border-green-200 text-green-700"
      : tone === "warning"
        ? "border-amber-200 text-amber-700"
        : tone === "danger"
          ? "border-red-200 text-red-700"
          : tone === "muted"
            ? "border-slate-200 text-slate-500"
            : "border-slate-200 text-slate-700";

  return (
    <span
      className={`max-w-full break-words border bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${toneClass}`}
    >
      {label}
    </span>
  );
}

function deriveStatusTone(
  status:
    | "UPCOMING"
    | "ONGOING"
    | "PAST"
    | "CANCELLED"
    | "ARCHIVED"
    | undefined,
): "success" | "warning" | "muted" | "danger" {
  if (status === "ONGOING") {
    return "success";
  }

  if (status === "UPCOMING") {
    return "warning";
  }

  if (status === "CANCELLED") {
    return "danger";
  }

  return "muted";
}
