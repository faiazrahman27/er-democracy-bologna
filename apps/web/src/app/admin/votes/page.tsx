"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { isAdminRole } from "@/lib/roles";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { formatEnumLabel } from "@/lib/format";
import { createAdminVote, uploadAdminVoteCover } from "@/lib/admin-votes";
import {
  WeightedQuestionsEditor,
  buildWeightedQuestionPayload,
  type WeightedQuestionDraft,
} from "@/components/admin/WeightedQuestionsEditor";

type OptionInput = {
  optionText: string;
  displayOrder: number;
};

export default function AdminVotesPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [voteType, setVoteType] = useState<
    "GENERAL" | "SPECIALIZED" | "SELF_ASSESSMENT"
  >("SELF_ASSESSMENT");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [methodologySummary, setMethodologySummary] = useState("");
  const [topicCategory, setTopicCategory] = useState("");
  const [status, setStatus] = useState<
    | "DRAFT"
    | "REVIEW"
    | "APPROVED"
    | "PUBLISHED"
    | "CLOSED"
    | "ARCHIVED"
    | "CANCELLED"
  >("PUBLISHED");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageAlt, setCoverImageAlt] = useState("");
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadMessage, setCoverUploadMessage] = useState<string | null>(
    null,
  );

  const [options, setOptions] = useState<OptionInput[]>([
    { optionText: "", displayOrder: 1 },
    { optionText: "", displayOrder: 2 },
  ]);
  const [weightedQuestions, setWeightedQuestions] = useState<
    WeightedQuestionDraft[]
  >([]);

  const [resultVisibilityMode, setResultVisibilityMode] = useState<
    "HIDE_ALL" | "SHOW_RAW_ONLY" | "SHOW_WEIGHTED_ONLY" | "SHOW_BOTH"
  >("SHOW_BOTH");
  const [showParticipationStats, setShowParticipationStats] = useState(true);
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedShowAfterVotingOnly = showOnlyAfterVoteCloses
    ? false
    : showAfterVotingOnly;

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?redirectTo=/admin/votes");
      return;
    }

    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  const normalizedOptions = useMemo(
    () =>
      options.map((option, index) => ({
        optionText: option.optionText.trim(),
        displayOrder: index + 1,
      })),
    [options],
  );

  function updateOption(index: number, value: string) {
    setOptions((current) =>
      current.map((option, idx) =>
        idx === index
          ? { ...option, optionText: value, displayOrder: idx + 1 }
          : option,
      ),
    );
  }

  function addOption() {
    setOptions((current) => [
      ...current,
      {
        optionText: "",
        displayOrder: current.length + 1,
      },
    ]);
  }

  function removeOption(index: number) {
    setOptions((current) =>
      current
        .filter((_, idx) => idx !== index)
        .map((option, idx) => ({ ...option, displayOrder: idx + 1 })),
    );
  }

  function handleCoverFileChange(file: File | null) {
    setSelectedCoverFile(file);
    setCoverUploadMessage(null);
  }

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

  async function handleUploadCoverImage() {
    if (!token) {
      setError("You must be signed in");
      return;
    }

    if (!selectedCoverFile) {
      setError("Please choose an image file first");
      return;
    }

    if (!slug.trim()) {
      setError("Slug is required before uploading a cover image");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setCoverUploadMessage(null);
    setIsUploadingCover(true);

    try {
      const response = await uploadAdminVoteCover(
        token,
        selectedCoverFile,
        slug,
      );

      setCoverImageUrl(response.file.publicUrl);

      if (!coverImageAlt.trim()) {
        setCoverImageAlt(title.trim() || "Consultation cover image");
      }

      setCoverUploadMessage("Cover image uploaded successfully");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload cover image",
      );
    } finally {
      setIsUploadingCover(false);
    }
  }

  async function handleCreateVote() {
    if (!token) {
      setError("You must be signed in");
      return;
    }

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!slug.trim()) {
      setError("Slug is required");
      return;
    }

    if (!summary.trim()) {
      setError("Summary is required");
      return;
    }

    if (!topicCategory.trim()) {
      setError("Topic category is required");
      return;
    }

    if (!startAt) {
      setError("Start date is required");
      return;
    }

    if (!endAt) {
      setError("End date is required");
      return;
    }

    if (normalizedOptions.some((option) => !option.optionText)) {
      setError("All options must have text");
      return;
    }

    if (selectedCoverFile && !coverImageUrl) {
      setError(
        "Please upload the selected cover image before creating the consultation",
      );
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const weightedQuestionPayload =
        voteType === "SPECIALIZED"
          ? buildWeightedQuestionPayload(weightedQuestions)
          : undefined;

      const response = await createAdminVote(token, {
        slug: slug.trim(),
        title: title.trim(),
        summary: summary.trim(),
        methodologySummary: methodologySummary.trim(),
        voteType,
        topicCategory: topicCategory.trim(),
        status,
        coverImageUrl: coverImageUrl.trim() || undefined,
        coverImageAlt: coverImageAlt.trim() || undefined,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        isPublished,
        options: normalizedOptions,
        weightedQuestions: weightedQuestionPayload,
        displaySettings: {
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
        },
      });

      setSuccessMessage(
        `${response.message} Open /consultations/${response.vote.slug} to test it.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vote");
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
              Loading consultation creator...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  if (!hasPermission(user.role, PERMISSIONS.CONSULTATION_CREATE)) {
    return (
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="border-y border-red-200 py-4 text-sm font-bold text-red-700">
            You do not have permission to create consultations.
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
                  href="/admin"
                  className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                >
                  ← Back to admin
                </Link>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <StatusPill label={formatEnumLabel(voteType)} tone="default" />
                  <StatusPill
                    label={formatEnumLabel(status)}
                    tone={deriveWorkflowTone(status)}
                  />
                  <StatusPill
                    label={isPublished ? "Public enabled" : "Public disabled"}
                    tone={isPublished ? "success" : "warning"}
                  />
                </div>

                <p className="mt-7 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Create consultation
                </p>

                <h1 className="mt-4 max-w-4xl break-words text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                  New consultation setup
                </h1>

                <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
                  Create a consultation with public options, vote type,
                  schedule, cover image, and result visibility settings.
                </p>
              </div>

              <aside className="border-y border-slate-200 py-5 lg:mt-11">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Create action
                </p>

                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    onClick={handleCreateVote}
                    disabled={isSubmitting || isUploadingCover}
                    className="inline-flex min-h-12 w-full items-center justify-center border border-green-500 bg-white px-5 text-sm font-black text-green-700 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-green-50 hover:shadow-md active:-translate-y-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Creating..." : "Create consultation"}
                  </button>

                  <Link
                    href="/admin/consultations"
                    className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                  >
                    View consultations
                  </Link>
                </div>
              </aside>
            </div>
          </header>

          <section className="mt-10">
            {error ? <MessageBlock tone="danger">{error}</MessageBlock> : null}

            {successMessage ? (
              <MessageBlock tone="success">{successMessage}</MessageBlock>
            ) : null}
          </section>

          <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] xl:items-start">
            <div className="grid min-w-0 gap-10">
              <CreateSection
                eyebrow="Core information"
                title="Consultation identity"
                description="Write the main public text. The text inside empty boxes is only guidance and disappears when you start typing."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Title"
                    value={title}
                    onChange={setTitle}
                    placeholder="Write the public consultation title"
                  />
                  <Field
                    label="Slug"
                    value={slug}
                    onChange={setSlug}
                    placeholder="write-url-slug-for-this-consultation"
                  />
                  <Field
                    label="Topic category"
                    value={topicCategory}
                    onChange={setTopicCategory}
                    placeholder="Write the topic area, for example mobility or housing"
                  />
                  <SelectField
                    label="Vote type"
                    value={voteType}
                    onChange={(value) =>
                      setVoteType(
                        value as
                          | "GENERAL"
                          | "SPECIALIZED"
                          | "SELF_ASSESSMENT",
                      )
                    }
                    options={["GENERAL", "SPECIALIZED", "SELF_ASSESSMENT"]}
                  />
                  <div className="md:col-span-2">
                    <TextAreaField
                      label="Summary"
                      value={summary}
                      onChange={setSummary}
                      rows={4}
                      placeholder="Write a short explanation of what people are voting on"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <TextAreaField
                      label="Methodology summary"
                      value={methodologySummary}
                      onChange={setMethodologySummary}
                      rows={5}
                      placeholder="Explain how voting, confidence, weighting, or results are calculated"
                    />
                  </div>
                </div>
              </CreateSection>

              <CreateSection
                eyebrow="Workflow and schedule"
                title="Status and voting window"
                description="Choose the workflow state and the period when voting should be available."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <SelectField
                    label="Status"
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
                  <CheckboxField
                    label="Publish this consultation immediately"
                    description="The consultation is publicly reachable only when publication and workflow settings allow it."
                    checked={isPublished}
                    onChange={setIsPublished}
                  />
                  <DateTimeField
                    label="Start at"
                    value={startAt}
                    onChange={setStartAt}
                    guidance="Choose when voting should open."
                  />
                  <DateTimeField
                    label="End at"
                    value={endAt}
                    onChange={setEndAt}
                    guidance="Choose when voting should close."
                  />
                </div>
              </CreateSection>

              <CreateSection
                eyebrow="Voting options"
                title="Options people can choose"
                description="Create at least two options. Option order is calculated automatically from top to bottom."
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {options.length} options
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Keep option text short enough to scan on mobile.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addOption}
                    className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-500 hover:text-green-700 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                  >
                    Add option
                  </button>
                </div>

                <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
                  {options.map((option, index) => (
                    <div key={index} className="py-4">
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                        <div className="min-w-0">
                          <label className="mb-2 block text-sm font-bold text-slate-800">
                            Option {index + 1}
                          </label>
                          <input
                            type="text"
                            value={option.optionText}
                            onChange={(event) =>
                              updateOption(index, event.target.value)
                            }
                            placeholder={`Write option ${index + 1}`}
                            className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-slate-900"
                          />
                        </div>

                        {options.length > 2 ? (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition duration-200 hover:-translate-y-1 hover:border-red-300 hover:text-red-700 hover:shadow-md active:-translate-y-1 active:scale-[0.98] sm:mt-7"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </CreateSection>

              <CreateSection
                eyebrow="Media"
                title="Cover image"
                description="Upload or attach a public cover image for this consultation."
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
              </CreateSection>

              {voteType === "SPECIALIZED" ? (
                <CreateSection
                  eyebrow="Specialized vote"
                  title="Weighted questions"
                  description="Add specialized-only questions whose selected answers adjust the final specialized vote weight."
                >
                  <WeightedQuestionsEditor
                    value={weightedQuestions}
                    onChange={setWeightedQuestions}
                  />
                </CreateSection>
              ) : null}
            </div>

            <aside className="grid min-w-0 gap-10">
              <CreateSection
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
              </CreateSection>

              <CreateSection
                eyebrow="Setup checklist"
                title="Required before create"
                description="Use this to quickly see what is still missing before pressing Create consultation."
              >
                <div className="grid gap-3">
                  <ChecklistItem
                    label="Title"
                    complete={Boolean(title.trim())}
                  />
                  <ChecklistItem label="Slug" complete={Boolean(slug.trim())} />
                  <ChecklistItem
                    label="Summary"
                    complete={Boolean(summary.trim())}
                  />
                  <ChecklistItem
                    label="Topic category"
                    complete={Boolean(topicCategory.trim())}
                  />
                  <ChecklistItem label="Start date" complete={Boolean(startAt)} />
                  <ChecklistItem label="End date" complete={Boolean(endAt)} />
                  <ChecklistItem
                    label="All options have text"
                    complete={normalizedOptions.every(
                      (option) => option.optionText,
                    )}
                  />
                </div>
              </CreateSection>
            </aside>
          </div>

          <div className="mt-10 border-t border-slate-200 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleCreateVote}
                disabled={isSubmitting || isUploadingCover}
                className="inline-flex min-h-12 w-full items-center justify-center border border-green-500 bg-white px-5 text-sm font-black text-green-700 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-green-50 hover:shadow-md active:-translate-y-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isSubmitting ? "Creating..." : "Create consultation"}
              </button>

              <Link
                href="/admin/consultations"
                className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98] sm:w-auto"
              >
                View consultations
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
  tone: "success" | "danger";
  children: ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "border-green-200 text-green-700"
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
  rows = 4,
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
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y border border-slate-300 bg-white px-3 py-3 text-sm leading-7 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-slate-900"
      />
    </div>
  );
}

function DateTimeField({
  label,
  value,
  onChange,
  guidance,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  guidance: string;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-bold text-slate-800">
        {label}
      </label>
      <input
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition hover:border-slate-400 focus:border-slate-900"
      />
      <p className="mt-2 text-xs leading-5 text-slate-500">{guidance}</p>
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

function ChecklistItem({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
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
        {complete ? "Ready" : "Needed"}
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
