type AssessmentForWeighting = {
  stakeholderRole: string | null;
  backgroundCategory: string | null;
  experienceLevel: string | null;
  relationshipToArea: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  assessmentCompleted: boolean;
};

type ConsultationTopicContext = {
  topicCategory: string;
  title?: string | null;
  summary?: string | null;
  methodologySummary?: string | null;
};

type CalculateVoteWeightInput = {
  voteType: 'GENERAL' | 'SPECIALIZED' | 'SELF_ASSESSMENT';
  topicCategory: string;
  title?: string | null;
  summary?: string | null;
  methodologySummary?: string | null;
  assessment?: AssessmentForWeighting | null;
  selfAssessmentScore?: number | null;
};

type WeightResult = {
  weightUsed: number;
  calculationType: 'GENERAL' | 'SPECIALIZED' | 'SELF_ASSESSMENT';
};

const MIN_SPECIALIZED_WEIGHT = 0.75;
const MAX_SPECIALIZED_WEIGHT = 1.75;
const STAKEHOLDER_TOPIC_MATCH_BONUS_PER_KEYWORD = 0.12;
const MAX_STAKEHOLDER_TOPIC_MATCH_BONUS = 0.35;
const BACKGROUND_TOPIC_MATCH_BONUS_PER_KEYWORD = 0.1;
const MAX_BACKGROUND_TOPIC_MATCH_BONUS = 0.25;
const RELATIONSHIP_TOPIC_MATCH_BONUS_PER_KEYWORD = 0.08;
const MAX_RELATIONSHIP_TOPIC_MATCH_BONUS = 0.15;

type RelevanceRule = {
  topicKeywords: string[];
  stakeholderBonuses?: Array<{
    roleKeywords: string[];
    bonus: number;
  }>;
  backgroundBonuses?: Array<{
    backgroundKeywords: string[];
    bonus: number;
  }>;
  relationshipBonuses?: Array<{
    relationshipKeywords: string[];
    bonus: number;
  }>;
};

const TOPIC_RELEVANCE_RULES: RelevanceRule[] = [
  {
    topicKeywords: [
      'university',
      'student',
      'campus',
      'education',
      'school',
      'academic',
      'research',
    ],
    stakeholderBonuses: [
      {
        roleKeywords: ['university_student'],
        bonus: 0.3,
      },
      {
        roleKeywords: ['school_student', 'researcher', 'academic', 'teacher'],
        bonus: 0.2,
      },
      {
        roleKeywords: [
          'policy_maker',
          'civil_servant',
          'public_sector_employee',
        ],
        bonus: 0.1,
      },
    ],
    backgroundBonuses: [
      {
        backgroundKeywords: [
          'education',
          'teaching',
          'training',
          'computer_science',
          'software_engineering',
          'data_science',
          'artificial_intelligence',
          'social_sciences',
          'political_science',
          'public_administration',
        ],
        bonus: 0.15,
      },
    ],
  },
  {
    topicKeywords: [
      'economy',
      'business',
      'finance',
      'startup',
      'entrepreneur',
      'employment',
      'industry',
      'market',
      'commerce',
    ],
    stakeholderBonuses: [
      {
        roleKeywords: [
          'business_owner',
          'entrepreneur',
          'private_sector_employee',
          'self_employed',
          'freelancer',
        ],
        bonus: 0.3,
      },
      {
        roleKeywords: [
          'public_sector_employee',
          'civil_servant',
          'policy_maker',
        ],
        bonus: 0.15,
      },
    ],
    backgroundBonuses: [
      {
        backgroundKeywords: [
          'business',
          'management',
          'economics',
          'finance',
          'accounting',
          'marketing',
          'entrepreneurship',
          'innovation',
        ],
        bonus: 0.15,
      },
    ],
  },
  {
    topicKeywords: [
      'urban',
      'city',
      'housing',
      'mobility',
      'transport',
      'infrastructure',
      'planning',
      'regeneration',
      'public_space',
      'neighborhood',
      'community',
      'district',
      'territory',
    ],
    stakeholderBonuses: [
      {
        roleKeywords: [
          'public_sector_employee',
          'civil_servant',
          'policy_maker',
          'ngo_member',
          'volunteer',
        ],
        bonus: 0.2,
      },
      {
        roleKeywords: ['researcher', 'academic'],
        bonus: 0.1,
      },
    ],
    backgroundBonuses: [
      {
        backgroundKeywords: [
          'architecture',
          'urban_planning',
          'civil_engineering',
          'environment',
          'sustainability',
          'transport',
          'mobility',
          'public_administration',
          'political_science',
        ],
        bonus: 0.15,
      },
    ],
    relationshipBonuses: [
      {
        relationshipKeywords: ['resident'],
        bonus: 0.3,
      },
    ],
  },
  {
    topicKeywords: [
      'health',
      'healthcare',
      'medical',
      'medicine',
      'wellbeing',
      'care',
    ],
    stakeholderBonuses: [
      {
        roleKeywords: ['healthcare_worker'],
        bonus: 0.3,
      },
      {
        roleKeywords: ['ngo_member', 'volunteer', 'policy_maker'],
        bonus: 0.1,
      },
    ],
    backgroundBonuses: [
      {
        backgroundKeywords: [
          'healthcare',
          'medicine',
          'nursing',
          'public_health',
          'psychology',
        ],
        bonus: 0.15,
      },
    ],
  },
  {
    topicKeywords: ['law', 'legal', 'justice', 'safety', 'security', 'crime'],
    stakeholderBonuses: [
      {
        roleKeywords: ['legal_professional', 'policy_maker', 'civil_servant'],
        bonus: 0.25,
      },
    ],
    backgroundBonuses: [
      {
        backgroundKeywords: [
          'law',
          'criminology',
          'public_safety',
          'public_administration',
          'political_science',
        ],
        bonus: 0.15,
      },
    ],
  },
];

function normalizeValue(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/* ✅ FIXED HERE */
function normalizeSelfAssessmentWeight(score: number): number {
  return Number((score / 10).toFixed(4));
}

function matchesAnyKeyword(value: string, keywords: string[]): boolean {
  return keywords.some((keyword) => value.includes(normalizeValue(keyword)));
}

function getConsultationTopicText(
  topicContext: ConsultationTopicContext,
): string {
  return normalizeValue(
    [
      topicContext.title,
      topicContext.topicCategory,
      topicContext.summary,
      topicContext.methodologySummary,
    ]
      .filter(Boolean)
      .join(' '),
  );
}

function getMatchingRules(
  topicContext: ConsultationTopicContext,
): RelevanceRule[] {
  const topic = getConsultationTopicText(topicContext);
  return TOPIC_RELEVANCE_RULES.filter((rule) =>
    matchesAnyKeyword(topic, rule.topicKeywords),
  );
}

function getMatchedTopicKeywords(
  topicContext: ConsultationTopicContext,
  matchingRules: RelevanceRule[],
): string[] {
  const topic = getConsultationTopicText(topicContext);
  const matchedKeywords = new Set<string>();

  for (const rule of matchingRules) {
    for (const keyword of rule.topicKeywords) {
      const normalizedKeyword = normalizeValue(keyword);

      if (topic.includes(normalizedKeyword)) {
        matchedKeywords.add(normalizedKeyword);
      }
    }
  }

  return Array.from(matchedKeywords);
}

function getMaxStakeholderBonus(
  stakeholderRole: string,
  matchingRules: RelevanceRule[],
): number {
  let bonus = 0;

  for (const rule of matchingRules) {
    for (const stakeholderRule of rule.stakeholderBonuses ?? []) {
      if (matchesAnyKeyword(stakeholderRole, stakeholderRule.roleKeywords)) {
        bonus = Math.max(bonus, stakeholderRule.bonus);
      }
    }
  }

  return bonus;
}

function getMaxBackgroundBonus(
  backgroundCategory: string,
  matchingRules: RelevanceRule[],
): number {
  let bonus = 0;

  for (const rule of matchingRules) {
    for (const backgroundRule of rule.backgroundBonuses ?? []) {
      if (
        matchesAnyKeyword(backgroundCategory, backgroundRule.backgroundKeywords)
      ) {
        bonus = Math.max(bonus, backgroundRule.bonus);
      }
    }
  }

  return bonus;
}

function getMaxRelationshipBonus(
  relationshipToArea: string,
  matchingRules: RelevanceRule[],
): number {
  let bonus = 0;

  for (const rule of matchingRules) {
    for (const relationshipRule of rule.relationshipBonuses ?? []) {
      if (
        matchesAnyKeyword(
          relationshipToArea,
          relationshipRule.relationshipKeywords,
        )
      ) {
        bonus = Math.max(bonus, relationshipRule.bonus);
      }
    }
  }

  return bonus;
}

function getTopicKeywordMatchBonus(
  value: string,
  topicKeywords: string[],
  bonusPerKeyword: number,
  maxBonus: number,
): number {
  if (!value || topicKeywords.length === 0) {
    return 0;
  }

  const matchedKeywords = new Set<string>();

  for (const keyword of topicKeywords) {
    if (value.includes(keyword)) {
      matchedKeywords.add(keyword);
    }
  }

  return Math.min(matchedKeywords.size * bonusPerKeyword, maxBonus);
}

function getExperienceBonus(experienceLevel: string): number {
  switch (experienceLevel) {
    case 'expert':
      return 0.3;
    case 'advanced':
      return 0.2;
    case 'intermediate':
      return 0.1;
    default:
      return 0;
  }
}

function getExperienceAlignmentMultiplier(
  topicKeywordsMatched: number,
  topicAlignmentSignal: number,
): number {
  if (topicKeywordsMatched === 0) {
    return 1;
  }

  if (topicAlignmentSignal >= 0.3) {
    return 1;
  }

  if (topicAlignmentSignal >= 0.15) {
    return 0.65;
  }

  if (topicAlignmentSignal > 0) {
    return 0.45;
  }

  return 0.25;
}

function getLocalityBonus(assessment: AssessmentForWeighting): number {
  const city = normalizeValue(assessment.city);

  if (matchesAnyKeyword(city, ['bologna'])) {
    return 0.05;
  }

  return 0;
}

function getSpecializedWeight(
  topicContext: ConsultationTopicContext,
  assessment: AssessmentForWeighting,
): number {
  const stakeholderRole = normalizeValue(assessment.stakeholderRole);
  const backgroundCategory = normalizeValue(assessment.backgroundCategory);
  const experienceLevel = normalizeValue(assessment.experienceLevel);
  const relationshipToArea = normalizeValue(assessment.relationshipToArea);
  const matchingRules = getMatchingRules(topicContext);
  const matchedTopicKeywords = getMatchedTopicKeywords(
    topicContext,
    matchingRules,
  );
  const stakeholderBonus = getMaxStakeholderBonus(
    stakeholderRole,
    matchingRules,
  );
  const backgroundBonus = getMaxBackgroundBonus(
    backgroundCategory,
    matchingRules,
  );
  const relationshipBonus = getMaxRelationshipBonus(
    relationshipToArea,
    matchingRules,
  );
  const stakeholderTopicMatchBonus = getTopicKeywordMatchBonus(
    stakeholderRole,
    matchedTopicKeywords,
    STAKEHOLDER_TOPIC_MATCH_BONUS_PER_KEYWORD,
    MAX_STAKEHOLDER_TOPIC_MATCH_BONUS,
  );
  const backgroundTopicMatchBonus = getTopicKeywordMatchBonus(
    backgroundCategory,
    matchedTopicKeywords,
    BACKGROUND_TOPIC_MATCH_BONUS_PER_KEYWORD,
    MAX_BACKGROUND_TOPIC_MATCH_BONUS,
  );
  const relationshipTopicMatchBonus = getTopicKeywordMatchBonus(
    relationshipToArea,
    matchedTopicKeywords,
    RELATIONSHIP_TOPIC_MATCH_BONUS_PER_KEYWORD,
    MAX_RELATIONSHIP_TOPIC_MATCH_BONUS,
  );
  const topicAlignmentSignal =
    stakeholderTopicMatchBonus +
    backgroundTopicMatchBonus +
    relationshipTopicMatchBonus +
    relationshipBonus +
    Math.max(stakeholderBonus - 0.1, 0);
  const experienceBonus =
    getExperienceBonus(experienceLevel) *
    getExperienceAlignmentMultiplier(
      matchedTopicKeywords.length,
      topicAlignmentSignal,
    );

  let weight = 1;

  weight += stakeholderBonus;
  weight += backgroundBonus;
  weight += relationshipBonus;
  weight += stakeholderTopicMatchBonus;
  weight += backgroundTopicMatchBonus;
  weight += relationshipTopicMatchBonus;
  weight += experienceBonus;
  weight += getLocalityBonus(assessment);

  return Number(
    clamp(weight, MIN_SPECIALIZED_WEIGHT, MAX_SPECIALIZED_WEIGHT).toFixed(4),
  );
}

export function calculateVoteWeight(
  input: CalculateVoteWeightInput,
): WeightResult {
  if (input.voteType === 'GENERAL') {
    return {
      weightUsed: 1,
      calculationType: 'GENERAL',
    };
  }

  if (input.voteType === 'SELF_ASSESSMENT') {
    if (
      input.selfAssessmentScore === undefined ||
      input.selfAssessmentScore === null ||
      input.selfAssessmentScore < 1 ||
      input.selfAssessmentScore > 10
    ) {
      throw new Error(
        'A valid selfAssessmentScore between 1 and 10 is required',
      );
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
    weightUsed: getSpecializedWeight(
      {
        topicCategory: input.topicCategory,
        title: input.title,
        summary: input.summary,
        methodologySummary: input.methodologySummary,
      },
      input.assessment,
    ),
    calculationType: 'SPECIALIZED',
  };
}
