'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { fetchAdminArticles, updateArticle } from '@/lib/articles';
import { isAdminRole } from '@/lib/roles';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export default function EditArticlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageAlt, setCoverImageAlt] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>(
    'DRAFT',
  );

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?redirectTo=/admin/articles/${params.id}/edit`);
      return;
    }

    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router, params.id]);

  useEffect(() => {
    async function loadArticle() {
      if (!token) {
        setPageLoading(false);
        return;
      }

      try {
        const articles = await fetchAdminArticles(token);
        const article = articles.find((item) => item.id === params.id);

        if (!article) {
          setPageError('Article not found');
          setPageLoading(false);
          return;
        }

        setTitle(article.title);
        setSlug(article.slug);
        setSummary(article.summary);
        setContent(article.content);
        setCoverImageUrl(article.coverImageUrl ?? '');
        setCoverImageAlt(article.coverImageAlt ?? '');
        setStatus(article.status);
      } catch (err) {
        setPageError(
          err instanceof Error ? err.message : 'Failed to load article',
        );
      } finally {
        setPageLoading(false);
      }
    }

    if (
      user &&
      token &&
      isAdminRole(user.role) &&
      hasPermission(user.role, PERMISSIONS.ARTICLE_EDIT)
    ) {
      void loadArticle();
    } else if (user) {
      setPageLoading(false);
    }
  }, [user, token, params.id]);

  const publicPath = useMemo(() => `/articles/${slug}`, [slug]);

  const canPublish = hasPermission(user?.role, PERMISSIONS.ARTICLE_PUBLISH);

  async function handleSave() {
    if (!token) {
      setPageError('You must be signed in');
      return;
    }

    setPageError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      await updateArticle(token, params.id, {
        title,
        summary,
        content,
        coverImageUrl: coverImageUrl || undefined,
        coverImageAlt: coverImageAlt || undefined,
        status,
      });

      setSuccessMessage('Article updated successfully');
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : 'Failed to update article',
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || pageLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        Loading...
      </main>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  if (!hasPermission(user.role, PERMISSIONS.ARTICLE_EDIT)) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          You do not have permission to edit articles.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/admin/articles"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to articles
          </Link>

          {status === 'PUBLISHED' ? (
            <Link
              href={publicPath}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Public view
            </Link>
          ) : null}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold">Edit Article</h1>
          <p className="mt-2 text-sm text-slate-600">
            Update public-facing content, summary, and publication status.
          </p>

          {!canPublish ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You can edit article content, but you do not have permission to
              change publication status.
            </div>
          ) : null}

          {pageError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMessage}
            </div>
          ) : null}

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Field label="Title" value={title} onChange={setTitle} />
            <Field label="Slug" value={slug} onChange={setSlug} disabled />
            <div className="md:col-span-2">
              <Field label="Summary" value={summary} onChange={setSummary} />
            </div>
            <div className="md:col-span-2">
              <TextAreaField
                label="Content"
                value={content}
                onChange={setContent}
                rows={12}
              />
            </div>
            <Field
              label="Cover image URL"
              value={coverImageUrl}
              onChange={setCoverImageUrl}
            />
            <Field
              label="Cover image alt text"
              value={coverImageAlt}
              onChange={setCoverImageAlt}
            />
            <SelectField
              label="Status"
              value={status}
              onChange={(value) =>
                setStatus(value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')
              }
              options={['DRAFT', 'PUBLISHED', 'ARCHIVED']}
              disabled={!canPublish}
            />
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        value={value}
        rows={rows ?? 6}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
