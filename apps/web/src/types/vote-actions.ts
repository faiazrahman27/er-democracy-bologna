import type {
  AnalyticsParticipation,
  PublicAnalyticsBreakdowns,
} from '@/types/analytics';

export type SubmitVotePayload = {
  selectedOptionId: string;
  selfAssessmentScore?: number;
  weightedQuestionAnswers?: Array<{
    questionId: string;
    optionId: string;
  }>;
};

export type SubmitVoteResponse = {
  message: string;
  submission: {
    id: string;
    voteId: string;
    userId: string;
    selectedOptionId: string;
    selfAssessmentScore: number | null;
    weightUsed: string | number;
    calculationType: 'GENERAL' | 'SPECIALIZED' | 'SELF_ASSESSMENT';
    submittedAt: string;
    createdAt: string;
  };
};

export type PublicResultsResponse = {
  message: string;
  results: {
    slug: string;
    title: string;
    visibility: {
      canShowResults: boolean;
      showRawResults: boolean;
      showWeightedResults: boolean;
    };
    results: null | {
      totals: {
        totalRawVotes?: number;
        totalWeightedVotes?: number;
      };
      options: Array<{
        optionId: string;
        optionText: string;
        displayOrder: number;
        rawCount?: number;
        rawPercentage?: number;
        weightedCount?: number;
        weightedPercentage?: number;
      }>;
      participation?: {
        totalParticipants: number;
      };
    };
  };
};

export type PublicAnalyticsResponse = {
  message: string;
  analytics: {
    slug: string;
    title: string;
    visibility: {
      canShowAnalytics: boolean;
    };
    analytics: null | ({
      participation?: AnalyticsParticipation;
    } & PublicAnalyticsBreakdowns);
  };
};
