import Link from "next/link";
import { fetchPublicArticles } from "@/lib/articles";
import { formatDateTime } from "@/lib/format";

export default async function ArticlesPage() {
  const articles = await fetchPublicArticles();

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <section className="px-5 py-10 sm:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <header className="mt-10">
            <div className="max-w-4xl">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
              >
                ← Back to home
              </Link>

              <p className="mt-7 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                Articles
              </p>

              <h1 className="mt-4 max-w-4xl break-words text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                Public updates and guides
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
                Read updates, methodology notes, and participation guidance from
                ER Democracy Bologna.
              </p>
            </div>
          </header>

          <section className="mt-12 border-t border-slate-200 pt-8">
            {articles.length === 0 ? (
              <div className="border-y border-slate-200 py-8">
                <h2 className="text-2xl font-black tracking-[-0.045em] text-slate-950">
                  No published articles
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Public content will appear here once it is published.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border-y border-slate-200">
                {articles.map((article) => (
                  <article
                    key={article.id}
                    className="group py-7 transition duration-300 hover:bg-slate-50/70 active:bg-slate-50"
                  >
                    <div className="grid gap-6 lg:grid-cols-[minmax(160px,240px)_minmax(0,1fr)] lg:items-start">
                      <Link
                        href={`/articles/${article.slug}`}
                        className="flex min-h-[180px] items-center justify-center border border-slate-200 bg-slate-50 p-4 transition duration-300 group-hover:bg-white"
                        aria-label={`Read ${article.title}`}
                      >
                        {article.coverImageUrl ? (
                          <img
                            src={article.coverImageUrl}
                            alt={article.coverImageAlt || article.title}
                            className="block h-auto max-h-[240px] max-w-full object-contain"
                          />
                        ) : (
                          <div className="px-4 text-center text-sm font-bold text-slate-400">
                            Article image coming soon
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 lg:pr-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill label="Published article" />
                          <span className="border border-slate-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                            {article.publishedAt
                              ? formatDateTime(article.publishedAt)
                              : "Recently published"}
                          </span>
                        </div>

                        <h2 className="mt-4 max-w-4xl break-words text-2xl font-black tracking-[-0.045em] text-slate-950 md:text-3xl">
                          <Link
                            href={`/articles/${article.slug}`}
                            className="transition hover:text-green-700"
                          >
                            {article.title}
                          </Link>
                        </h2>

                        <p className="mt-4 max-w-4xl break-words text-sm leading-7 text-slate-600">
                          {article.summary}
                        </p>

                        <div className="mt-6">
                          <Link
                            href={`/articles/${article.slug}`}
                            className="inline-flex min-h-11 items-center justify-center border border-green-500 bg-white px-4 text-sm font-black text-green-700 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-green-50 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                          >
                            Read article
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="border border-green-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-green-700">
      {label}
    </span>
  );
}
