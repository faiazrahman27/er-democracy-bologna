"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

  const [assessment, setAssessment] = useState<AdminAssessmentSecretInspection | null>(
    null,
  );
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
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-slate-600">Loading assessment record...</p>
        </div>
      </main>
    );
  }

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  if (!hasPermission(user.role, PERMISSIONS.ASSESSMENT_SECRET_LOOKUP)) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            You do not have permission to inspect pseudonymous assessment data.
          </div>
        </div>
      </main>
    );
  }

  if (pageError) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/admin/consultations"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            ← Back to consultation management
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        </div>
      </main>
    );
  }

  if (!assessment) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/admin/consultations"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            ← Back to consultation management
          </Link>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 shadow-sm">
            No assessment record was found for this secret user ID.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            href="/admin/consultations"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            ← Back to consultation management
          </Link>
        </div>

        <section className="pb-10">
          <div className="mb-8 h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  Pseudonymous assessment
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                  Secret lookup
                </span>
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
                {assessment.secretUserId}
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                This page contains only pseudonymous assessment data for
                governance review and analysis. Personal identity details such
                as full name and email are not shown here.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                label="Assessment status"
                value={assessment.assessmentCompleted ? "Completed" : "Draft"}
                highlight={assessment.assessmentCompleted}
              />
              <StatCard
                label="Completed at"
                value={
                  assessment.completedAt
                    ? formatDateTime(assessment.completedAt)
                    : "Not completed"
                }
                muted={!assessment.completedAt}
              />
              <StatCard
                label="Created"
                value={formatDateTime(assessment.createdAt)}
              />
              <StatCard
                label="Updated"
                value={formatDateTime(assessment.updatedAt)}
              />
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-10">
          <div className="grid gap-6 md:grid-cols-2">
            <InfoCard
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

            <InfoCard
              title="Location profile"
              rows={[
                ["Country", formatAssessmentEnumValue(assessment.country)],
                ["Region", formatAssessmentEnumValue(assessment.region)],
                ["City", formatAssessmentEnumValue(assessment.city)],
              ]}
            />
          </div>
        </section>

        <section className="border-t border-slate-200 pt-10">
          <div className="grid gap-6 md:grid-cols-2">
            <InfoCard
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

            <InfoCard
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

        <section className="border-t border-slate-200 pt-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Review context
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Administrative use
              </h2>

              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                <p>
                  This view is intended for lawful governance review, analytics
                  interpretation, and audit-oriented administrative workflows.
                </p>
                <p>
                  The record is pseudonymous and should be interpreted within
                  the limits of your administrative role and permissions.
                </p>
                <p>
                  Use this page carefully when reviewing consultation
                  participation patterns or profile-based governance logic.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-800">
                Privacy boundary
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-amber-900">
                Pseudonymous data only
              </h2>

              <div className="mt-5 space-y-4 text-sm leading-7 text-amber-800">
                <p>
                  Personal identity details such as full name and email are not
                  shown on this page.
                </p>
                <p>
                  Do not use this assessment view to infer, reconstruct, or
                  disclose private identity.
                </p>
                <p>
                  Access should remain limited to lawful review, platform
                  governance, and authorized audit workflows.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-10">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Specialized vote inspection
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Stored weighted-question answers
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              These records show how weighted-question answers adjusted final
              specialized vote weights for this pseudonymous participant.
            </p>
          </div>

          {assessment.specializedVoteSubmissions.length === 0 ? (
            <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
              No specialized vote submissions with weighted questions were found
              for this secret user ID.
            </div>
          ) : (
            <div className="space-y-4">
              {assessment.specializedVoteSubmissions.map((submission) => (
                <div
                  key={submission.submissionId}
                  className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Specialized submission
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                        <Link
                          href={`/admin/consultations/${submission.vote.slug}`}
                          className="hover:text-slate-700"
                        >
                          {submission.vote.title}
                        </Link>
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        Submitted {formatDateTime(submission.submittedAt)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200">
                      <p>
                        <span className="font-medium text-slate-900">
                          Final weight:
                        </span>{" "}
                        {formatWeight(submission.weightUsed)}
                      </p>
                      {submission.specializedBaseWeightUsed !== null ? (
                        <p className="mt-1">
                          <span className="font-medium text-slate-900">
                            Base weight:
                          </span>{" "}
                          {formatWeight(submission.specializedBaseWeightUsed)}
                        </p>
                      ) : null}
                      {submission.specializedQuestionModifierTotal !== null ? (
                        <p className="mt-1">
                          <span className="font-medium text-slate-900">
                            Modifier total:
                          </span>{" "}
                          {formatSignedWeight(
                            submission.specializedQuestionModifierTotal,
                          )}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium text-slate-900">
                        Selected consultation option:
                      </span>{" "}
                      {submission.selectedOptionText}
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {submission.weightedQuestionAnswers.map((answer) => (
                      <div
                        key={`${submission.submissionId}-${answer.questionId}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Question {answer.questionDisplayOrder}
                        </p>
                        <p className="mt-2 text-sm font-medium leading-7 text-slate-900">
                          {answer.questionPrompt}
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          <span className="font-medium text-slate-900">
                            Selected answer:
                          </span>{" "}
                          {answer.selectedOptionText}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          <span className="font-medium text-slate-900">
                            Modifier:
                          </span>{" "}
                          {formatSignedWeight(answer.modifierUsed)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
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
          ? "bg-green-50 ring-green-200"
          : muted
            ? "bg-slate-100 ring-slate-200"
            : "bg-white ring-slate-200"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 text-base font-semibold ${
          highlight ? "text-green-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>

      <div className="mt-4 space-y-3 text-sm text-slate-700">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
