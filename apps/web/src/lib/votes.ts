import { apiRequest } from '@/lib/api';
import type {
  PublicVoteDetailResponse,
  PublicVotesResponse,
} from '@/types/vote';
import type {
  PublicAnalyticsResponse,
  PublicResultsResponse,
  SubmitVotePayload,
  SubmitVoteResponse,
} from '@/types/vote-actions';

export async function fetchPublicVotes() {
  return apiRequest<PublicVotesResponse>('/votes/public', {
    method: 'GET',
  });
}

export async function fetchPublicVoteBySlug(slug: string) {
  return apiRequest<PublicVoteDetailResponse>(`/votes/public/${slug}`, {
    method: 'GET',
  });
}

export async function submitVote(
  slug: string,
  token: string,
  payload: SubmitVotePayload,
) {
  return apiRequest<SubmitVoteResponse>(`/votes/${slug}/submit`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function fetchVisibleResults(slug: string, token?: string | null) {
  if (token) {
    return apiRequest<PublicResultsResponse>(`/votes/my/${slug}/results`, {
      method: 'GET',
      token,
    });
  }

  return apiRequest<PublicResultsResponse>(`/votes/public/${slug}/results`, {
    method: 'GET',
  });
}

export async function fetchVisibleAnalytics(
  slug: string,
  token?: string | null,
) {
  if (token) {
    return apiRequest<PublicAnalyticsResponse>(`/votes/my/${slug}/analytics`, {
      method: 'GET',
      token,
    });
  }

  return apiRequest<PublicAnalyticsResponse>(`/votes/public/${slug}/analytics`, {
    method: 'GET',
  });
}
