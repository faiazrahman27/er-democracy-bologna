import { notFound } from 'next/navigation';
import { fetchPublicArticleBySlug } from '@/lib/articles';
import { formatDateTime } from '@/lib/format';

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const article = await fetchPublicArticleBySlug(slug);

    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <div className="mx-auto max-w-4xl">
          <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-slate-500">
              {article.publishedAt
                ? formatDateTime(article.publishedAt)
                : 'Not published'}
            </p>

            <h1 className="mt-3 text-4xl font-semibold">{article.title}</h1>

            <p className="mt-5 text-base leading-7 text-slate-600">
              {article.summary}
            </p>

            {article.coverImageUrl ? (
              <div className="mt-8 mx-auto aspect-square w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <img
                  src={article.coverImageUrl}
                  alt={article.coverImageAlt ?? article.title}
                  className="block h-full w-full object-cover object-center"
                />
              </div>
            ) : null}

            <div className="prose prose-slate mt-8 max-w-none whitespace-pre-wrap">
              {article.content}
            </div>
          </article>
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}
