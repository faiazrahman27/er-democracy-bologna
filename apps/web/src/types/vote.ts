export type PublicVoteItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  voteType: 'GENERAL' | 'SPECIALIZED' | 'SELF_ASSESSMENT';
  topicCategory: string;
  status: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  startAt: string;
  endAt: string;
  createdAt: string;
  updatedAt: string;
  derivedStatus: 'UPCOMING' | 'ONGOING' | 'PAST' | 'CANCELLED' | 'ARCHIVED';
};

export type PublicVotesResponse = {
  message: string;
  votes: PublicVoteItem[];
};

export type PublicVoteDetail = {
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
  createdAt: string;
  updatedAt: string;
  derivedStatus: 'UPCOMING' | 'ONGOING' | 'PAST' | 'CANCELLED' | 'ARCHIVED';
  options: Array<{
    id: string;
    optionText: string;
    displayOrder: number;
  }>;
  displaySettings: {
    resultVisibilityMode: 'HIDE_ALL' | 'SHOW_RAW_ONLY' | 'SHOW_WEIGHTED_ONLY' | 'SHOW_BOTH';
    showParticipationStats: boolean;
    showStakeholderBreakdown: boolean;
    showBackgroundBreakdown: boolean;
    showLocationBreakdown: boolean;
    showAfterVotingOnly: boolean;
    showOnlyAfterVoteCloses: boolean;
  } | null;
};

export type PublicVoteDetailResponse = {
  message: string;
  vote: PublicVoteDetail;
};
