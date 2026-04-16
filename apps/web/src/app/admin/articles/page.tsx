'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { isAdminRole } from '@/lib/roles';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import {
  deleteArticle,
  fetchAdminArticles,
  type ArticleItem,
} from '@/lib/articles';
import { formatDateTime } from '@/lib/format';

export default function AdminArticlesPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?redirectTo=/admin/articles');
      return;
    }

    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    async function loadArticles() {
      if (!token) {
        setPageLoading(false);
        return;
      }

      try {
        const data = await fetchAdminArticles(token);
        setArticles(data);
      } catch (err) {
        setPageError(
          err instanceof Error ? err.message : 'Failed to load articles',
        );
      } finally {
        setPageLoading(false);
      }
    }

    if (
      user &&
      token &&
      isAdminRole(user.role) &&
      hasPermission(user.role, PERMISSIONS.ARTICLE_VIEW_ADMIN)
    ) {
      void loadArticles();
    } else if (user) {
      setPageLoading(false);
    }
  }, [user, token]);

  async function handleDelete(articleId: string) {
    if (!token) {
      setDeleteError('You must be signed in');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this article?',
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(articleId);
    setDeleteError(null);

    try {
      await deleteArticle(token, articleId);
      setArticles((current) => current.filter((article) => article.id !== articleId));
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Failed to delete article',
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading || pageLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-6xl">Loading...</div>
      </main>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  if (!hasPermission(user.role, PERMISSIONS.ARTICLE_VIEW_ADMIN)) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            You do not have permission to view admin articles.
          </div>
        </div>
      </main>
    );
  }

  const canCreate = hasPermission(user.role, PERMISSIONS.ARTICLE_CREATE);
  const canEdit = hasPermission(user.role, PERMISSIONS.ARTICLE_EDIT);
  const canDelete = hasPermission(user.role, PERMISSIONS.ARTICLE_DELETE);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              ← Back to admin
            </Link>
            <h1 className="mt-3 text-3xl font-semibold">Articles</h1>
            <p className="mt-2 text-sm text-slate-600">
              Manage public content, updates, and explanatory articles.
            </p>
          </div>

          {canCreate ? (
            <Link
              href="/admin/articles/create"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Create article
            </Link>
          ) : null}
        </div>

        {pageError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        ) : null}

        {deleteError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {deleteError}
          </div>
        ) : null}

        {articles.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">No articles found</h2>
            <p className="mt-3 text-sm text-slate-600">
              Create the first article to populate the public content section.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {articles.map((article) => (
              <div
                key={article.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex gap-5">
                  <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
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
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <span>{article.status}</span>
                      <span>•</span>
                      <span>
                        {article.publishedAt
                          ? `Published ${formatDateTime(article.publishedAt)}`
                          : 'Not published'}
                      </span>
                    </div>

                    <h2 className="mt-4 text-2xl font-semibold break-words">
                      {article.title}
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 break-words">
                      {article.summary}
                    </p>

                    <div className="mt-5 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                      <p className="break-all">
                        <span className="font-medium">Slug:</span> {article.slug}
                      </p>
                      <p>
                        <span className="font-medium">Updated:</span>{' '}
                        {formatDateTime(article.updatedAt)}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {article.status === 'PUBLISHED' ? (
                        <Link
                          href={`/articles/${article.slug}`}
                          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                        >
                          Public view
                        </Link>
                      ) : null}

                      {canEdit ? (
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                        >
                          Edit
                        </Link>
                      ) : null}

                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(article.id)}
                          disabled={deletingId === article.id}
                          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-60"
                        >
                          {deletingId === article.id ? 'Deleting...' : 'Delete'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
