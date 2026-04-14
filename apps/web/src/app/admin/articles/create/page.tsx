'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { createArticle } from '@/lib/articles';
import { isAdminRole } from '@/lib/roles';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export default function CreateArticlePage() {
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?redirectTo=/admin/articles/create');
      return;
    }

    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router]);

  async function handleSubmit() {
    if (!token) {
      setPageError('You must be signed in');
      return;
    }

    setPageError(null);
    setIsSubmitting(true);

    try {
      const article = await createArticle(token, {
        title,
        slug,
        summary,
        content,
        coverImageUrl: coverImageUrl || undefined,
        coverImageAlt: coverImageAlt || undefined,
        status,
      });

      router.push(`/admin/articles/${article.id}/edit`);
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : 'Failed to create article',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        Loading...
      </main>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  if (!hasPermission(user.role, PERMISSIONS.ARTICLE_CREATE)) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          You do not have permission to create articles.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href="/admin/articles"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to articles
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold">Create Article</h1>
          <p className="mt-2 text-sm text-slate-600">
            Draft or publish public-facing content for the platform.
          </p>

          {pageError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </div>
          ) : null}

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Field label="Title" value={title} onChange={setTitle} />
            <Field label="Slug" value={slug} onChange={setSlug} />
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
            />
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? 'Creating...' : 'Create article'}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
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
