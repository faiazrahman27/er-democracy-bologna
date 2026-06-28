"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { fetchMyAssessment, saveMyAssessment } from "@/lib/assessments";
import { isAdminRole } from "@/lib/roles";
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
  MAX_YEARS_OF_EXPERIENCE,
  RELATIONSHIP_TO_AREA_OPTIONS,
  STAKEHOLDER_ROLE_OPTIONS,
  STUDY_LEVEL_OPTIONS,
  type SaveAssessmentPayload,
} from "@/types/assessment";

type AssessmentFormState = {
  ageRange: SaveAssessmentPayload["ageRange"] | "";
  gender: SaveAssessmentPayload["gender"] | "";
  city: SaveAssessmentPayload["city"] | "";
  region: SaveAssessmentPayload["region"];
  country: SaveAssessmentPayload["country"];
  stakeholderRole: SaveAssessmentPayload["stakeholderRole"] | "";
  backgroundCategory: SaveAssessmentPayload["backgroundCategory"] | "";
  experienceLevel: SaveAssessmentPayload["experienceLevel"] | "";
  yearsOfExperience: SaveAssessmentPayload["yearsOfExperience"] | "";
  studyLevel: SaveAssessmentPayload["studyLevel"] | "";
  relationshipToArea: SaveAssessmentPayload["relationshipToArea"] | "";
  assessmentCompleted: boolean;
};

function isCompleteAssessmentForm(
  form: AssessmentFormState,
): form is SaveAssessmentPayload {
  return (
    form.ageRange !== "" &&
    form.gender !== "" &&
    form.city !== "" &&
    form.stakeholderRole !== "" &&
    form.backgroundCategory !== "" &&
    form.experienceLevel !== "" &&
    form.yearsOfExperience !== "" &&
    Number.isInteger(form.yearsOfExperience) &&
    form.yearsOfExperience >= 0 &&
    form.yearsOfExperience <= MAX_YEARS_OF_EXPERIENCE &&
    form.studyLevel !== "" &&
    form.relationshipToArea !== ""
  );
}

export default function AssessmentPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [form, setForm] = useState<AssessmentFormState>({
    ageRange: "",
    gender: "",
    city: "",
    region: ASSESSMENT_REGION,
    country: ASSESSMENT_COUNTRY,
    stakeholderRole: "",
    backgroundCategory: "",
    experienceLevel: "",
    yearsOfExperience: "",
    studyLevel: "",
    relationshipToArea: "",
    assessmentCompleted: false,
  });

  const [secretUserId, setSecretUserId] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?redirectTo=/assessment");
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
            ageRange: response.assessment.ageRange ?? "",
            gender: response.assessment.gender ?? "",
            city: response.assessment.city ?? "",
            region: response.assessment.region ?? ASSESSMENT_REGION,
            country: response.assessment.country ?? ASSESSMENT_COUNTRY,
            stakeholderRole: response.assessment.stakeholderRole ?? "",
            backgroundCategory: response.assessment.backgroundCategory ?? "",
            experienceLevel: response.assessment.experienceLevel ?? "",
            yearsOfExperience: response.assessment.yearsOfExperience ?? "",
            studyLevel: response.assessment.studyLevel ?? "",
            relationshipToArea: response.assessment.relationshipToArea ?? "",
            assessmentCompleted: response.assessment.assessmentCompleted,
          });

          setSecretUserId(response.assessment.secretUserId);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load assessment",
        );
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
      setError("You must be signed in");
      return;
    }

    if (!isCompleteAssessmentForm(form)) {
      setError("Please complete all required assessment fields.");
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
      setSuccessMessage("Assessment saved successfully");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save assessment",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || isPageLoading) {
    return (
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="border-y border-slate-200 py-6">
            <p className="text-sm font-medium text-slate-500">
              Loading assessment...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const completedFieldCount = [
    form.ageRange,
    form.gender,
    form.city,
    form.stakeholderRole,
    form.backgroundCategory,
    form.experienceLevel,
    form.yearsOfExperience,
    form.studyLevel,
    form.relationshipToArea,
  ].filter((value) => value !== "").length;

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <section className="px-5 py-10 sm:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <header className="mt-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
              <div className="min-w-0">
                <Link
                  href={isAdminRole(user.role) ? "/admin" : "/dashboard"}
                  className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                >
                  ← Back
                </Link>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={form.assessmentCompleted ? "Completed" : "Draft"}
                    tone={form.assessmentCompleted ? "success" : "warning"}
                  />
                  <StatusBadge
                    label={user.emailVerified ? "Email verified" : "Email not verified"}
                    tone={user.emailVerified ? "success" : "muted"}
                  />
                </div>

                <p className="mt-7 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Assessment profile
                </p>

                <h1 className="mt-4 max-w-4xl break-words text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                  Build your participation profile
                </h1>

                <p className="mt-6 max-w-3xl break-words text-base leading-8 text-slate-600">
                  Complete this profile so specialized consultations can use the
                  right participation context for your account.
                </p>
              </div>

              <aside className="border-y border-slate-200 py-5 lg:mt-11">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Profile status
                </p>

                <div className="mt-4 grid gap-4">
                  <StatLine
                    label="Fields completed"
                    value={`${completedFieldCount}/9`}
                    tone={completedFieldCount === 9 ? "success" : "warning"}
                  />
                  <StatLine
                    label="Account type"
                    value={isAdminRole(user.role) ? "Admin" : "User"}
                  />
                  <StatLine
                    label="Assessment"
                    value={form.assessmentCompleted ? "Completed" : "Draft"}
                    tone={form.assessmentCompleted ? "success" : "muted"}
                  />
                </div>
              </aside>
            </div>
          </header>

          <section className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
            <div className="min-w-0 border-y border-slate-200 py-8">
              <div className="max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Profile form
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950 md:text-4xl">
                  Assessment details
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Fill in the fields that best describe your current
                  participation context.
                </p>
              </div>

              {secretUserId ? (
                <div className="mt-6 border-y border-slate-200 py-4 text-sm text-slate-700">
                  <span className="font-black text-slate-900">
                    Profile reference:
                  </span>{" "}
                  <span className="break-all">{secretUserId}</span>
                </div>
              ) : null}

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <SelectField
                  label="Age range"
                  value={form.ageRange}
                  options={AGE_RANGE_OPTIONS}
                  onChange={(value) =>
                    updateField(
                      "ageRange",
                      value as AssessmentFormState["ageRange"],
                    )
                  }
                />

                <SelectField
                  label="Gender"
                  value={form.gender}
                  options={GENDER_OPTIONS}
                  onChange={(value) =>
                    updateField("gender", value as AssessmentFormState["gender"])
                  }
                />

                <SelectField
                  label="City"
                  value={form.city}
                  options={CITY_OPTIONS}
                  onChange={(value) =>
                    updateField("city", value as AssessmentFormState["city"])
                  }
                />

                <ReadOnlyField label="Region" value={ASSESSMENT_REGION_LABEL} />

                <ReadOnlyField label="Country" value={ASSESSMENT_COUNTRY_LABEL} />

                <SelectField
                  label="Stakeholder role"
                  value={form.stakeholderRole}
                  options={STAKEHOLDER_ROLE_OPTIONS}
                  onChange={(value) =>
                    updateField(
                      "stakeholderRole",
                      value as AssessmentFormState["stakeholderRole"],
                    )
                  }
                />

                <SelectField
                  label="Background category"
                  value={form.backgroundCategory}
                  options={BACKGROUND_CATEGORY_OPTIONS}
                  onChange={(value) =>
                    updateField(
                      "backgroundCategory",
                      value as AssessmentFormState["backgroundCategory"],
                    )
                  }
                />

                <SelectField
                  label="Experience level"
                  value={form.experienceLevel}
                  options={EXPERIENCE_LEVEL_OPTIONS}
                  onChange={(value) =>
                    updateField(
                      "experienceLevel",
                      value as AssessmentFormState["experienceLevel"],
                    )
                  }
                />

                <NumberField
                  label="Years of experience"
                  value={form.yearsOfExperience}
                  min={0}
                  max={MAX_YEARS_OF_EXPERIENCE}
                  onChange={(value) => updateField("yearsOfExperience", value)}
                />

                <SelectField
                  label="Study level"
                  value={form.studyLevel}
                  options={STUDY_LEVEL_OPTIONS}
                  onChange={(value) =>
                    updateField(
                      "studyLevel",
                      value as AssessmentFormState["studyLevel"],
                    )
                  }
                />

                <div className="md:col-span-2">
                  <SelectField
                    label="Relationship to area"
                    value={form.relationshipToArea}
                    options={RELATIONSHIP_TO_AREA_OPTIONS}
                    onChange={(value) =>
                      updateField(
                        "relationshipToArea",
                        value as AssessmentFormState["relationshipToArea"],
                      )
                    }
                  />
                </div>
              </div>

              <div className="mt-7 border-y border-slate-200 py-5">
                <label className="flex min-w-0 items-start gap-3 text-sm leading-7 text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.assessmentCompleted}
                    onChange={(event) =>
                      updateField("assessmentCompleted", event.target.checked)
                    }
                    className="mt-1 shrink-0"
                  />
                  <span className="min-w-0 break-words">
                    Mark this profile as completed. Some specialized
                    consultations may require a completed profile before
                    participation.
                  </span>
                </label>
              </div>

              {error ? <MessageBlock tone="danger">{error}</MessageBlock> : null}

              {successMessage ? (
                <MessageBlock tone="success">{successMessage}</MessageBlock>
              ) : null}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex min-h-12 w-full items-center justify-center border border-green-500 bg-white px-5 text-sm font-black text-green-700 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-green-50 hover:shadow-md active:-translate-y-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isSaving ? "Saving..." : "Save assessment"}
                </button>

                <Link
                  href="/consultations"
                  className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98] sm:w-auto"
                >
                  Browse consultations
                </Link>
              </div>
            </div>

            <aside className="grid min-w-0 gap-8">
              <SidePanel
                eyebrow="Why it matters"
                title="Specialized participation"
              >
                <p>
                  Your profile helps match your participation context to
                  consultations that use specialized questions.
                </p>
                <p>
                  You can save now and update the profile later when your
                  situation changes.
                </p>
              </SidePanel>

              <SidePanel eyebrow="Before saving" title="Quick check">
                <div className="grid gap-3">
                  <CheckLine label="Age range" complete={form.ageRange !== ""} />
                  <CheckLine label="Gender" complete={form.gender !== ""} />
                  <CheckLine label="City" complete={form.city !== ""} />
                  <CheckLine
                    label="Stakeholder role"
                    complete={form.stakeholderRole !== ""}
                  />
                  <CheckLine
                    label="Background"
                    complete={form.backgroundCategory !== ""}
                  />
                  <CheckLine
                    label="Experience"
                    complete={form.experienceLevel !== ""}
                  />
                  <CheckLine
                    label="Years"
                    complete={form.yearsOfExperience !== ""}
                  />
                  <CheckLine label="Study level" complete={form.studyLevel !== ""} />
                  <CheckLine
                    label="Relationship"
                    complete={form.relationshipToArea !== ""}
                  />
                </div>
              </SidePanel>
            </aside>
          </section>
        </div>
      </section>
    </main>
  );
}

function StatLine({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "success" | "warning" | "muted" | "default";
}) {
  const valueClass =
    tone === "success"
      ? "text-green-700"
      : tone === "warning"
        ? "text-amber-700"
        : tone === "muted"
          ? "text-slate-500"
          : "text-slate-950";

  return (
    <div className="min-w-0 border-t border-slate-200 pt-3 first:border-t-0 first:pt-0">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 break-words text-2xl font-black tracking-[-0.045em] ${valueClass}`}
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
  const inputId = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="min-w-0">
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-bold text-slate-800"
      >
        {label}
      </label>
      <select
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition hover:border-slate-400 focus:border-slate-900"
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

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number | "";
  min: number;
  max: number;
  onChange: (value: number | "") => void;
}) {
  const inputId = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="min-w-0">
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-bold text-slate-800"
      >
        {label}
      </label>
      <input
        id={inputId}
        type="number"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) =>
          onChange(event.target.value === "" ? "" : Number(event.target.value))
        }
        className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition hover:border-slate-400 focus:border-slate-900"
      />
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Enter a whole number between {min} and {max}.
      </p>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  const inputId = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="min-w-0">
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-bold text-slate-800"
      >
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        value={value}
        readOnly
        className="w-full border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none"
      />
    </div>
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
    tone === "success" ? "border-green-200 text-green-700" : "border-red-200 text-red-700";

  return (
    <div className={`mt-6 border-y py-4 text-sm font-bold ${toneClass}`}>
      {children}
    </div>
  );
}

function SidePanel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-y border-slate-200 py-6">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-black tracking-[-0.045em] text-slate-950">
        {title}
      </h2>
      <div className="mt-5 grid gap-4 text-sm leading-7 text-slate-600">
        {children}
      </div>
    </section>
  );
}

function CheckLine({ label, complete }: { label: string; complete: boolean }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 border border-slate-200 bg-white px-4 py-3">
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

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "muted" | "default";
}) {
  const toneClass =
    tone === "success"
      ? "border-green-200 text-green-700"
      : tone === "warning"
        ? "border-amber-200 text-amber-700"
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
