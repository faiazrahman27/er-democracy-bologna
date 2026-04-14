import { apiRequest } from '@/lib/api';

export type AdminAssessmentBySecretResponse = {
  message: string;
  assessment: {
    id: string;
    secretUserId: string;
    ageRange: string | null;
    gender: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    stakeholderRole: string | null;
    backgroundCategory: string | null;
    experienceLevel: string | null;
    relationshipToArea: string | null;
    assessmentCompleted: boolean;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
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
