'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { isAdminRole } from '@/lib/roles';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { createAdminVote } from '@/lib/admin-votes';

type OptionInput = {
  optionText: string;
  displayOrder: number;
};

export default function AdminVotesPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [voteType, setVoteType] = useState<
    'GENERAL' | 'SPECIALIZED' | 'SELF_ASSESSMENT'
  >('SELF_ASSESSMENT');

  const [title, setTitle] = useState(
    'Public Transport Confidence Consultation',
  );
  const [slug, setSlug] = useState(
    'public-transport-confidence-april-2026',
  );
  const [summary, setSummary] = useState(
    'Consultation on preferred public transport improvements using confidence-weighted participation.',
  );
  const [methodologySummary, setMethodologySummary] = useState(
    'Participants select an option and provide a 1 to 10 confidence score. The score influences weight within a limited range.',
  );
  const [topicCategory, setTopicCategory] = useState('mobility');
  const [status, setStatus] = useState<
    'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED' | 'CANCELLED'
  >('PUBLISHED');
  const [startAt, setStartAt] = useState('2026-04-10T08:00');
  const [endAt, setEndAt] = useState('2026-04-20T20:00');
  const [isPublished, setIsPublished] = useState(true);

  const [options, setOptions] = useState<OptionInput[]>([
    { optionText: 'Increase bus frequency during peak hours', displayOrder: 1 },
    { optionText: 'Improve route reliability and punctuality', displayOrder: 2 },
  ]);

  const [resultVisibilityMode, setResultVisibilityMode] = useState<
    'HIDE_ALL' | 'SHOW_RAW_ONLY' | 'SHOW_WEIGHTED_ONLY' | 'SHOW_BOTH'
  >('SHOW_BOTH');
  const [showParticipationStats, setShowParticipationStats] = useState(true);
  const [showStakeholderBreakdown, setShowStakeholderBreakdown] = useState(false);
  const [showBackgroundBreakdown, setShowBackgroundBreakdown] = useState(false);
  const [showLocationBreakdown, setShowLocationBreakdown] = useState(false);
  const [showAfterVotingOnly, setShowAfterVotingOnly] = useState(false);
  const [showOnlyAfterVoteCloses, setShowOnlyAfterVoteCloses] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?redirectTo=/admin/votes');
      return;
    }

    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router]);

  const normalizedOptions = useMemo(
    () =>
      options.map((option, index) => ({
        optionText: option.optionText,
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
        optionText: '',
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

  async function handleCreateVote() {
    if (!token) {
      setError('You must be signed in');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await createAdminVote(token, {
        slug,
        title,
        summary,
        methodologySummary,
        voteType,
        topicCategory,
        status,
        coverImageUrl: '',
        coverImageAlt: '',
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        isPublished,
        options: normalizedOptions,
        displaySettings: {
          resultVisibilityMode,
          showParticipationStats,
          showStakeholderBreakdown,
          showBackgroundBreakdown,
          showLocationBreakdown,
          showAfterVotingOnly,
          showOnlyAfterVoteCloses,
        },
      });

      setSuccessMessage(
        `${response.message} Open /consultations/${response.vote.slug} to test it.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vote');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <main className="min-h-screen bg-slate-50 px-6 py-12">Loading...</main>;
  }

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  if (!hasPermission(user.role, PERMISSIONS.CONSULTATION_CREATE)) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            You do not have permission to create consultations.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to admin
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold">Create Consultation</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Use this screen to create a real consultation. For this step, we are
            validating the self-assessment flow end to end.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Field label="Title" value={title} onChange={setTitle} />
            <Field label="Slug" value={slug} onChange={setSlug} />
            <Field label="Topic category" value={topicCategory} onChange={setTopicCategory} />
            <SelectField
              label="Vote type"
              value={voteType}
              onChange={(value) =>
                setVoteType(value as 'GENERAL' | 'SPECIALIZED' | 'SELF_ASSESSMENT')
              }
              options={['GENERAL', 'SPECIALIZED', 'SELF_ASSESSMENT']}
            />
            <div className="md:col-span-2">
              <Field label="Summary" value={summary} onChange={setSummary} />
            </div>
            <div className="md:col-span-2">
              <Field
                label="Methodology summary"
                value={methodologySummary}
                onChange={setMethodologySummary}
              />
            </div>
            <SelectField
              label="Status"
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
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Start at
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(event) => setStartAt(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                End at
              </label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(event) => setEndAt(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(event) => setIsPublished(event.target.checked)}
                className="mt-0.5"
              />
              <span>Publish this consultation immediately.</span>
            </label>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Options</h2>
              <button
                type="button"
                onClick={addOption}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
              >
                Add option
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {options.map((option, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={option.optionText}
                    onChange={(event) => updateOption(index, event.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  {options.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold">Visibility settings</h2>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
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
              <CheckboxField
                label="Show participation stats"
                checked={showParticipationStats}
                onChange={setShowParticipationStats}
              />
              <CheckboxField
                label="Show stakeholder breakdown"
                checked={showStakeholderBreakdown}
                onChange={setShowStakeholderBreakdown}
              />
              <CheckboxField
                label="Show background breakdown"
                checked={showBackgroundBreakdown}
                onChange={setShowBackgroundBreakdown}
              />
              <CheckboxField
                label="Show location breakdown"
                checked={showLocationBreakdown}
                onChange={setShowLocationBreakdown}
              />
              <CheckboxField
                label="Show after voting only"
                checked={showAfterVotingOnly}
                onChange={setShowAfterVotingOnly}
              />
              <CheckboxField
                label="Show only after vote closes"
                checked={showOnlyAfterVoteCloses}
                onChange={setShowOnlyAfterVoteCloses}
              />
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMessage}
            </div>
          ) : null}

          <div className="mt-8">
            <button
              onClick={handleCreateVote}
              disabled={isSubmitting}
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? 'Creating...' : 'Create consultation'}
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

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5"
      />
      <span>{label}</span>
    </label>
  );
}
