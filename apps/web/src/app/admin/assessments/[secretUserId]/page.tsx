"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import {
  fetchAssessmentBySecretUserId,
  type AdminAssessmentSecretInspection,
} from "@/lib/assessments-admin";
import { isAdminRole } from "@/lib/roles";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { formatDateTime, formatEnumLabel } from "@/lib/format";
import { formatWeight } from "@/lib/admin-format";

export default function AdminAssessmentDetailPage() {
  const router = useRouter();
  const params = useParams<{ secretUserId: string }>();
  const { user, token, isLoading } = useAuth();

  const [assessment, setAssessment] =
    useState<AdminAssessmentSecretInspection | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(
        `/login?redirectTo=/admin/assessments/${params.secretUserId}`,
      );
      return;
    }

    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router, params.secretUserId]);

  useEffect(() => {
    async function loadAssessment() {
      if (!token || !user) {
        setPageLoading(false);
        return;
      }

      try {
        const response = await fetchAssessmentBySecretUserId(
          token,
          params.secretUserId,
        );

        setAssessment(response.assessment);
      } catch (err) {
        setPageError(
          err instanceof Error ? err.message : "Failed to load assessment",
        );
      } finally {
        setPageLoading(false);
      }
    }

    if (
      user &&
      token &&
      isAdminRole(user.role) &&
      hasPermission(user.role, PERMISSIONS.ASSESSMENT_SECRET_LOOKUP)
    ) {
      void loadAssessment();
    } else if (user) {
      setPageLoading(false);
    }
  }, [user, token, params.secretUserId]);

  if (isLoading || pageLoading) {
    return (
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="border-y border-slate-200 py-6">
            <p className="text-sm font-medium text-slate-500">
              Loading assessment record...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  if (!hasPermission(user.role, PERMISSIONS.ASSESSMENT_SECRET_LOOKUP)) {
    return (
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="border-y border-red-200 py-4 text-sm font-bold text-red-700">
            You do not have permission to view this assessment record.
          </div>
        </div>
      </main>
    );
  }

  if (pageError) {
    return (
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/admin/consultations"
            className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
          >
            ← Back to consultations
          </Link>

          <div className="mt-8 border-y border-red-200 py-4 text-sm font-bold text-red-700">
            {pageError}
          </div>
        </div>
      </main>
    );
  }

  if (!assessment) {
    return (
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/admin/consultations"
            className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
          >
            ← Back to consultations
          </Link>

          <div className="mt-8 border-y border-slate-200 py-5 text-sm font-bold text-slate-700">
            No assessment record was found for this secret user ID.
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
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
              <div className="min-w-0">
                <Link
                  href="/admin/consultations"
                  className="inline-flex min-h-11 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98]"
                >
                  ← Back to consultations
                </Link>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <StatusBadge label="Pseudonymous record" tone="default" />
                  <StatusBadge
                    label={
                      assessment.assessmentCompleted
                        ? "Assessment completed"
                        : "Assessment not completed"
                    }
                    tone={assessment.assessmentCompleted ? "success" : "warning"}
                  />
                </div>

                <p className="mt-7 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Assessment record
                </p>

                <h1 className="mt-4 max-w-4xl break-all text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                  {assessment.secretUserId}
                </h1>

                <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
                  This page shows assessment details connected to this
                  pseudonymous participant record. It does not show personal
                  identity details such as name or email.
                </p>
              </div>

              <aside className="border-y border-slate-200 py-5 lg:mt-11">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Record timing
                </p>

                <div className="mt-4 grid gap-4">
                  <InfoLine
                    label="Completed at"
                    value={
                      assessment.completedAt
                        ? formatDateTime(assessment.completedAt)
                        : "Not completed"
                    }
                  />
                  <InfoLine
                    label="Created"
                    value={formatDateTime(assessment.createdAt)}
                  />
                  <InfoLine
                    label="Updated"
                    value={formatDateTime(assessment.updatedAt)}
                  />
                </div>
              </aside>
            </div>
          </header>

          <section className="mt-12 border-y border-slate-200 py-8">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatLine
                label="Assessment status"
                value={assessment.assessmentCompleted ? "Completed" : "Draft"}
                positive={assessment.assessmentCompleted}
              />
              <StatLine
                label="Completed at"
                value={
                  assessment.completedAt
                    ? formatDateTime(assessment.completedAt)
                    : "Not completed"
                }
              />
              <StatLine
                label="Created"
                value={formatDateTime(assessment.createdAt)}
              />
              <StatLine
                label="Updated"
                value={formatDateTime(assessment.updatedAt)}
              />
            </div>
          </section>

          <section className="mt-12 border-t border-slate-200 pt-8">
            <SectionHeader
              eyebrow="Profile"
              title="Assessment details"
              description="These fields describe the participant profile used for consultation weighting and analytics."
            />

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <InfoGroup
                title="Assessment status"
                rows={[
                  [
                    "Assessment completed",
                    assessment.assessmentCompleted ? "Yes" : "No",
                  ],
                  [
                    "Completed at",
                    assessment.completedAt
                      ? formatDateTime(assessment.completedAt)
                      : "Not completed",
                  ],
                  ["Created at", formatDateTime(assessment.createdAt)],
                  ["Updated at", formatDateTime(assessment.updatedAt)],
                ]}
              />

              <InfoGroup
                title="Location profile"
                rows={[
                  ["Country", formatAssessmentEnumValue(assessment.country)],
                  ["Region", formatAssessmentEnumValue(assessment.region)],
                  ["City", formatAssessmentEnumValue(assessment.city)],
                ]}
              />

              <InfoGroup
                title="Participant profile"
                rows={[
                  ["Age range", formatAssessmentEnumValue(assessment.ageRange)],
                  ["Gender", formatAssessmentEnumValue(assessment.gender)],
                  [
                    "Stakeholder role",
                    formatAssessmentEnumValue(assessment.stakeholderRole),
                  ],
                  [
                    "Background category",
                    formatAssessmentEnumValue(assessment.backgroundCategory),
                  ],
                  [
                    "Years of experience",
                    formatAssessmentEnumValue(assessment.yearsOfExperience),
                  ],
                  [
                    "Study level",
                    formatAssessmentEnumValue(assessment.studyLevel),
                  ],
                ]}
              />

              <InfoGroup
                title="Experience and relationship"
                rows={[
                  [
                    "Experience level",
                    formatAssessmentEnumValue(assessment.experienceLevel),
                  ],
                  [
                    "Relationship to area",
                    formatAssessmentEnumValue(assessment.relationshipToArea),
                  ],
                ]}
              />
            </div>
          </section>

          <section className="mt-12 border-t border-slate-200 pt-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <PlainPanel
                eyebrow="Review context"
                title="How to use this page"
                tone="default"
              >
                <p>
                  Use this record to review how a pseudonymous participant’s
                  profile and weighted answers affected specialized
                  consultation results.
                </p>
                <p>
                  The information should be read together with the consultation
                  result and participant submission records.
                </p>
                <p>
                  Keep review focused on participation patterns, weights, and
                  assessment completeness.
                </p>
              </PlainPanel>

              <PlainPanel
                eyebrow="Privacy note"
                title="Pseudonymous data only"
                tone="warning"
              >
                <p>
                  Personal identity details such as full name and email are not
                  shown on this page.
                </p>
                <p>
                  Do not use this page to identify, infer, or disclose a private
                  identity.
                </p>
                <p>
                  Access should remain limited to authorized review of
                  consultation participation and assessment records.
                </p>
              </PlainPanel>
            </div>
          </section>

          <section className="mt-12 border-t border-slate-200 pt-8">
            <SectionHeader
              eyebrow="Specialized vote review"
              title="Weighted-question answers"
              description="These records show how selected answers adjusted final specialized vote weights for this pseudonymous participant."
            />

            {assessment.specializedVoteSubmissions.length === 0 ? (
              <div className="mt-8 border-y border-slate-200 py-5 text-sm font-bold text-slate-600">
                No specialized vote submissions with weighted questions were
                found for this secret user ID.
              </div>
            ) : (
              <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
                {assessment.specializedVoteSubmissions.map((submission) => (
                  <article
                    key={submission.submissionId}
                    className="py-6 transition duration-200 hover:bg-slate-50/70 active:bg-slate-50"
                  >
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-start">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                          Specialized submission
                        </p>

                        <h3 className="mt-3 max-w-4xl break-words text-2xl font-black tracking-[-0.045em] text-slate-950 md:text-3xl">
                          <Link
                            href={`/admin/consultations/${submission.vote.slug}`}
                            className="transition hover:text-green-700"
                          >
                            {submission.vote.title}
                          </Link>
                        </h3>

                        <p className="mt-3 text-sm font-medium text-slate-600">
                          Submitted {formatDateTime(submission.submittedAt)}
                        </p>

                        <div className="mt-5 border-y border-slate-200 py-4">
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                            Selected consultation option
                          </p>
                          <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-900">
                            {submission.selectedOptionText}
                          </p>
                        </div>
                      </div>

                      <div className="border-y border-slate-200 py-5">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                          Weight summary
                        </p>

                        <div className="mt-4 grid gap-4">
                          <InfoLine
                            label="Final weight"
                            value={formatWeight(submission.weightUsed)}
                          />

                          {submission.specializedBaseWeightUsed !== null ? (
                            <InfoLine
                              label="Base weight"
                              value={formatWeight(
                                submission.specializedBaseWeightUsed,
                              )}
                            />
                          ) : null}

                          {submission.specializedQuestionModifierTotal !== null ? (
                            <InfoLine
                              label="Modifier total"
                              value={formatSignedWeight(
                                submission.specializedQuestionModifierTotal,
                              )}
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                      {submission.weightedQuestionAnswers.map((answer) => (
                        <div
                          key={`${submission.submissionId}-${answer.questionId}`}
                          className="py-5"
                        >
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                            Question {answer.questionDisplayOrder}
                          </p>

                          <p className="mt-2 max-w-4xl break-words text-sm font-bold leading-7 text-slate-900">
                            {answer.questionPrompt}
                          </p>

                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <InfoLine
                              label="Selected answer"
                              value={answer.selectedOptionText}
                            />
                            <InfoLine
                              label="Modifier"
                              value={formatSignedWeight(answer.modifierUsed)}
                            />
                          </div>
                        </div>
                      ))}
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

function formatAssessmentEnumValue(value: string | number | null) {
  if (value === null || value === "") {
    return "Not provided";
  }

  return formatEnumLabel(value);
}

function formatSignedWeight(value: string | number) {
  const numeric = typeof value === "number" ? value : Number(value);

  if (Number.isNaN(numeric)) {
    return String(value);
  }

  return `${numeric >= 0 ? "+" : ""}${numeric.toFixed(4)}`;
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950 md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-t border-slate-200 pt-3 first:border-t-0 first:pt-0">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 min-w-0 break-words text-sm font-bold leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatLine({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="border-y border-slate-200 py-4">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 break-words text-2xl font-black tracking-[-0.045em] ${
          positive ? "text-green-700" : "text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoGroup({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <div className="min-w-0 border-y border-slate-200 py-6">
      <h3 className="text-xl font-black tracking-[-0.04em] text-slate-950">
        {title}
      </h3>

      <div className="mt-5 grid gap-4">
        {rows.map(([label, value]) => (
          <InfoLine key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

function PlainPanel({
  eyebrow,
  title,
  tone,
  children,
}: {
  eyebrow: string;
  title: string;
  tone: "default" | "warning";
  children: ReactNode;
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200 text-amber-900"
      : "border-slate-200 text-slate-900";

  return (
    <div className={`border-y py-6 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">
        {eyebrow}
      </p>

      <h3 className="mt-3 text-2xl font-black tracking-[-0.045em]">
        {title}
      </h3>

      <div className="mt-5 grid gap-4 text-sm leading-7 text-slate-600">
        {children}
      </div>
    </div>
  );
}

function StatusBadge({
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
