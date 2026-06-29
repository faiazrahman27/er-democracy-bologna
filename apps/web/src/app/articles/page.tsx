import Link from "next/link";
import { fetchPublicArticles, type ArticleItem } from "@/lib/articles";

function formatArticleDate(value: string | null) {
  if (!value) {
    return "Recently published";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function cleanArticleText(value: string) {
  return value
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~[\]-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getArticlePreview(article: ArticleItem) {
  const bodyText = cleanArticleText(article.content || "");
  const fallbackText = cleanArticleText(article.summary || "");
  const source = bodyText || fallbackText;

  if (!source) {
    return "Open the article to read the full public update.";
  }

  if (source.length <= 150) {
    return source;
  }

  return `${source.slice(0, 150).trimEnd()}...`;
}

function formatSlugTag(slug: string) {
  return `#${slug}`;
}

export default async function ArticlesPage() {
  const articles = await fetchPublicArticles();

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <section className="bg-white px-5 py-12 sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <header className="mx-auto mt-12 max-w-4xl text-center">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-green-600 hover:text-green-700 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
            >
              ← Back to home
            </Link>

            <p className="mt-8 text-xs font-black uppercase tracking-[0.28em] text-green-700">
              Articles
            </p>

            <h1 className="mt-4 break-words text-4xl font-black tracking-[-0.065em] text-slate-950 sm:text-5xl md:text-6xl">
              Public updates and civic stories
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 md:text-lg md:leading-9">
              Read announcements, explainers, guides, and updates from ER
              Democracy Bologna.
            </p>
          </header>

          <section className="mt-14">
            {articles.length === 0 ? (
              <div className="border-y border-slate-200 py-12 text-center">
                <h2 className="text-2xl font-black tracking-[-0.045em] text-slate-950">
                  No published articles yet
                </h2>

                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Articles will appear here once they are published.
                </p>
              </div>
            ) : (
              <div className="mx-auto grid max-w-[28rem] gap-6 sm:gap-8 md:max-w-none md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <article
                    key={article.id}
                    className="group flex h-full min-w-0 cursor-pointer flex-col border border-slate-200 bg-white shadow-none transition duration-300 hover:-translate-y-1 hover:border-green-600/40 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)] active:-translate-y-1 active:scale-[0.99]"
                  >
                    <Link
                      href={`/articles/${article.slug}`}
                      aria-label={`Read ${article.title}`}
                      className="flex h-full flex-col"
                    >
                      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-transparent">
                        {article.coverImageUrl ? (
                          <img
                            src={article.coverImageUrl}
                            alt={article.coverImageAlt || article.title}
                            className="h-full w-full object-contain transition duration-700 group-hover:scale-[1.012]"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-50 px-6 text-center">
                            <span className="text-sm font-bold text-slate-400">
                              Article image coming soon
                            </span>
                          </div>
                        )}

                        <p className="absolute left-0 top-0 max-w-[85%] border-b border-r border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-950 sm:text-xs">
                          <span className="block truncate">
                            {formatSlugTag(article.slug)}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-1 flex-col px-4 pb-5 pt-5 sm:px-5 sm:pb-6">
                        <h2 className="break-words text-xl font-black tracking-[-0.045em] text-slate-950 transition duration-300 group-hover:text-green-700 md:text-2xl">
                          {article.title}
                        </h2>

                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                          {getArticlePreview(article)}
                        </p>

                        <div className="mt-auto flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                          <span className="inline-flex items-center text-sm font-black text-slate-950 transition duration-300 group-hover:text-green-700">
                            <span className="relative mr-3 inline-flex h-10 w-10 items-center justify-center overflow-hidden border border-slate-300 bg-white transition duration-300 group-hover:border-green-700 group-hover:bg-green-700 group-hover:text-white">
                              <span className="transition duration-500 group-hover:translate-x-8 group-hover:opacity-0">
                                →
                              </span>
                              <span className="absolute -left-6 transition duration-500 group-hover:left-1/2 group-hover:-translate-x-1/2">
                                →
                              </span>
                            </span>
                            Read more
                          </span>

                          <span className="flex items-center gap-3 text-xs font-medium text-slate-500">
                            {formatArticleDate(article.publishedAt)}
                            <span className="w-10 border-t border-slate-300 transition duration-300 group-hover:w-16 group-hover:border-green-600" />
                          </span>
                        </div>
                      </div>
                    </Link>
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
