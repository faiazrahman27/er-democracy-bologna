export type AnalyticsBreakdownItem = {
  label: string;
  count: number;
  percentage: number;
};

export type AnalyticsBreakdowns = {
  stakeholderBreakdown: AnalyticsBreakdownItem[];
  backgroundBreakdown: AnalyticsBreakdownItem[];
  locationBreakdown: AnalyticsBreakdownItem[];
  ageRangeBreakdown: AnalyticsBreakdownItem[];
  genderBreakdown: AnalyticsBreakdownItem[];
  experienceLevelBreakdown: AnalyticsBreakdownItem[];
  yearsOfExperienceBreakdown: AnalyticsBreakdownItem[];
  studyLevelBreakdown: AnalyticsBreakdownItem[];
  relationshipToAreaBreakdown: AnalyticsBreakdownItem[];
};

export type PublicAnalyticsBreakdowns = Partial<AnalyticsBreakdowns>;

export type AnalyticsParticipation = {
  totalParticipants: number;
};
