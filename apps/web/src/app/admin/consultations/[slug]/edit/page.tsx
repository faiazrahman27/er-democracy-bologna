"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import {
  fetchAdminVoteBySlug,
  updateAdminVote,
  uploadAdminVoteCover,
} from "@/lib/admin-votes";
import {
  WeightedQuestionsEditor,
  buildWeightedQuestionPayload,
  normalizeWeightedQuestionDrafts,
  type WeightedQuestionDraft,
} from "@/components/admin/WeightedQuestionsEditor";
import { isAdminRole } from "@/lib/roles";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { formatEnumLabel } from "@/lib/format";

export default function AdminEditConsultationPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const { user, token, isLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [methodologySummary, setMethodologySummary] = useState("");
  const [status, setStatus] = useState<
    | "DRAFT"
    | "REVIEW"
    | "APPROVED"
    | "PUBLISHED"
    | "CLOSED"
    | "ARCHIVED"
    | "CANCELLED"
  >("PUBLISHED");
  const [voteType, setVoteType] = useState<
    "GENERAL" | "SPECIALIZED" | "SELF_ASSESSMENT"
  >("GENERAL");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageAlt, setCoverImageAlt] = useState("");
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadMessage, setCoverUploadMessage] = useState<string | null>(
    null,
  );

  const [resultVisibilityMode, setResultVisibilityMode] = useState<
    "HIDE_ALL" | "SHOW_RAW_ONLY" | "SHOW_WEIGHTED_ONLY" | "SHOW_BOTH"
  >("HIDE_ALL");
  const [showParticipationStats, setShowParticipationStats] = useState(false);
  const [showStakeholderBreakdown, setShowStakeholderBreakdown] =
    useState(false);
  const [showBackgroundBreakdown, setShowBackgroundBreakdown] = useState(false);
  const [showLocationBreakdown, setShowLocationBreakdown] = useState(false);
  const [showAgeRangeBreakdown, setShowAgeRangeBreakdown] = useState(false);
  const [showGenderBreakdown, setShowGenderBreakdown] = useState(false);
  const [showExperienceLevelBreakdown, setShowExperienceLevelBreakdown] =
    useState(false);
  const [showYearsOfExperienceBreakdown, setShowYearsOfExperienceBreakdown] =
    useState(false);
  const [showStudyLevelBreakdown, setShowStudyLevelBreakdown] = useState(false);
  const [showRelationshipBreakdown, setShowRelationshipBreakdown] =
    useState(false);
  const [showAfterVotingOnly, setShowAfterVotingOnly] = useState(false);
  const [showOnlyAfterVoteCloses, setShowOnlyAfterVoteCloses] = useState(false);
  const [weightedQuestions, setWeightedQuestions] = useState<
    WeightedQuestionDraft[]
  >([]);

  const [hasSubmissions, setHasSubmissions] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(
        `/login?redirectTo=/admin/consultations/${params.slug}/edit`,
      );
      return;
    }

    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace("/dashboard");
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
        setMethodologySummary(vote.methodologySummary ?? "");
        setVoteType(
          vote.voteType as "GENERAL" | "SPECIALIZED" | "SELF_ASSESSMENT",
        );
        setStatus(
          vote.status as
            | "DRAFT"
            | "REVIEW"
            | "APPROVED"
            | "PUBLISHED"
            | "CLOSED"
            | "ARCHIVED"
            | "CANCELLED",
        );
        setStartAt(toDateTimeLocal(vote.startAt));
        setEndAt(toDateTimeLocal(vote.endAt));
        setIsPublished(vote.isPublished);
        setCoverImageUrl(vote.coverImageUrl ?? "");
        setCoverImageAlt(vote.coverImageAlt ?? "");

        setResultVisibilityMode(
          vote.displaySettings?.resultVisibilityMode ?? "HIDE_ALL",
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
        setShowYearsOfExperienceBreakdown(
          vote.displaySettings?.showYearsOfExperienceBreakdown ?? false,
        );
        setShowStudyLevelBreakdown(
          vote.displaySettings?.showStudyLevelBreakdown ?? false,
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
        setWeightedQuestions(
          normalizeWeightedQuestionDrafts(vote.weightedQuestions),
        );
      } catch (err) {
        setPageError(
          err instanceof Error ? err.message : "Failed to load consultation",
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
      setPageError("You must be signed in");
      return;
    }

    if (!selectedCoverFile) {
      setPageError("Please choose an image file first");
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
        setCoverImageAlt(title.trim() || "Consultation cover image");
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

  async function handleSave() {
    if (!token) {
      setPageError("You must be signed in");
      return;
    }

    if (selectedCoverFile && !coverImageUrl) {
      setPageError("Please upload the selected cover image before saving");
      return;
    }

    setIsSaving(true);
    setPageError(null);
    setSuccessMessage(null);

    try {
      const weightedQuestionPayload =
        voteType === "SPECIALIZED" && !coreFieldsLocked
          ? buildWeightedQuestionPayload(weightedQuestions)
          : undefined;

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
            showYearsOfExperienceBreakdown,
            showStudyLevelBreakdown,
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
            showYearsOfExperienceBreakdown,
            showStudyLevelBreakdown,
            showRelationshipBreakdown,
            showAfterVotingOnly: normalizedShowAfterVotingOnly,
            showOnlyAfterVoteCloses,
            weightedQuestions: weightedQuestionPayload,
          };

      await updateAdminVote(token, params.slug, payload);

      setSuccessMessage("Consultation updated successfully");
      setSelectedCoverFile(null);
      setCoverUploadMessage(null);
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Failed to update consultation",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || pageLoading) {
    return (
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="border-y border-slate-200 py-6">
            <p className="text-sm font-medium text-slate-500">
              Loading consultation editor...
            </p>
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
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="border-y border-red-200 py-4 text-sm font-bold text-red-700">
            You do not have permission to edit this consultation.
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
                  href={`/admin/consultations/${params.slug}`}
                  className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                >
                  ← Back to admin consultation
                </Link>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <StatusPill
                    label={isPublished ? "Published" : "Unpublished"}
                    tone={isPublished ? "success" : "warning"}
                  />
                  <StatusPill
                    label={
                      hasSubmissions ? "Has submissions" : "No submissions yet"
                    }
                    tone={hasSubmissions ? "default" : "muted"}
                  />
                  <StatusPill
                    label={formatEnumLabel(status)}
                    tone={deriveWorkflowTone(status)}
                  />
                </div>

                <p className="mt-7 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Consultation editor
                </p>

                <h1 className="mt-4 max-w-4xl break-words text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                  Edit consultation
                </h1>

                <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
                  Update the consultation record, schedule, publication state,
                  cover image, and public result visibility.
                </p>
              </div>

              <aside className="border-y border-slate-200 py-5 lg:mt-11">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Save actions
                </p>

                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || isUploadingCover}
                    className="inline-flex min-h-12 w-full items-center justify-center border border-green-500 bg-white px-5 text-sm font-black text-green-700 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-green-50 hover:shadow-md active:-translate-y-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>

                  <Link
                    href={`/admin/consultations/${params.slug}`}
                    className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                  >
                    Cancel
                  </Link>
                </div>
              </aside>
            </div>
          </header>

          <section className="mt-10">
            {coreFieldsLocked ? (
              <MessageBlock tone="warning">
                This consultation already has submissions. Core fields are
                locked. You can still change safe fields such as status,
                publication state, end date, cover image, and public visibility
                settings.
              </MessageBlock>
            ) : null}

            {pageError ? <MessageBlock tone="danger">{pageError}</MessageBlock> : null}

            {successMessage ? (
              <MessageBlock tone="success">{successMessage}</MessageBlock>
            ) : null}
          </section>

          <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] xl:items-start">
            <div className="grid min-w-0 gap-10">
              <EditSection
                eyebrow="Core information"
                title="Main consultation text"
                description="These fields describe the public consultation. If the consultation already has submissions, the core text remains locked."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Title"
                    value={title}
                    onChange={setTitle}
                    disabled={coreFieldsLocked}
                    placeholder="Write the public consultation title"
                  />

                  <SelectField
                    label="Workflow status"
                    value={status}
                    onChange={(value) =>
                      setStatus(
                        value as
                          | "DRAFT"
                          | "REVIEW"
                          | "APPROVED"
                          | "PUBLISHED"
                          | "CLOSED"
                          | "ARCHIVED"
                          | "CANCELLED",
                      )
                    }
                    options={[
                      "DRAFT",
                      "REVIEW",
                      "APPROVED",
                      "PUBLISHED",
                      "CLOSED",
                      "ARCHIVED",
                      "CANCELLED",
                    ]}
                  />

                  <div className="md:col-span-2">
                    <TextAreaField
                      label="Summary"
                      value={summary}
                      onChange={setSummary}
                      disabled={coreFieldsLocked}
                      rows={4}
                      placeholder="Write a short explanation of what people are voting on"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TextAreaField
                      label="Methodology summary"
                      value={methodologySummary}
                      onChange={setMethodologySummary}
                      disabled={coreFieldsLocked}
                      rows={5}
                      placeholder="Explain how votes, weights, or results are calculated"
                    />
                  </div>
                </div>
              </EditSection>

              <EditSection
                eyebrow="Schedule"
                title="Voting window"
                description="Control when voting opens and closes. Start date locks after submissions exist."
              >
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
              </EditSection>

              <EditSection
                eyebrow="Media"
                title="Cover image"
                description="Upload or replace the public image for this consultation."
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
                            alt={
                              coverImageAlt || "Consultation cover preview"
                            }
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
              </EditSection>

              <EditSection
                eyebrow="Publication"
                title="Public visibility"
                description="A consultation is public only when this flag is enabled and the workflow status is Published or Closed."
              >
                <CheckboxField
                  label="Enable public visibility"
                  description="Draft, Review, and Approved consultations remain hidden even if this box is checked."
                  checked={isPublished}
                  onChange={setIsPublished}
                />
              </EditSection>

              {voteType === "SPECIALIZED" ? (
                <EditSection
                  eyebrow="Specialized vote"
                  title="Weighted questions"
                  description="Configure specialized-only questions whose selected answers adjust the final specialized vote weight. These questions lock once submissions exist."
                >
                  <WeightedQuestionsEditor
                    value={weightedQuestions}
                    onChange={setWeightedQuestions}
                    disabled={coreFieldsLocked}
                  />
                </EditSection>
              ) : null}
            </div>

            <aside className="grid min-w-0 gap-10">
              <EditSection
                eyebrow="Visibility controls"
                title="Public result settings"
                description="Choose what result and analytics information can appear publicly."
              >
                <div className="grid gap-5">
                  <SelectField
                    label="Result visibility"
                    value={resultVisibilityMode}
                    onChange={(value) =>
                      setResultVisibilityMode(
                        value as
                          | "HIDE_ALL"
                          | "SHOW_RAW_ONLY"
                          | "SHOW_WEIGHTED_ONLY"
                          | "SHOW_BOTH",
                      )
                    }
                    options={[
                      "HIDE_ALL",
                      "SHOW_RAW_ONLY",
                      "SHOW_WEIGHTED_ONLY",
                      "SHOW_BOTH",
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
                      label="Show years of experience breakdown"
                      description="Allow public years-of-experience analytics."
                      checked={showYearsOfExperienceBreakdown}
                      onChange={setShowYearsOfExperienceBreakdown}
                    />
                    <CheckboxField
                      label="Show study level breakdown"
                      description="Allow public study-level analytics."
                      checked={showStudyLevelBreakdown}
                      onChange={setShowStudyLevelBreakdown}
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
                          ? "Disabled while close-only visibility is enabled."
                          : "Hide results and analytics until the user submits a vote."
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
              </EditSection>

              <EditSection
                eyebrow="Edit policy"
                title="Locked and editable areas"
                description="These rules reflect the current consultation state."
              >
                <div className="grid gap-3">
                  <PolicyItem
                    label="Title, summary, methodology"
                    value={coreFieldsLocked ? "Locked" : "Editable"}
                    tone={coreFieldsLocked ? "warning" : "success"}
                  />
                  <PolicyItem
                    label="Start date"
                    value={coreFieldsLocked ? "Locked" : "Editable"}
                    tone={coreFieldsLocked ? "warning" : "success"}
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
              </EditSection>
            </aside>
          </div>

          <div className="mt-10 border-t border-slate-200 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isUploadingCover}
                className="inline-flex min-h-12 w-full items-center justify-center border border-green-500 bg-white px-5 text-sm font-black text-green-700 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-green-50 hover:shadow-md active:-translate-y-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>

              <Link
                href={`/admin/consultations/${params.slug}`}
                className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98] sm:w-auto"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const pad = (num: number) => String(num).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function EditSection({
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
  tone: "success" | "warning" | "danger";
  children: ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "border-green-200 text-green-700"
      : tone === "warning"
        ? "border-amber-200 text-amber-800"
        : "border-red-200 text-red-700";

  return (
    <div className={`mt-4 border-y py-4 text-sm font-bold ${toneClass}`}>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
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
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
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
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y border border-slate-300 bg-white px-3 py-3 text-sm leading-7 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
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
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-bold text-slate-800">
        {label}
      </label>
      <input
        type="datetime-local"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition hover:border-slate-400 focus:border-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
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
      className={`flex items-start gap-3 border px-4 py-4 text-sm transition duration-200 ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
          : "cursor-pointer border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:-translate-y-0.5"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5"
      />
      <div className="min-w-0">
        <p
          className={`font-bold ${
            disabled ? "text-slate-500" : "text-slate-900"
          }`}
        >
          {label}
        </p>
        <p
          className={`mt-1 text-sm leading-6 ${
            disabled ? "text-slate-500" : "text-slate-600"
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
  tone: "success" | "warning" | "default";
}) {
  const toneClass =
    tone === "success"
      ? "border-green-200 text-green-700"
      : tone === "warning"
        ? "border-amber-200 text-amber-700"
        : "border-slate-200 text-slate-700";

  return (
    <div className="flex items-center justify-between gap-4 border border-slate-200 bg-white px-4 py-3">
      <span className="min-w-0 break-words text-sm text-slate-700">
        {label}
      </span>
      <span
        className={`shrink-0 border bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${toneClass}`}
      >
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

function deriveWorkflowTone(
  status:
    | "DRAFT"
    | "REVIEW"
    | "APPROVED"
    | "PUBLISHED"
    | "CLOSED"
    | "ARCHIVED"
    | "CANCELLED",
): "success" | "warning" | "danger" | "muted" | "default" {
  if (status === "PUBLISHED" || status === "APPROVED") {
    return "success";
  }

  if (status === "DRAFT" || status === "REVIEW") {
    return "warning";
  }

  if (status === "CANCELLED") {
    return "danger";
  }

  if (status === "ARCHIVED" || status === "CLOSED") {
    return "muted";
  }

  return "default";
}
