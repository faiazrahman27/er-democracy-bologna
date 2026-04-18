'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import {
  fetchAdminVoteBySlug,
  updateAdminVote,
  uploadAdminVoteCover,
} from '@/lib/admin-votes';
import { isAdminRole } from '@/lib/roles';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { formatEnumLabel } from '@/lib/format';

export default function AdminEditConsultationPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const { user, token, isLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [methodologySummary, setMethodologySummary] = useState('');
  const [status, setStatus] = useState<
    | 'DRAFT'
    | 'REVIEW'
    | 'APPROVED'
    | 'PUBLISHED'
    | 'CLOSED'
    | 'ARCHIVED'
    | 'CANCELLED'
  >('PUBLISHED');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageAlt, setCoverImageAlt] = useState('');
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadMessage, setCoverUploadMessage] = useState<string | null>(
    null,
  );

  const [resultVisibilityMode, setResultVisibilityMode] = useState<
    'HIDE_ALL' | 'SHOW_RAW_ONLY' | 'SHOW_WEIGHTED_ONLY' | 'SHOW_BOTH'
  >('HIDE_ALL');
  const [showParticipationStats, setShowParticipationStats] = useState(false);
  const [showStakeholderBreakdown, setShowStakeholderBreakdown] =
    useState(false);
  const [showBackgroundBreakdown, setShowBackgroundBreakdown] = useState(false);
  const [showLocationBreakdown, setShowLocationBreakdown] = useState(false);
  const [showAgeRangeBreakdown, setShowAgeRangeBreakdown] = useState(false);
  const [showGenderBreakdown, setShowGenderBreakdown] = useState(false);
  const [showExperienceLevelBreakdown, setShowExperienceLevelBreakdown] =
    useState(false);
  const [showRelationshipBreakdown, setShowRelationshipBreakdown] =
    useState(false);
  const [showAfterVotingOnly, setShowAfterVotingOnly] = useState(false);
  const [showOnlyAfterVoteCloses, setShowOnlyAfterVoteCloses] = useState(false);

  const [hasSubmissions, setHasSubmissions] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?redirectTo=/admin/consultations/${params.slug}/edit`);
      return;
    }

    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router, params.slug]);

  useEffect(() => {
    async function loadVote() {
      if (!token) {
        setPageLoading(false);
        return;
      }

      try {
        const response = await fetchAdminVoteBySlug(token, params.slug);
        const vote = response.vote;

        setTitle(vote.title);
        setSummary(vote.summary);
        setMethodologySummary(vote.methodologySummary ?? '');
        setStatus(
          vote.status as
            | 'DRAFT'
            | 'REVIEW'
            | 'APPROVED'
            | 'PUBLISHED'
            | 'CLOSED'
            | 'ARCHIVED'
            | 'CANCELLED',
        );
        setStartAt(toDateTimeLocal(vote.startAt));
        setEndAt(toDateTimeLocal(vote.endAt));
        setIsPublished(vote.isPublished);
        setCoverImageUrl(vote.coverImageUrl ?? '');
        setCoverImageAlt(vote.coverImageAlt ?? '');

        setResultVisibilityMode(
          vote.displaySettings?.resultVisibilityMode ?? 'HIDE_ALL',
        );
        setShowParticipationStats(
          vote.displaySettings?.showParticipationStats ?? false,
        );
        setShowStakeholderBreakdown(
          vote.displaySettings?.showStakeholderBreakdown ?? false,
        );
        setShowBackgroundBreakdown(
          vote.displaySettings?.showBackgroundBreakdown ?? false,
        );
        setShowLocationBreakdown(
          vote.displaySettings?.showLocationBreakdown ?? false,
        );
        setShowAgeRangeBreakdown(
          vote.displaySettings?.showAgeRangeBreakdown ?? false,
        );
        setShowGenderBreakdown(
          vote.displaySettings?.showGenderBreakdown ?? false,
        );
        setShowExperienceLevelBreakdown(
          vote.displaySettings?.showExperienceLevelBreakdown ?? false,
        );
        setShowRelationshipBreakdown(
          vote.displaySettings?.showRelationshipBreakdown ?? false,
        );
        const closeOnlyEnabled =
          vote.displaySettings?.showOnlyAfterVoteCloses ?? false;

        setShowAfterVotingOnly(
          closeOnlyEnabled
            ? false
            : (vote.displaySettings?.showAfterVotingOnly ?? false),
        );
        setShowOnlyAfterVoteCloses(closeOnlyEnabled);

        setHasSubmissions((vote.submissionCount ?? 0) > 0);
      } catch (err) {
        setPageError(
          err instanceof Error ? err.message : 'Failed to load consultation',
        );
      } finally {
        setPageLoading(false);
      }
    }

    if (
      user &&
      token &&
      isAdminRole(user.role) &&
      hasPermission(user.role, PERMISSIONS.CONSULTATION_EDIT)
    ) {
      void loadVote();
    } else if (user) {
      setPageLoading(false);
    }
  }, [user, token, params.slug]);

  const coreFieldsLocked = useMemo(() => hasSubmissions, [hasSubmissions]);
  const normalizedShowAfterVotingOnly = showOnlyAfterVoteCloses
    ? false
    : showAfterVotingOnly;

  function handleShowAfterVotingOnlyChange(value: boolean) {
    setShowAfterVotingOnly(value);

    if (value) {
      setShowOnlyAfterVoteCloses(false);
    }
  }

  function handleShowOnlyAfterVoteClosesChange(value: boolean) {
    setShowOnlyAfterVoteCloses(value);

    if (value) {
      setShowAfterVotingOnly(false);
    }
  }

  function handleCoverFileChange(file: File | null) {
    setSelectedCoverFile(file);
    setCoverUploadMessage(null);
  }

  async function handleUploadCoverImage() {
    if (!token) {
      setPageError('You must be signed in');
      return;
    }

    if (!selectedCoverFile) {
      setPageError('Please choose an image file first');
      return;
    }

    setPageError(null);
    setSuccessMessage(null);
    setCoverUploadMessage(null);
    setIsUploadingCover(true);

    try {
      const response = await uploadAdminVoteCover(
        token,
        selectedCoverFile,
        params.slug,
      );

      setCoverImageUrl(response.file.publicUrl);

      if (!coverImageAlt.trim()) {
        setCoverImageAlt(title.trim() || 'Consultation cover image');
      }

      setCoverUploadMessage('Cover image uploaded successfully');
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : 'Failed to upload cover image',
      );
    } finally {
      setIsUploadingCover(false);
    }
  }

 async function handleSave() {
    if (!token) {
      setPageError('You must be signed in');
      return;
    }

    if (selectedCoverFile && !coverImageUrl) {
      setPageError('Please upload the selected cover image before saving');
      return;
    }

    setIsSaving(true);
    setPageError(null);
    setSuccessMessage(null);

    try {
      const payload = coreFieldsLocked
        ? {
            status,
            coverImageUrl: coverImageUrl.trim() || undefined,
            coverImageAlt: coverImageAlt.trim() || undefined,
            endAt: new Date(endAt).toISOString(),
            isPublished,
            resultVisibilityMode,
            showParticipationStats,
            showStakeholderBreakdown,
            showBackgroundBreakdown,
            showLocationBreakdown,
            showAgeRangeBreakdown,
            showGenderBreakdown,
            showExperienceLevelBreakdown,
            showRelationshipBreakdown,
            showAfterVotingOnly: normalizedShowAfterVotingOnly,
            showOnlyAfterVoteCloses,
          }
        : {
            title,
            summary,
            methodologySummary,
            status,
            coverImageUrl: coverImageUrl.trim() || undefined,
            coverImageAlt: coverImageAlt.trim() || undefined,
            startAt: new Date(startAt).toISOString(),
            endAt: new Date(endAt).toISOString(),
            isPublished,
            resultVisibilityMode,
            showParticipationStats,
            showStakeholderBreakdown,
            showBackgroundBreakdown,
            showLocationBreakdown,
            showAgeRangeBreakdown,
            showGenderBreakdown,
            showExperienceLevelBreakdown,
            showRelationshipBreakdown,
            showAfterVotingOnly: normalizedShowAfterVotingOnly,
            showOnlyAfterVoteCloses,
          };

      await updateAdminVote(token, params.slug, payload);

      setSuccessMessage('Consultation updated successfully');
      setSelectedCoverFile(null);
      setCoverUploadMessage(null);
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : 'Failed to update consultation',
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || pageLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">Loading consultation editor...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  if (!hasPermission(user.role, PERMISSIONS.CONSULTATION_EDIT)) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            You do not have permission to edit this consultation.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <section className="pb-10">
          <div className="mb-8 h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <Link
                href={`/admin/consultations/${params.slug}`}
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                ← Back to admin consultation
              </Link>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Consultation editor
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Edit Consultation
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Update consultation settings, publication state, workflow status,
                schedule, and public visibility rules.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusPill
                label={isPublished ? 'Published' : 'Unpublished'}
                tone={isPublished ? 'success' : 'warning'}
              />
              <StatusPill
                label={hasSubmissions ? 'Has submissions' : 'No submissions yet'}
                tone={hasSubmissions ? 'default' : 'muted'}
              />
              <StatusPill
                label={status}
                tone={deriveWorkflowTone(status)}
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          {coreFieldsLocked ? (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              This consultation already has submissions. Core fields are locked.
              You can still change safe fields such as status, publication
              state, end date, cover image, and public visibility settings.
            </div>
          ) : null}

          {pageError ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {pageError}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
              {successMessage}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <section className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">Core information</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    These fields describe the consultation itself.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Title"
                    value={title}
                    onChange={setTitle}
                    disabled={coreFieldsLocked}
                  />

                  <SelectField
                    label="Workflow status"
                    value={status}
                    onChange={(value) =>
                      setStatus(
                        value as
                          | 'DRAFT'
                          | 'REVIEW'
                          | 'APPROVED'
                          | 'PUBLISHED'
                          | 'CLOSED'
                          | 'ARCHIVED'
                          | 'CANCELLED',
                      )
                    }
                    options={[
                      'DRAFT',
                      'REVIEW',
                      'APPROVED',
                      'PUBLISHED',
                      'CLOSED',
                      'ARCHIVED',
                      'CANCELLED',
                    ]}
                  />

                  <div className="md:col-span-2">
                    <TextAreaField
                      label="Summary"
                      value={summary}
                      onChange={setSummary}
                      disabled={coreFieldsLocked}
                      rows={4}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TextAreaField
                      label="Methodology summary"
                      value={methodologySummary}
                      onChange={setMethodologySummary}
                      disabled={coreFieldsLocked}
                      rows={5}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">Schedule</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Control when the consultation opens and closes. Start date
                    becomes locked after submissions exist.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <DateTimeField
                    label="Start at"
                    value={startAt}
                    onChange={setStartAt}
                    disabled={coreFieldsLocked}
                  />
                  <DateTimeField
                    label="End at"
                    value={endAt}
                    onChange={setEndAt}
                  />
                </div>
              </section>

              <section className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">Cover image</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Upload or replace the public image for this consultation.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Select image
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) =>
                        handleCoverFileChange(event.target.files?.[0] ?? null)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-900"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Allowed: JPG, PNG, WEBP. Maximum size: 2MB.
                    </p>
                  </div>

                  <Field
                    label="Cover image alt text"
                    value={coverImageAlt}
                    onChange={setCoverImageAlt}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleUploadCoverImage}
                    disabled={isUploadingCover || !selectedCoverFile}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {isUploadingCover ? 'Uploading...' : 'Upload cover image'}
                  </button>

                  {coverUploadMessage ? (
                    <span className="text-sm text-green-700">{coverUploadMessage}</span>
                  ) : null}
                </div>

                {coverImageUrl ? (
                  <div className="mt-5 max-w-md">
                    <p className="mb-2 text-sm font-medium text-slate-700">Preview</p>
                    <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <img
                        src={coverImageUrl}
                        alt={coverImageAlt || 'Consultation cover preview'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="mt-2 break-all text-xs text-slate-500">
                      {coverImageUrl}
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 flex aspect-square w-full max-w-md items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm text-slate-500">
                    No cover image uploaded yet.
                  </div>
                )}
              </section>

              <section className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">Publication</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    This controls whether the consultation is publicly visible.
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <label className="flex items-start gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(event) => setIsPublished(event.target.checked)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-slate-900">
                        Published and publicly visible
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        When enabled, eligible users can access the consultation
                        from the public side.
                      </p>
                    </div>
                  </label>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">Visibility controls</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Decide what results and analytics the public can see.
                  </p>
                </div>

                <div className="space-y-5">
                  <SelectField
                    label="Result visibility"
                    value={resultVisibilityMode}
                    onChange={(value) =>
                      setResultVisibilityMode(
                        value as
                          | 'HIDE_ALL'
                          | 'SHOW_RAW_ONLY'
                          | 'SHOW_WEIGHTED_ONLY'
                          | 'SHOW_BOTH',
                      )
                    }
                    options={[
                      'HIDE_ALL',
                      'SHOW_RAW_ONLY',
                      'SHOW_WEIGHTED_ONLY',
                      'SHOW_BOTH',
                    ]}
                  />

                  <div className="grid gap-3">
                    <CheckboxField
                      label="Show participation stats"
                      description="Show participant totals on the public page."
                      checked={showParticipationStats}
                      onChange={setShowParticipationStats}
                    />
                    <CheckboxField
                      label="Show stakeholder breakdown"
                      description="Allow public stakeholder analytics charts."
                      checked={showStakeholderBreakdown}
                      onChange={setShowStakeholderBreakdown}
                    />
                    <CheckboxField
                      label="Show background breakdown"
                      description="Allow public background-category analytics."
                      checked={showBackgroundBreakdown}
                      onChange={setShowBackgroundBreakdown}
                    />
                    <CheckboxField
                      label="Show location breakdown"
                      description="Allow public location-based analytics."
                      checked={showLocationBreakdown}
                      onChange={setShowLocationBreakdown}
                    />
                    <CheckboxField
                      label="Show age range breakdown"
                      description="Allow public age-range analytics."
                      checked={showAgeRangeBreakdown}
                      onChange={setShowAgeRangeBreakdown}
                    />
                    <CheckboxField
                      label="Show gender breakdown"
                      description="Allow public gender analytics."
                      checked={showGenderBreakdown}
                      onChange={setShowGenderBreakdown}
                    />
                    <CheckboxField
                      label="Show experience level breakdown"
                      description="Allow public experience-level analytics."
                      checked={showExperienceLevelBreakdown}
                      onChange={setShowExperienceLevelBreakdown}
                    />
                    <CheckboxField
                      label="Show relationship to area breakdown"
                      description="Allow public relationship-to-area analytics."
                      checked={showRelationshipBreakdown}
                      onChange={setShowRelationshipBreakdown}
                    />
                    <CheckboxField
                      label="Show after voting only"
                      description={
                        showOnlyAfterVoteCloses
                          ? 'Disabled while close-only visibility is enabled.'
                          : 'Hide results and analytics until the user submits a vote.'
                      }
                      checked={normalizedShowAfterVotingOnly}
                      onChange={handleShowAfterVotingOnlyChange}
                      disabled={showOnlyAfterVoteCloses}
                    />
                    <CheckboxField
                      label="Show only after vote closes"
                      description="Hide public insights until the consultation has ended."
                      checked={showOnlyAfterVoteCloses}
                      onChange={handleShowOnlyAfterVoteClosesChange}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">Edit policy</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Rules that apply when updating this consultation.
                  </p>
                </div>

                <div className="space-y-3">
                  <PolicyItem
                    label="Title, summary, methodology"
                    value={coreFieldsLocked ? 'Locked' : 'Editable'}
                    tone={coreFieldsLocked ? 'warning' : 'success'}
                  />
                  <PolicyItem
                    label="Start date"
                    value={coreFieldsLocked ? 'Locked' : 'Editable'}
                    tone={coreFieldsLocked ? 'warning' : 'success'}
                  />
                  <PolicyItem
                    label="End date"
                    value="Editable"
                    tone="success"
                  />
                  <PolicyItem
                    label="Cover image"
                    value="Editable"
                    tone="success"
                  />
                  <PolicyItem
                    label="Publication state"
                    value="Editable"
                    tone="success"
                  />
                  <PolicyItem
                    label="Visibility controls"
                    value="Editable"
                    tone="success"
                  />
                  <PolicyItem
                    label="Workflow status"
                    value="Editable"
                    tone="success"
                  />
                </div>
              </section>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || isUploadingCover}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>

            <Link
              href={`/admin/consultations/${params.slug}`}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const pad = (num: number) => String(num).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 disabled:bg-slate-100"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  disabled = false,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        value={value}
        rows={rows}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 disabled:bg-slate-100"
      />
    </div>
  );
}

function DateTimeField({
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
        type="datetime-local"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 disabled:bg-slate-100"
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
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-900"
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

function CheckboxField({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-2xl border px-4 py-4 text-sm ${
        disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500'
          : 'border-slate-200 bg-slate-50 text-slate-700'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5"
      />
      <div>
        <p
          className={`font-medium ${
            disabled ? 'text-slate-500' : 'text-slate-900'
          }`}
        >
          {label}
        </p>
        <p
          className={`mt-1 text-sm leading-6 ${
            disabled ? 'text-slate-500' : 'text-slate-600'
          }`}
        >
          {description}
        </p>
      </div>
    </label>
  );
}

function PolicyItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'success' | 'warning' | 'default';
}) {
  const toneClass =
    tone === 'success'
      ? 'bg-emerald-100 text-emerald-700'
      : tone === 'warning'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-slate-100 text-slate-700';

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-700">{label}</span>
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: 'success' | 'warning' | 'danger' | 'muted' | 'default';
}) {
  const toneClass =
    tone === 'success'
      ? 'bg-emerald-100 text-emerald-700'
      : tone === 'warning'
        ? 'bg-amber-100 text-amber-700'
        : tone === 'danger'
          ? 'bg-red-100 text-red-700'
          : tone === 'muted'
            ? 'bg-slate-100 text-slate-700'
            : 'bg-white text-slate-900 ring-1 ring-slate-200';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${toneClass}`}>
      {label}
    </span>
  );
}

function deriveWorkflowTone(
  status:
    | 'DRAFT'
    | 'REVIEW'
    | 'APPROVED'
    | 'PUBLISHED'
    | 'CLOSED'
    | 'ARCHIVED'
    | 'CANCELLED',
): 'success' | 'warning' | 'danger' | 'muted' | 'default' {
  if (status === 'PUBLISHED' || status === 'APPROVED') {
    return 'success';
  }

  if (status === 'DRAFT' || status === 'REVIEW') {
    return 'warning';
  }

  if (status === 'CANCELLED') {
    return 'danger';
  }

  if (status === 'ARCHIVED' || status === 'CLOSED') {
    return 'muted';
  }

  return 'default';
}
