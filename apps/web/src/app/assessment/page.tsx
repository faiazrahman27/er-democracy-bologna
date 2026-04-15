'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { fetchMyAssessment, saveMyAssessment } from '@/lib/assessments';
import { isAdminRole } from '@/lib/roles';
import {
  AGE_RANGE_OPTIONS,
  ASSESSMENT_COUNTRY,
  ASSESSMENT_COUNTRY_LABEL,
  ASSESSMENT_REGION,
  ASSESSMENT_REGION_LABEL,
  BACKGROUND_CATEGORY_OPTIONS,
  CITY_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  GENDER_OPTIONS,
  RELATIONSHIP_TO_AREA_OPTIONS,
  STAKEHOLDER_ROLE_OPTIONS,
  type SaveAssessmentPayload,
} from '@/types/assessment';

type AssessmentFormState = {
  ageRange: SaveAssessmentPayload['ageRange'] | '';
  gender: SaveAssessmentPayload['gender'] | '';
  city: SaveAssessmentPayload['city'] | '';
  region: SaveAssessmentPayload['region'];
  country: SaveAssessmentPayload['country'];
  stakeholderRole: SaveAssessmentPayload['stakeholderRole'] | '';
  backgroundCategory: SaveAssessmentPayload['backgroundCategory'] | '';
  experienceLevel: SaveAssessmentPayload['experienceLevel'] | '';
  relationshipToArea: SaveAssessmentPayload['relationshipToArea'] | '';
  assessmentCompleted: boolean;
};

function isCompleteAssessmentForm(
  form: AssessmentFormState,
): form is SaveAssessmentPayload {
  return (
    form.ageRange !== '' &&
    form.gender !== '' &&
    form.city !== '' &&
    form.stakeholderRole !== '' &&
    form.backgroundCategory !== '' &&
    form.experienceLevel !== '' &&
    form.relationshipToArea !== ''
  );
}

export default function AssessmentPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [form, setForm] = useState<AssessmentFormState>({
    ageRange: '',
    gender: '',
    city: '',
    region: ASSESSMENT_REGION,
    country: ASSESSMENT_COUNTRY,
    stakeholderRole: '',
    backgroundCategory: '',
    experienceLevel: '',
    relationshipToArea: '',
    assessmentCompleted: false,
  });

  const [secretUserId, setSecretUserId] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?redirectTo=/assessment');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    async function loadAssessment() {
      if (!token) {
        setIsPageLoading(false);
        return;
      }

      try {
        const response = await fetchMyAssessment(token);

        if (response.assessment) {
          setForm({
            ageRange: response.assessment.ageRange ?? '',
            gender: response.assessment.gender ?? '',
            city: response.assessment.city ?? '',
            region: response.assessment.region ?? ASSESSMENT_REGION,
            country: response.assessment.country ?? ASSESSMENT_COUNTRY,
            stakeholderRole: response.assessment.stakeholderRole ?? '',
            backgroundCategory: response.assessment.backgroundCategory ?? '',
            experienceLevel: response.assessment.experienceLevel ?? '',
            relationshipToArea: response.assessment.relationshipToArea ?? '',
            assessmentCompleted: response.assessment.assessmentCompleted,
          });

          setSecretUserId(response.assessment.secretUserId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assessment');
      } finally {
        setIsPageLoading(false);
      }
    }

    if (user && token) {
      void loadAssessment();
    }
  }, [user, token]);

  function updateField<K extends keyof AssessmentFormState>(
    key: K,
    value: AssessmentFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSave() {
    if (!token) {
      setError('You must be signed in');
      return;
    }

    if (!isCompleteAssessmentForm(form)) {
      setError('Please complete all required assessment fields.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const response = await saveMyAssessment(token, {
        ...form,
        region: ASSESSMENT_REGION,
        country: ASSESSMENT_COUNTRY,
      });
      setSecretUserId(response.assessment.secretUserId);
      setSuccessMessage('Assessment saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assessment');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || isPageLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-slate-600">Loading assessment...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            href={isAdminRole(user.role) ? '/admin' : '/dashboard'}
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            ← Back
          </Link>
        </div>

        <section className="pb-10">
          <div className="mb-8 h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Assessment Profile
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                Build your participation profile
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Complete your assessment profile for specialized consultations,
                analytics grouping, and pseudonymous governance review.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                label="Profile status"
                value={form.assessmentCompleted ? 'Completed' : 'Draft'}
                highlight={form.assessmentCompleted}
              />
              <StatCard
                label="Account type"
                value={isAdminRole(user.role) ? 'Admin' : 'User'}
              />
              <StatCard
                label="Email status"
                value={user.emailVerified ? 'Verified' : 'Not verified'}
                muted={!user.emailVerified}
              />
              <StatCard
                label="Assessment access"
                value="Available"
                muted
              />
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Profile form
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Assessment details
            </h2>

            {secretUserId ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <span className="font-medium text-slate-900">Secret user ID:</span>{' '}
                {secretUserId}
              </div>
            ) : null}

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <SelectField
                label="Age range"
                value={form.ageRange}
                options={AGE_RANGE_OPTIONS}
                onChange={(value) => updateField('ageRange', value as AssessmentFormState['ageRange'])}
              />
              <SelectField
                label="Gender"
                value={form.gender}
                options={GENDER_OPTIONS}
                onChange={(value) => updateField('gender', value as AssessmentFormState['gender'])}
              />
              <SelectField
                label="City"
                value={form.city}
                options={CITY_OPTIONS}
                onChange={(value) => updateField('city', value as AssessmentFormState['city'])}
              />
              <ReadOnlyField
                label="Region"
                value={ASSESSMENT_REGION_LABEL}
              />
              <ReadOnlyField
                label="Country"
                value={ASSESSMENT_COUNTRY_LABEL}
              />
              <SelectField
                label="Stakeholder role"
                value={form.stakeholderRole}
                options={STAKEHOLDER_ROLE_OPTIONS}
                onChange={(value) => updateField('stakeholderRole', value as AssessmentFormState['stakeholderRole'])}
              />
              <SelectField
                label="Background category"
                value={form.backgroundCategory}
                options={BACKGROUND_CATEGORY_OPTIONS}
                onChange={(value) => updateField('backgroundCategory', value as AssessmentFormState['backgroundCategory'])}
              />
              <SelectField
                label="Experience level"
                value={form.experienceLevel}
                options={EXPERIENCE_LEVEL_OPTIONS}
                onChange={(value) => updateField('experienceLevel', value as AssessmentFormState['experienceLevel'])}
              />
              <div className="md:col-span-2">
                <SelectField
                  label="Relationship to area"
                  value={form.relationshipToArea}
                  options={RELATIONSHIP_TO_AREA_OPTIONS}
                  onChange={(value) => updateField('relationshipToArea', value as AssessmentFormState['relationshipToArea'])}
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.assessmentCompleted}
                  onChange={(event) =>
                    updateField('assessmentCompleted', event.target.checked)
                  }
                  className="mt-0.5"
                />
                <span>
                  Mark this assessment as completed. Specialized consultations
                  will require this to be enabled.
                </span>
              </label>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {successMessage}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : 'Save assessment'}
              </button>

              <Link
                href="/consultations"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
              >
                Browse consultations
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Why this matters
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Specialized participation
              </h2>

              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                <p>
                  Your assessment profile supports specialized consultations and
                  helps structure participation in a more relevant way.
                </p>
                <p>
                  Information from this form may also be used for grouped
                  analytics and pseudonymous governance review, depending on the
                  consultation rules.
                </p>
                <p>
                  You can save your profile and update it later whenever your
                  participation context changes.
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Guidance
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Before you complete it
              </h2>

              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                <p>Fill in the fields that best describe your current context.</p>
                <p>
                  Keep your answers consistent so consultation weighting and
                  analytics grouping remain meaningful.
                </p>
                <p>
                  Only mark the assessment as completed when you are satisfied
                  that the information is ready to use.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-5 shadow-sm ring-1 ${
        highlight
          ? 'bg-green-50 ring-green-200'
          : muted
          ? 'bg-slate-100 ring-slate-200'
          : 'bg-white ring-slate-200'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 text-xl font-semibold ${
          highlight ? 'text-green-700' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const inputId = label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <select
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-green-600"
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const inputId = label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        value={value}
        readOnly
        className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm text-slate-700 outline-none"
      />
    </div>
  );
}

