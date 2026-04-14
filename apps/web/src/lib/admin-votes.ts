import { apiRequest } from '@/lib/api';

export type AdminCreateVotePayload = {
  slug: string;
  title: string;
  summary: string;
  methodologySummary?: string;
  voteType: 'GENERAL' | 'SPECIALIZED' | 'SELF_ASSESSMENT';
  topicCategory: string;
  status:
    | 'DRAFT'
    | 'REVIEW'
    | 'APPROVED'
    | 'PUBLISHED'
    | 'CLOSED'
    | 'ARCHIVED'
    | 'CANCELLED';
  coverImageUrl?: string;
  coverImageAlt?: string;
  startAt: string;
  endAt: string;
  isPublished: boolean;
  options: Array<{
    optionText: string;
    displayOrder: number;
  }>;
  displaySettings: {
    resultVisibilityMode:
      | 'HIDE_ALL'
      | 'SHOW_RAW_ONLY'
      | 'SHOW_WEIGHTED_ONLY'
      | 'SHOW_BOTH';
    showParticipationStats: boolean;
    showStakeholderBreakdown: boolean;
    showBackgroundBreakdown: boolean;
    showLocationBreakdown: boolean;
    showAfterVotingOnly: boolean;
    showOnlyAfterVoteCloses: boolean;
  };
};

export type AdminUpdateVotePayload = {
  title?: string;
  summary?: string;
  methodologySummary?: string;
  status?:
    | 'DRAFT'
    | 'REVIEW'
    | 'APPROVED'
    | 'PUBLISHED'
    | 'CLOSED'
    | 'ARCHIVED'
    | 'CANCELLED';
  coverImageUrl?: string;
  coverImageAlt?: string;
  startAt?: string;
  endAt?: string;
  isPublished?: boolean;
  resultVisibilityMode?:
    | 'HIDE_ALL'
    | 'SHOW_RAW_ONLY'
    | 'SHOW_WEIGHTED_ONLY'
    | 'SHOW_BOTH';
  showParticipationStats?: boolean;
  showStakeholderBreakdown?: boolean;
  showBackgroundBreakdown?: boolean;
  showLocationBreakdown?: boolean;
  showAfterVotingOnly?: boolean;
  showOnlyAfterVoteCloses?: boolean;
};

export type AdminCreateVoteResponse = {
  message: string;
  vote: {
    id: string;
    slug: string;
    title: string;
    voteType: 'GENERAL' | 'SPECIALIZED' | 'SELF_ASSESSMENT';
    status: string;
    isPublished: boolean;
  };
};

export type AdminVoteListItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  methodologySummary: string | null;
  voteType: 'GENERAL' | 'SPECIALIZED' | 'SELF_ASSESSMENT';
  topicCategory: string;
  status: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  startAt: string;
  endAt: string;
  isPublished: boolean;
  publishedAt: string | null;
  lockedAt: string | null;
  createdByAdminId: string;
  createdAt: string;
  updatedAt: string;
  derivedStatus?: 'UPCOMING' | 'ONGOING' | 'PAST' | 'CANCELLED' | 'ARCHIVED';
  submissionCount?: number;
  options?: Array<{
    id: string;
    optionText: string;
    displayOrder: number;
    createdAt?: string;
  }>;
  displaySettings?: {
    id?: string;
    resultVisibilityMode:
      | 'HIDE_ALL'
      | 'SHOW_RAW_ONLY'
      | 'SHOW_WEIGHTED_ONLY'
      | 'SHOW_BOTH';
    showParticipationStats: boolean;
    showStakeholderBreakdown: boolean;
    showBackgroundBreakdown: boolean;
    showLocationBreakdown: boolean;
    showAfterVotingOnly: boolean;
    showOnlyAfterVoteCloses: boolean;
    createdAt?: string;
    updatedAt?: string;
  } | null;
};

export type AdminVotesResponse = {
  message: string;
  votes: AdminVoteListItem[];
};

export type AdminVoteDetailResponse = {
  message: string;
  vote: AdminVoteListItem;
};

export type AdminResultsResponse = {
  message: string;
  results: {
    slug: string;
    title: string;
    voteType: string;
    topicCategory: string;
    totals: {
      totalRawVotes: number;
      totalWeightedVotes: number;
    };
    options: Array<{
      optionId: string;
      optionText: string;
      displayOrder: number;
      rawCount: number;
      rawPercentage: number;
      weightedCount: number;
      weightedPercentage: number;
    }>;
  };
};

export type AdminAnalyticsResponse = {
  message: string;
  analytics: {
    slug: string;
    title: string;
    totals: {
      totalParticipants: number;
      totalWeightedVotes: number;
    };
    breakdowns: {
      stakeholderBreakdown: Array<{
        label: string;
        count: number;
        percentage: number;
      }>;
      backgroundBreakdown: Array<{
        label: string;
        count: number;
        percentage: number;
      }>;
      locationBreakdown: Array<{
        label: string;
        count: number;
        percentage: number;
      }>;
    };
  };
};

export type AdminParticipantsResponse = {
  message: string;
  participants: {
    slug: string;
    title: string;
    participants: Array<{
      submissionId: string;
      secretUserId: string | null;
      selectedOptionId: string;
      selectedOptionText: string;
      weightUsed: string | number;
      calculationType: 'GENERAL' | 'SPECIALIZED' | 'SELF_ASSESSMENT';
      selfAssessmentScore: number | null;
      submittedAt: string;
      hasCompletedAssessment: boolean;
    }>;
  };
};

export async function createAdminVote(
  token: string,
  payload: AdminCreateVotePayload,
) {
  return apiRequest<AdminCreateVoteResponse>('/votes', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function updateAdminVote(
  token: string,
  slug: string,
  payload: AdminUpdateVotePayload,
) {
  return apiRequest<AdminVoteDetailResponse>(`/votes/${slug}`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}

export async function fetchAdminVotes(token: string) {
  return apiRequest<AdminVotesResponse>('/votes/admin', {
    method: 'GET',
    token,
  });
}

export async function fetchAdminVoteBySlug(token: string, slug: string) {
  return apiRequest<AdminVoteDetailResponse>(`/votes/admin/${slug}`, {
    method: 'GET',
    token,
  });
}

export async function fetchAdminResults(token: string, slug: string) {
  return apiRequest<AdminResultsResponse>(`/votes/admin/${slug}/results`, {
    method: 'GET',
    token,
  });
}

export async function fetchAdminAnalytics(token: string, slug: string) {
  return apiRequest<AdminAnalyticsResponse>(`/votes/admin/${slug}/analytics`, {
    method: 'GET',
    token,
  });
}

export async function fetchAdminParticipants(token: string, slug: string) {
  return apiRequest<AdminParticipantsResponse>(
    `/votes/admin/${slug}/participants`,
    {
      method: 'GET',
      token,
    },
  );
}

export async function exportAdminAnalyticsExcel(
  token: string,
  slug: string,
) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }

  const response = await fetch(`${apiBaseUrl}/votes/admin/${slug}/export`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let message = 'Failed to export analytics Excel file';

    try {
      const errorData = (await response.json()) as { message?: string };
      if (errorData?.message) {
        message = errorData.message;
      }
    } catch {
      // ignore JSON parsing failure and keep default message
    }

    throw new Error(message);
  }

  const blob = await response.blob();

  const disposition = response.headers.get('content-disposition');
  const fileNameMatch = disposition?.match(/filename="(.+)"/);
  const fileName = fileNameMatch?.[1] ?? `${slug}-analytics.xlsx`;

  return {
    blob,
    fileName,
  };
}
