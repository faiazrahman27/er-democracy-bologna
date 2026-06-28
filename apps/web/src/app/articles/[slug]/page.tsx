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

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <section className="px-5 py-10 sm:px-6 md:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <article className="mt-10">
            <header>
              <Link
                href="/articles"
                className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
              >
                ← Back to articles
              </Link>

              <div className="mt-7 flex flex-wrap items-center gap-2">
                <span className="border border-green-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-green-700">
                  Published article
                </span>

                <span className="border border-slate-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  {article.publishedAt
                    ? formatDateTime(article.publishedAt)
                    : "Recently published"}
                </span>
              </div>

              <h1 className="mt-5 max-w-5xl break-words text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                {article.title}
              </h1>

              <p className="mt-6 max-w-4xl break-words text-base leading-8 text-slate-600 md:text-lg">
                {article.summary}
              </p>
            </header>

            {article.coverImageUrl ? (
              <div className="mt-10 border-y border-slate-200 py-6">
                <div className="flex min-h-[260px] w-full items-center justify-center bg-slate-50 p-4 sm:min-h-[360px] md:p-6">
                  <img
                    src={article.coverImageUrl}
                    alt={article.coverImageAlt ?? article.title}
                    className="block h-auto max-h-[560px] max-w-full object-contain"
                  />
                </div>
              </div>
            ) : null}

            <div className="mt-10 border-t border-slate-200 pt-8">
              <div className="max-w-none whitespace-pre-wrap text-base leading-8 text-slate-700 md:text-lg md:leading-9">
                {article.content}
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
