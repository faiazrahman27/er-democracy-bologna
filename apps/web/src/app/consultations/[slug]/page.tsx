import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPublicVoteBySlug } from "@/lib/votes";
import { formatDateTime, formatEnumLabel } from "@/lib/format";
import { ConsultationInteractions } from "./consultation-interactions";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ConsultationDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let response;
  try {
    response = await fetchPublicVoteBySlug(slug);
  } catch {
    notFound();
  }

  const vote = response.vote;

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <section className="px-5 py-10 sm:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <header className="mt-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
              <div className="min-w-0">
                <Link
                  href="/consultations"
                  className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                >
                  ← Back to consultations
                </Link>

                <div className="mt-6 flex flex-wrap items-center gap-2">
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

                <p className="mt-7 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Public consultation
                </p>

                <h1 className="mt-4 max-w-4xl break-words text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                  {vote.title}
                </h1>

                <p className="mt-6 max-w-3xl break-words text-base leading-8 text-slate-600">
                  {vote.summary}
                </p>
              </div>

              <aside className="border-y border-slate-200 py-5 lg:mt-11">
                {vote.coverImageUrl ? (
                  <div className="mb-5 flex items-center justify-center bg-slate-50 p-4">
                    <img
                      src={vote.coverImageUrl}
                      alt={vote.coverImageAlt ?? vote.title}
                      className="block h-auto max-h-[220px] max-w-full object-contain"
                    />
                  </div>
                ) : null}

                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Timing
                </p>

                <div className="mt-4 grid gap-4">
                  <InfoLine label="Starts" value={formatDateTime(vote.startAt)} />
                  <InfoLine label="Ends" value={formatDateTime(vote.endAt)} />
                  <InfoLine
                    label="Published"
                    value={
                      vote.publishedAt
                        ? formatDateTime(vote.publishedAt)
                        : "Not published"
                    }
                  />
                </div>
              </aside>
            </div>
          </header>

          {vote.methodologySummary ? (
            <section className="mt-12 border-y border-slate-200 py-7">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                Methodology
              </p>
              <p className="mt-4 max-w-4xl break-words text-sm leading-7 text-slate-600">
                {vote.methodologySummary}
              </p>
            </section>
          ) : null}

          <div className="mt-12 border-t border-slate-200 pt-8">
            <ConsultationInteractions vote={vote} />
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-t border-slate-200 pt-3 first:border-t-0 first:pt-0">
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
      className={`border bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${toneClass}`}
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
