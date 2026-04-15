import { apiRequest } from '@/lib/api';
import type { Assessment } from '@/types/assessment';

export type AdminAssessmentBySecretResponse = {
  message: string;
  assessment: Omit<Assessment, 'userId'> | null;
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
