import { apiRequest } from '@/lib/api';
import type {
  GetMyAssessmentResponse,
  SaveAssessmentPayload,
  SaveAssessmentResponse,
} from '@/types/assessment';

export async function fetchMyAssessment(token: string) {
  return apiRequest<GetMyAssessmentResponse>('/assessments/me', {
    method: 'GET',
    token,
  });
}

export async function saveMyAssessment(
  token: string,
  payload: SaveAssessmentPayload,
) {
  return apiRequest<SaveAssessmentResponse>('/assessments/me', {
    method: 'PUT',
    token,
    body: payload,
  });
}
