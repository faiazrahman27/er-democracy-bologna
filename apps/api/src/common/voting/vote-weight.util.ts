type AssessmentForWeighting = {
  stakeholderRole: string | null;
  backgroundCategory: string | null;
  experienceLevel: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  assessmentCompleted: boolean;
};

type CalculateVoteWeightInput = {
  voteType: 'GENERAL' | 'SPECIALIZED' | 'SELF_ASSESSMENT';
  topicCategory: string;
  assessment?: AssessmentForWeighting | null;
  selfAssessmentScore?: number | null;
};

type WeightResult = {
  weightUsed: number;
  calculationType: 'GENERAL' | 'SPECIALIZED' | 'SELF_ASSESSMENT';
};

const MIN_SELF_WEIGHT = 0.8;
const MAX_SELF_WEIGHT = 1.2;
const MIN_SPECIALIZED_WEIGHT = 0.75;
const MAX_SPECIALIZED_WEIGHT = 1.75;

function normalizeValue(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeSelfAssessmentWeight(score: number): number {
  const normalized = MIN_SELF_WEIGHT + ((score - 1) / 9) * (MAX_SELF_WEIGHT - MIN_SELF_WEIGHT);
  return Number(normalized.toFixed(4));
}

function getSpecializedWeight(topicCategory: string, assessment: AssessmentForWeighting): number {
  const topic = normalizeValue(topicCategory);
  const stakeholderRole = normalizeValue(assessment.stakeholderRole);
  const backgroundCategory = normalizeValue(assessment.backgroundCategory);
  const experienceLevel = normalizeValue(assessment.experienceLevel);
  const city = normalizeValue(assessment.city);
  const region = normalizeValue(assessment.region);
  const country = normalizeValue(assessment.country);

  let weight = 1;

  if (topic === 'student_life') {
    if (stakeholderRole.includes('student')) weight += 0.35;
    if (
      backgroundCategory.includes('education') ||
      backgroundCategory.includes('business informatics') ||
      backgroundCategory.includes('public policy')
    ) {
      weight += 0.2;
    }
    if (
      experienceLevel.includes('moderate') ||
      experienceLevel.includes('high') ||
      experienceLevel.includes('advanced')
    ) {
      weight += 0.1;
    }
  } else if (topic === 'local_economy') {
    if (
      stakeholderRole.includes('business') ||
      stakeholderRole.includes('worker') ||
      stakeholderRole.includes('public sector')
    ) {
      weight += 0.3;
    }
    if (
      backgroundCategory.includes('business') ||
      backgroundCategory.includes('finance') ||
      backgroundCategory.includes('administration')
    ) {
      weight += 0.2;
    }
    if (
      experienceLevel.includes('moderate') ||
      experienceLevel.includes('high') ||
      experienceLevel.includes('advanced')
    ) {
      weight += 0.1;
    }
  } else if (topic === 'urban_regeneration') {
    if (
      stakeholderRole.includes('resident') ||
      stakeholderRole.includes('public sector') ||
      stakeholderRole.includes('researcher')
    ) {
      weight += 0.3;
    }
    if (
      backgroundCategory.includes('urban') ||
      backgroundCategory.includes('planning') ||
      backgroundCategory.includes('architecture') ||
      backgroundCategory.includes('construction') ||
      backgroundCategory.includes('public policy')
    ) {
      weight += 0.2;
    }
    if (
      experienceLevel.includes('moderate') ||
      experienceLevel.includes('high') ||
      experienceLevel.includes('advanced')
    ) {
      weight += 0.1;
    }
  }

  if (
    city.includes('bologna') ||
    region.includes('emilia-romagna') ||
    country.includes('italy')
  ) {
    weight += 0.05;
  }

  return Number(clamp(weight, MIN_SPECIALIZED_WEIGHT, MAX_SPECIALIZED_WEIGHT).toFixed(4));
}

export function calculateVoteWeight(input: CalculateVoteWeightInput): WeightResult {
  if (input.voteType === 'GENERAL') {
    return {
      weightUsed: 1,
      calculationType: 'GENERAL',
    };
  }

  if (input.voteType === 'SELF_ASSESSMENT') {
    if (!input.selfAssessmentScore || input.selfAssessmentScore < 1 || input.selfAssessmentScore > 10) {
      throw new Error('A valid selfAssessmentScore between 1 and 10 is required');
    }

    return {
      weightUsed: normalizeSelfAssessmentWeight(input.selfAssessmentScore),
      calculationType: 'SELF_ASSESSMENT',
    };
  }

  if (!input.assessment || !input.assessment.assessmentCompleted) {
    throw new Error('A completed assessment is required for specialized votes');
  }

  return {
    weightUsed: getSpecializedWeight(input.topicCategory, input.assessment),
    calculationType: 'SPECIALIZED',
  };
}
