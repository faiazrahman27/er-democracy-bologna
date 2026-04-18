import Link from 'next/link';
import { fetchPublicArticles } from '@/lib/articles';
import { formatDateTime } from '@/lib/format';

export default async function ArticlesPage() {
  const articles = await fetchPublicArticles();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <h1 className="text-4xl font-semibold">Articles</h1>
          <p className="mt-3 text-sm text-slate-600">
            Read public updates, methodology notes, and participation guidance.
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">No published articles</h2>
            <p className="mt-3 text-sm text-slate-600">
              Public content will appear here once published.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {articles.map((article) => (
              <article
                key={article.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex gap-5">
                  <div className="aspect-square w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:w-28">
                    {article.coverImageUrl ? (
                      <img
                        src={article.coverImageUrl}
                        alt={article.coverImageAlt || article.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-medium text-slate-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-semibold break-words">
                      {article.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {article.publishedAt
                        ? formatDateTime(article.publishedAt)
                        : 'Not published'}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-slate-600 break-words">
                      {article.summary}
                    </p>
                    <div className="mt-6">
                      <Link
                        href={`/articles/${article.slug}`}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
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
      </div>
    </main>
  );
}
