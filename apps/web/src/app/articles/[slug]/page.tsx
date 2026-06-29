import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPublicArticleBySlug } from "@/lib/articles";
import { formatDateTime } from "@/lib/format";

async function getPublicArticle(slug: string) {
  try {
    return await fetchPublicArticleBySlug(slug);
  } catch {
    return null;
  }
}

function formatSlugTag(slug: string) {
  return `#${slug}`;
}

function splitArticleContent(content: string) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublicArticle(slug);

  if (!article) {
    notFound();
  }

  const articleParagraphs = splitArticleContent(article.content);

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <section className="bg-white px-5 py-12 sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <div className="mt-10">
            <Link
              href="/articles"
              className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-green-600 hover:text-green-700 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
            >
              ← Back to articles
            </Link>
          </div>

          <article className="mt-10">
            <section className="grid gap-10 border-y border-slate-200 py-8 md:grid-cols-[minmax(260px,0.82fr)_minmax(0,1.18fr)] md:items-center lg:py-12">
              <div className="min-w-0">
                <div className="mx-auto w-full max-w-[28rem] border border-slate-200 bg-white transition duration-300 hover:border-green-600/40 hover:shadow-[0_24px_70px_rgba(15,23,42,0.10)] md:max-w-none">
                  <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-transparent">
                    {article.coverImageUrl ? (
                      <img
                        src={article.coverImageUrl}
                        alt={article.coverImageAlt ?? article.title}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-50 px-6 text-center">
                        <span className="text-sm font-bold text-slate-400">
                          Article image coming soon
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="max-w-full truncate text-xs font-black uppercase tracking-[0.14em] text-slate-950">
                      {formatSlugTag(article.slug)}
                    </span>

                    <span className="flex items-center gap-3 text-xs font-medium text-slate-500">
                      {article.publishedAt
                        ? formatDateTime(article.publishedAt)
                        : "Recently published"}
                      <span className="w-10 border-t border-slate-300" />
                    </span>
                  </div>
                </div>
              </div>

              <header className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-green-700">
                  Article
                </p>

                <h1 className="mt-4 max-w-4xl break-words text-4xl font-black tracking-[-0.065em] text-slate-950 sm:text-5xl md:text-6xl">
                  {article.title}
                </h1>

                <p className="mt-6 max-w-3xl break-words text-base leading-8 text-slate-600 md:text-lg md:leading-9">
                  {article.summary}
                </p>

                <div className="mt-8 flex flex-wrap gap-2">
                  <span className="border border-green-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-green-700">
                    Published
                  </span>

                  <span className="border border-slate-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    {formatSlugTag(article.slug)}
                  </span>
                </div>
              </header>
            </section>

            <section className="mx-auto mt-12 max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-green-700">
                Read article
              </p>

              <div className="mt-6 border-t border-slate-200 pt-8">
                {articleParagraphs.length > 0 ? (
                  <div className="grid gap-7">
                    {articleParagraphs.map((paragraph, index) => (
                      <p
                        key={`${article.slug}-paragraph-${index}`}
                        className="break-words text-base leading-8 text-slate-700 md:text-lg md:leading-9"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-base leading-8 text-slate-600">
                    {article.summary}
                  </p>
                )}
              </div>

              <div className="mt-12 border-t border-slate-200 pt-8">
                <Link
                  href="/articles"
                  className="inline-flex min-h-12 w-full items-center justify-center border border-green-700 bg-green-700 px-6 text-sm font-black text-white shadow-[0_20px_54px_rgba(22,163,74,0.22)] transition duration-300 hover:-translate-y-1 hover:bg-green-800 hover:shadow-[0_28px_74px_rgba(22,163,74,0.32)] active:-translate-y-1 active:scale-[0.98] active:bg-green-800 sm:w-auto"
                >
                  Back to articles
                </Link>
              </div>
            </section>
          </article>
        </div>
      </section>
    </main>
  );
}
