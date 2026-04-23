import { apiRequest } from '@/lib/api';
import type { Assessment } from '@/types/assessment';

export type AdminAssessmentSecretInspection = Omit<Assessment, 'userId'> & {
  specializedVoteSubmissions: Array<{
    submissionId: string;
    submittedAt: string;
    vote: {
      id: string;
      slug: string;
      title: string;
    };
    selectedOptionId: string;
    selectedOptionText: string;
    weightUsed: string | number;
    specializedBaseWeightUsed: string | number | null;
    specializedQuestionModifierTotal: string | number | null;
    weightedQuestionAnswers: Array<{
      questionId: string;
      questionPrompt: string;
      questionDisplayOrder: number;
      selectedOptionId: string;
      selectedOptionText: string;
      optionDisplayOrder: number;
      modifierUsed: string | number;
    }>;
  }>;
};

export type AdminAssessmentBySecretResponse = {
  message: string;
  assessment: AdminAssessmentSecretInspection | null;
};

export async function fetchAssessmentBySecretUserId(
  token: string,
  secretUserId: string,
) {
  return apiRequest<AdminAssessmentBySecretResponse>(
    `/assessments/secret/${encodeURIComponent(secretUserId)}`,
    {
      method: 'GET',
      token,
    },
  );
}
