export type Assessment = {
  id: string;
  userId: string;
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
};

export type GetMyAssessmentResponse = {
  message: string;
  assessment: Assessment | null;
};

export type SaveAssessmentPayload = {
  ageRange?: string;
  gender?: string;
  city?: string;
  region?: string;
  country?: string;
  stakeholderRole?: string;
  backgroundCategory?: string;
  experienceLevel?: string;
  relationshipToArea?: string;
  assessmentCompleted: boolean;
};

export type SaveAssessmentResponse = {
  message: string;
  assessment: Assessment;
};
