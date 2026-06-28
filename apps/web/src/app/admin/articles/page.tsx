"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { isAdminRole } from "@/lib/roles";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import {
  deleteArticle,
  fetchAdminArticles,
  type ArticleItem,
} from "@/lib/articles";
import { formatDateTime, formatEnumLabel } from "@/lib/format";

function cleanArticleText(value: string) {
  return value
    .replace(/$begin:math:display$\(\.\*\?\)$end:math:display$$begin:math:text$\(\.\*\?\)$end:math:text$/g, "$1")
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
    return "Open this article to review the full content.";
  }

  if (source.length <= 145) {
    return source;
  }

  return `${source.slice(0, 145).trimEnd()}...`;
}

function formatSlugTag(slug: string) {
  return `#${slug}`;
}

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
      router.replace("/login?redirectTo=/admin/articles");
      return;
    }

    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace("/dashboard");
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
          err instanceof Error ? err.message : "Failed to load articles",
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
      setDeleteError("You must be signed in");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this article?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(articleId);
    setDeleteError(null);

    try {
      await deleteArticle(token, articleId);
      setArticles((current) =>
        current.filter((article) => article.id !== articleId),
      );
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete article",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const publishedCount = useMemo(
    () => articles.filter((article) => article.status === "PUBLISHED").length,
    [articles],
  );

  if (isLoading || pageLoading) {
    return (
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="border-y border-slate-200 py-6">
            <p className="text-sm font-medium text-slate-500">
              Loading articles...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  if (!hasPermission(user.role, PERMISSIONS.ARTICLE_VIEW_ADMIN)) {
    return (
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="border-y border-red-200 py-4 text-sm font-bold text-red-700">
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
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <section className="px-5 py-10 sm:px-6 md:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <header className="mt-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
              <div className="min-w-0">
                <Link
                  href="/admin"
                  className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-600 hover:text-green-700 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                >
                  ← Back to admin
                </Link>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <StatusPill label={`${articles.length} total`} tone="default" />
                  <StatusPill
                    label={`${publishedCount} published`}
                    tone={publishedCount > 0 ? "success" : "muted"}
                  />
                  <StatusPill
                    label={`${articles.length - publishedCount} drafts / hidden`}
                    tone={
                      articles.length - publishedCount > 0
                        ? "warning"
                        : "muted"
                    }
                  />
                </div>

                <p className="mt-7 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Content admin
                </p>

                <h1 className="mt-4 max-w-4xl break-words text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                  Articles
                </h1>

                <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
                  Create, review, publish, edit, or remove articles shown in the
                  public article section.
                </p>
              </div>

              <aside className="border-y border-slate-200 py-5 lg:mt-11">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Article actions
                </p>

                <div className="mt-4 grid gap-3">
                  {canCreate ? (
                    <Link
                      href="/admin/articles/create"
                      className="inline-flex min-h-12 w-full items-center justify-center border border-green-700 bg-green-700 px-5 text-sm font-black text-white shadow-[0_16px_34px_rgba(22,163,74,0.18)] transition duration-200 hover:-translate-y-1 hover:bg-green-800 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                    >
                      Create article
                    </Link>
                  ) : null}

                  <Link
                    href="/admin"
                    className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-600 hover:text-green-700 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                  >
                    Admin dashboard
                  </Link>
                </div>
              </aside>
            </div>
          </header>

          {pageError ? (
            <MessageBlock tone="danger">{pageError}</MessageBlock>
          ) : null}

          {deleteError ? (
            <MessageBlock tone="danger">{deleteError}</MessageBlock>
          ) : null}

          <section className="mt-12 border-t border-slate-200 pt-8">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                Article list
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950 md:text-4xl">
                Public content records
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                The admin view follows the public article card style, with
                status, slug, dates, and management actions kept visible.
              </p>
            </div>

            {articles.length === 0 ? (
              <div className="mt-8 border-y border-slate-200 py-8">
                <h3 className="text-2xl font-black tracking-[-0.045em] text-slate-950">
                  No articles found
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Create the first article to populate the public content
                  section.
                </p>

                {canCreate ? (
                  <Link
                    href="/admin/articles/create"
                    className="mt-6 inline-flex min-h-12 items-center justify-center border border-green-700 bg-green-700 px-5 text-sm font-black text-white shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-green-800 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                  >
                    Create article
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="mt-8 grid gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
                {articles.map((article) => (
                  <article
                    key={article.id}
                    className="group border border-slate-200 bg-white shadow-none transition duration-300 hover:-translate-y-1 hover:border-green-600/40 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)] active:-translate-y-1 active:scale-[0.99]"
                  >
                    <div className="relative overflow-hidden bg-slate-100">
                      {article.coverImageUrl ? (
                        <img
                          src={article.coverImageUrl}
                          alt={article.coverImageAlt || article.title}
                          className="aspect-square h-64 w-full object-cover transition duration-700 group-hover:scale-[1.035] sm:h-72 md:h-80"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex aspect-square h-64 w-full items-center justify-center bg-slate-100 px-6 text-center sm:h-72 md:h-80">
                          <span className="text-sm font-bold text-slate-400">
                            No image
                          </span>
                        </div>
                      )}

                      <p className="absolute left-0 top-0 max-w-[85%] border-b border-r border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-950 sm:text-xs">
                        <span className="block truncate">
                          {formatSlugTag(article.slug)}
                        </span>
                      </p>
                    </div>

                    <div className="px-4 pb-5 pt-5 sm:px-5 sm:pb-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill
                          label={formatEnumLabel(article.status)}
                          tone={deriveArticleTone(article.status)}
                        />
                        <StatusPill
                          label={
                            article.publishedAt
                              ? `Published ${formatDateTime(article.publishedAt)}`
                              : "Not published"
                          }
                          tone={article.publishedAt ? "success" : "muted"}
                        />
                      </div>

                      <h3 className="mt-4 break-words text-xl font-black tracking-[-0.045em] text-slate-950 transition duration-300 group-hover:text-green-700 md:text-2xl">
                        {article.title}
                      </h3>

                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                        {getArticlePreview(article)}
                      </p>

                      <div className="mt-5 grid gap-3 text-sm text-slate-700">
                        <InfoLine label="Slug" value={article.slug} />
                        <InfoLine
                          label="Updated"
                          value={formatDateTime(article.updatedAt)}
                        />
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {article.status === "PUBLISHED" ? (
                          <Link
                            href={`/articles/${article.slug}`}
                            className="inline-flex min-h-11 items-center justify-center border border-green-700 bg-green-700 px-4 text-sm font-black text-white shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-green-800 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                          >
                            Public view
                          </Link>
                        ) : null}

                        {canEdit ? (
                          <Link
                            href={`/admin/articles/${article.id}/edit`}
                            className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-600 hover:text-green-700 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                          >
                            Edit
                          </Link>
                        ) : null}

                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(article.id)}
                            disabled={deletingId === article.id}
                            className="inline-flex min-h-11 items-center justify-center border border-red-300 bg-white px-4 text-sm font-black text-red-700 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-red-50 hover:shadow-md active:-translate-y-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === article.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        ) : null}
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

function MessageBlock({
  tone,
  children,
}: {
  tone: "danger";
  children: ReactNode;
}) {
  const toneClass = tone === "danger" ? "border-red-200 text-red-700" : "";

  return (
    <div className={`mt-8 border-y py-4 text-sm font-bold ${toneClass}`}>
      {children}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-t border-slate-200 pt-3">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 min-w-0 break-words text-sm font-bold leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "danger" | "muted" | "default";
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

function deriveArticleTone(
  status: string,
): "success" | "warning" | "danger" | "muted" | "default" {
  if (status === "PUBLISHED") {
    return "success";
  }

  if (status === "DRAFT" || status === "REVIEW") {
    return "warning";
  }

  if (status === "ARCHIVED") {
    return "muted";
  }

  if (status === "CANCELLED") {
    return "danger";
  }

  return "default";
}
