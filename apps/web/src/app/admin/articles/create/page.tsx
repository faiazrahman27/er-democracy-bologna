"use client";

import Link from "next/link";
import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { createArticle, uploadAdminArticleCover } from "@/lib/articles";
import { isAdminRole } from "@/lib/roles";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { formatEnumLabel } from "@/lib/format";

export default function CreateArticlePage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageAlt, setCoverImageAlt] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">(
    "DRAFT",
  );

  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadMessage, setCoverUploadMessage] = useState<string | null>(
    null,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?redirectTo=/admin/articles/create");
      return;
    }

    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  function handleCoverFileChange(file: File | null) {
    setSelectedCoverFile(file);
    setCoverUploadMessage(null);
  }

  async function handleUploadCoverImage() {
    if (!token) {
      setPageError("You must be signed in");
      return;
    }

    if (!selectedCoverFile) {
      setPageError("Please choose an image file first");
      return;
    }

    setPageError(null);
    setCoverUploadMessage(null);
    setIsUploadingCover(true);

    try {
      const response = await uploadAdminArticleCover(
        token,
        selectedCoverFile,
        slug,
      );

      setCoverImageUrl(response.file.publicUrl);

      if (!coverImageAlt.trim()) {
        setCoverImageAlt(title.trim() || "Article cover image");
      }

      setCoverUploadMessage("Cover image uploaded successfully");
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Failed to upload cover image",
      );
    } finally {
      setIsUploadingCover(false);
    }
  }

  async function handleSubmit() {
    if (!token) {
      setPageError("You must be signed in");
      return;
    }

    if (selectedCoverFile && !coverImageUrl) {
      setPageError("Please upload the selected cover image before creating");
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
        err instanceof Error ? err.message : "Failed to create article",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="border-y border-slate-200 py-6">
            <p className="text-sm font-medium text-slate-500">
              Loading article creator...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  if (!hasPermission(user.role, PERMISSIONS.ARTICLE_CREATE)) {
    return (
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="border-y border-red-200 py-4 text-sm font-bold text-red-700">
            You do not have permission to create articles.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <section className="px-5 py-10 sm:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <header className="mt-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
              <div className="min-w-0">
                <Link
                  href="/admin/articles"
                  className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                >
                  ← Back to articles
                </Link>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <StatusPill
                    label={formatEnumLabel(status)}
                    tone={deriveArticleTone(status)}
                  />
                  <StatusPill
                    label={coverImageUrl ? "Cover ready" : "No cover yet"}
                    tone={coverImageUrl ? "success" : "muted"}
                  />
                </div>

                <p className="mt-7 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Create article
                </p>

                <h1 className="mt-4 max-w-4xl break-words text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                  New public article
                </h1>

                <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
                  Draft or publish content for updates, explanations, and public
                  information pages.
                </p>
              </div>

              <aside className="border-y border-slate-200 py-5 lg:mt-11">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Create action
                </p>

                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || isUploadingCover}
                    className="inline-flex min-h-12 w-full items-center justify-center border border-green-500 bg-white px-5 text-sm font-black text-green-700 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-green-50 hover:shadow-md active:-translate-y-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Creating..." : "Create article"}
                  </button>

                  <Link
                    href="/admin/articles"
                    className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                  >
                    Articles
                  </Link>
                </div>
              </aside>
            </div>
          </header>

          {pageError ? <MessageBlock tone="danger">{pageError}</MessageBlock> : null}

          <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] xl:items-start">
            <div className="grid min-w-0 gap-10">
              <CreateSection
                eyebrow="Article identity"
                title="Title, slug, and summary"
                description="Write the article name, URL slug, and short description. The light text inside empty fields disappears when you start typing."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Title"
                    value={title}
                    onChange={setTitle}
                    placeholder="Write the public article title"
                  />

                  <Field
                    label="Slug"
                    value={slug}
                    onChange={setSlug}
                    placeholder="write-url-slug-for-this-article"
                  />

                  <div className="md:col-span-2">
                    <TextAreaField
                      label="Summary"
                      value={summary}
                      onChange={setSummary}
                      rows={4}
                      placeholder="Write a short preview summary for article lists and headers"
                    />
                  </div>
                </div>
              </CreateSection>

              <CreateSection
                eyebrow="Article body"
                title="Content"
                description="Write the main article text that visitors will read."
              >
                <TextAreaField
                  label="Content"
                  value={content}
                  onChange={setContent}
                  rows={14}
                  placeholder="Write the full article content here"
                />
              </CreateSection>

              <CreateSection
                eyebrow="Media"
                title="Cover image"
                description="Upload a cover image or paste an existing image URL."
              >
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(220px,300px)] lg:items-start">
                  <div className="min-w-0">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-800">
                          Select image
                        </label>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) =>
                            handleCoverFileChange(
                              event.target.files?.[0] ?? null,
                            )
                          }
                          className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition file:mr-4 file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-slate-800 hover:border-slate-400 focus:border-slate-900"
                        />
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Allowed: JPG, PNG, WEBP. Maximum size: 2MB.
                        </p>
                      </div>

                      <Field
                        label="Cover image alt text"
                        value={coverImageAlt}
                        onChange={setCoverImageAlt}
                        placeholder="Describe the image for screen readers"
                      />
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleUploadCoverImage}
                        disabled={isUploadingCover || !selectedCoverFile}
                        className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-500 hover:text-green-700 hover:shadow-md active:-translate-y-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUploadingCover
                          ? "Uploading..."
                          : "Upload cover image"}
                      </button>

                      {coverUploadMessage ? (
                        <span className="text-sm font-bold text-green-700">
                          {coverUploadMessage}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-6">
                      <Field
                        label="Cover image URL"
                        value={coverImageUrl}
                        onChange={setCoverImageUrl}
                        placeholder="Paste an existing cover image URL or upload a file"
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    {coverImageUrl ? (
                      <div>
                        <p className="mb-2 text-sm font-bold text-slate-800">
                          Preview
                        </p>
                        <div className="flex aspect-[4/3] items-center justify-center border border-slate-200 bg-slate-50 p-4">
                          <img
                            src={coverImageUrl}
                            alt={coverImageAlt || "Article cover preview"}
                            className="block h-auto max-h-full max-w-full object-contain"
                          />
                        </div>
                        <p className="mt-2 break-all text-xs leading-5 text-slate-500">
                          {coverImageUrl}
                        </p>
                      </div>
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm text-slate-500">
                        No cover image uploaded yet.
                      </div>
                    )}
                  </div>
                </div>
              </CreateSection>
            </div>

            <aside className="grid min-w-0 gap-10">
              <CreateSection
                eyebrow="Publication"
                title="Article status"
                description="Choose whether this article starts as a draft, published article, or archived record."
              >
                <SelectField
                  label="Status"
                  value={status}
                  onChange={(value) =>
                    setStatus(value as "DRAFT" | "PUBLISHED" | "ARCHIVED")
                  }
                  options={["DRAFT", "PUBLISHED", "ARCHIVED"]}
                />
              </CreateSection>

              <CreateSection
                eyebrow="Quick check"
                title="Before creating"
                description="Use this to quickly see what is still empty before pressing Create article."
              >
                <div className="grid gap-3">
                  <ChecklistItem
                    label="Title"
                    complete={Boolean(title.trim())}
                    emptyLabel="Needed"
                  />
                  <ChecklistItem
                    label="Slug"
                    complete={Boolean(slug.trim())}
                    emptyLabel="Needed"
                  />
                  <ChecklistItem
                    label="Summary"
                    complete={Boolean(summary.trim())}
                    emptyLabel="Needed"
                  />
                  <ChecklistItem
                    label="Content"
                    complete={Boolean(content.trim())}
                    emptyLabel="Needed"
                  />
                  <ChecklistItem
                    label="Cover image"
                    complete={Boolean(coverImageUrl.trim())}
                    emptyLabel="Not added"
                  />
                  <ChecklistItem
                    label="Status"
                    complete={Boolean(status)}
                    emptyLabel="Choose"
                  />
                </div>
              </CreateSection>
            </aside>
          </div>

          <div className="mt-10 border-t border-slate-200 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || isUploadingCover}
                className="inline-flex min-h-12 w-full items-center justify-center border border-green-500 bg-white px-5 text-sm font-black text-green-700 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-green-50 hover:shadow-md active:-translate-y-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isSubmitting ? "Creating..." : "Create article"}
              </button>

              <Link
                href="/admin/articles"
                className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98] sm:w-auto"
              >
                Articles
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function CreateSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-y border-slate-200 py-7">
      <div className="mb-6 max-w-3xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950 md:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>

      {children}
    </section>
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

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-bold text-slate-800">
        {label}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-slate-900"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-bold text-slate-800">
        {label}
      </label>
      <textarea
        value={value}
        rows={rows ?? 6}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y border border-slate-300 bg-white px-3 py-3 text-sm leading-7 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-slate-900"
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
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-bold text-slate-800">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition hover:border-slate-400 focus:border-slate-900"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatEnumLabel(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

function ChecklistItem({
  label,
  complete,
  emptyLabel,
}: {
  label: string;
  complete: boolean;
  emptyLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border border-slate-200 bg-white px-4 py-3">
      <span className="min-w-0 break-words text-sm text-slate-700">
        {label}
      </span>
      <span
        className={`shrink-0 border bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${
          complete
            ? "border-green-200 text-green-700"
            : "border-amber-200 text-amber-700"
        }`}
      >
        {complete ? "Ready" : emptyLabel}
      </span>
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
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
): "success" | "warning" | "muted" {
  if (status === "PUBLISHED") {
    return "success";
  }

  if (status === "ARCHIVED") {
    return "muted";
  }

  return "warning";
}
