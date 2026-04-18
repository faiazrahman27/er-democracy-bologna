type AssessmentForWeighting = {
  ageRange?: string | null;
  gender?: string | null;
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

type TopicConcept = {
  id: string;
  aliases: string[];
};

type FieldWeights = {
  direct: number;
  concept: number;
  phrase: number;
  cap: number;
};

type FieldMatchMetrics = {
  weightedSignal: number;
  directMatches: number;
  conceptMatches: number;
  phraseMatches: number;
};

type StageMetrics = {
  weightedSignal: number;
  primaryDirectMatches: number;
  primaryConceptMatches: number;
  primaryPhraseMatches: number;
  contextualDirectMatches: number;
  contextualPhraseMatches: number;
};

type StageLevel = 'strong' | 'weak' | 'none';

type StageResult = {
  level: StageLevel;
  adjustment: number;
  metrics: StageMetrics;
};

type StageConfig = {
  stakeholderRole: FieldWeights;
  backgroundCategory: FieldWeights;
  relationshipToArea: FieldWeights;
  city: FieldWeights;
  region: FieldWeights;
  country: FieldWeights;
};

const MIN_SPECIALIZED_WEIGHT = 0.6;
const MAX_SPECIALIZED_WEIGHT = 2.0;

const TITLE_STAGE_CONFIG: StageConfig = {
  stakeholderRole: { direct: 0.22, concept: 0.08, phrase: 0.42, cap: 0.95 },
  backgroundCategory: { direct: 0.18, concept: 0.08, phrase: 0.34, cap: 0.8 },
  relationshipToArea: { direct: 0.14, concept: 0.06, phrase: 0.24, cap: 0.5 },
  city: { direct: 0.06, concept: 0, phrase: 0.12, cap: 0.16 },
  region: { direct: 0.05, concept: 0, phrase: 0.1, cap: 0.12 },
  country: { direct: 0.04, concept: 0, phrase: 0.08, cap: 0.1 },
};

const CATEGORY_STAGE_CONFIG: StageConfig = {
  stakeholderRole: { direct: 0.12, concept: 0.18, phrase: 0.2, cap: 0.7 },
  backgroundCategory: { direct: 0.14, concept: 0.2, phrase: 0.22, cap: 0.75 },
  relationshipToArea: { direct: 0.1, concept: 0.14, phrase: 0.16, cap: 0.45 },
  city: { direct: 0.04, concept: 0, phrase: 0.08, cap: 0.12 },
  region: { direct: 0.03, concept: 0, phrase: 0.07, cap: 0.1 },
  country: { direct: 0.03, concept: 0, phrase: 0.06, cap: 0.08 },
};

const GENERIC_STOP_WORDS = new Set([
  'a',
  'about',
  'an',
  'and',
  'around',
  'as',
  'at',
  'by',
  'for',
  'from',
  'in',
  'into',
  'local',
  'of',
  'on',
  'or',
  'plan',
  'plans',
  'policy',
  'policies',
  'program',
  'programs',
  'project',
  'projects',
  'public',
  'service',
  'services',
  'support',
  'system',
  'systems',
  'the',
  'to',
  'vote',
  'voting',
  'with',
]);

const TOPIC_CONCEPTS: TopicConcept[] = [
  {
    id: 'education',
    aliases: [
      'academic',
      'campus',
      'education',
      'research',
      'school',
      'schools',
      'student',
      'students',
      'teacher',
      'teachers',
      'teaching',
      'training',
      'university',
      'universities',
    ],
  },
  {
    id: 'governance',
    aliases: [
      'administration',
      'citizen participation',
      'civil servant',
      'civil service',
      'civic',
      'democracy',
      'democratic',
      'governance',
      'government',
      'governments',
      'institutional',
      'municipal',
      'municipality',
      'participation',
      'policy maker',
      'policy makers',
      'public administration',
      'public sector',
    ],
  },
  {
    id: 'economy',
    aliases: [
      'accounting',
      'audit',
      'auditing',
      'business',
      'businesses',
      'commerce',
      'economic',
      'economics',
      'economy',
      'employment',
      'entrepreneur',
      'entrepreneurship',
      'finance',
      'financial',
      'industry',
      'innovation',
      'management',
      'market',
      'markets',
      'startup',
      'startups',
    ],
  },
  {
    id: 'technology',
    aliases: [
      'artificial intelligence',
      'computer',
      'cybersecurity',
      'data',
      'digital',
      'information systems',
      'software',
      'technology',
      'technological',
    ],
  },
  {
    id: 'engineering',
    aliases: [
      'civil engineering',
      'construction',
      'electrical',
      'engineering',
      'engineer',
      'industrial',
      'infrastructure',
      'mechanical',
    ],
  },
  {
    id: 'urban',
    aliases: [
      'city',
      'cities',
      'district',
      'housing',
      'mobility',
      'neighborhood',
      'neighbourhood',
      'planning',
      'public space',
      'regeneration',
      'territorial',
      'territory',
      'transport',
      'transportation',
      'urban',
      'urban planning',
    ],
  },
  {
    id: 'health',
    aliases: [
      'care',
      'health',
      'healthcare',
      'medical',
      'medicine',
      'nursing',
      'psychology',
      'public health',
      'well being',
      'wellbeing',
    ],
  },
  {
    id: 'legal',
    aliases: [
      'crime',
      'criminology',
      'justice',
      'law',
      'legal',
      'public safety',
      'safety',
      'security',
    ],
  },
  {
    id: 'environment',
    aliases: [
      'agriculture',
      'climate',
      'ecology',
      'environment',
      'environmental',
      'food',
      'green',
      'sustainability',
      'sustainable',
    ],
  },
  {
    id: 'culture',
    aliases: [
      'art',
      'arts',
      'creative',
      'culture',
      'cultural',
      'design',
      'history',
      'hospitality',
      'humanities',
      'journalism',
      'languages',
      'literature',
      'media',
      'philosophy',
      'tourism',
    ],
  },
  {
    id: 'community',
    aliases: [
      'citizen',
      'citizens',
      'community',
      'communities',
      'resident',
      'residents',
      'visitor',
      'visitors',
    ],
  },
];

const PLACE_BASED_CONTEXT_ALIASES = [
  'area',
  'areas',
  'city',
  'cities',
  'community',
  'communities',
  'district',
  'housing',
  'mobility',
  'neighborhood',
  'neighbourhood',
  'public space',
  'resident',
  'residents',
  'territorial',
  'territory',
  'transport',
  'urban',
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

function normalizeSelfAssessmentWeight(score: number): number {
  return Number((score / 10).toFixed(4));
}

function getMeaningfulKeywords(text: string): string[] {
  const normalized = normalizeValue(text);

  if (!normalized) {
    return [];
  }

  return Array.from(
    new Set(
      normalized
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 2 && !GENERIC_STOP_WORDS.has(token)),
    ),
  );
}

function textContainsAlias(
  normalizedText: string,
  alias: string,
  normalizedTokens: Set<string>,
): boolean {
  const normalizedAlias = normalizeValue(alias);

  if (!normalizedAlias) {
    return false;
  }

  if (normalizedAlias.includes(' ')) {
    return normalizedText.includes(normalizedAlias);
  }

  return normalizedTokens.has(normalizedAlias);
}

function getMatchedConceptIds(text: string): string[] {
  const normalizedText = normalizeValue(text);
  const normalizedTokens = new Set(getMeaningfulKeywords(normalizedText));

  if (!normalizedText) {
    return [];
  }

  return TOPIC_CONCEPTS.filter((concept) =>
    concept.aliases.some((alias) =>
      textContainsAlias(normalizedText, alias, normalizedTokens),
    ),
  ).map((concept) => concept.id);
}

function countSharedValues(left: string[], right: string[]): number {
  const rightSet = new Set(right);

  return left.reduce(
    (count, value) => (rightSet.has(value) ? count + 1 : count),
    0,
  );
}

function hasPhraseMatch(stageText: string, fieldText: string): boolean {
  return fieldText.split(' ').length >= 2 && stageText.includes(fieldText);
}

function getFieldMatchMetrics(
  stageText: string,
  stageKeywords: string[],
  stageConcepts: string[],
  fieldValue: string | null | undefined,
  weights: FieldWeights,
): FieldMatchMetrics {
  const fieldText = normalizeValue(fieldValue);

  if (!fieldText) {
    return {
      weightedSignal: 0,
      directMatches: 0,
      conceptMatches: 0,
      phraseMatches: 0,
    };
  }

  const fieldKeywords = getMeaningfulKeywords(fieldText);
  const fieldConcepts = getMatchedConceptIds(fieldText);
  const directMatches = countSharedValues(stageKeywords, fieldKeywords);
  const conceptMatches = countSharedValues(stageConcepts, fieldConcepts);
  const phraseMatches = hasPhraseMatch(stageText, fieldText) ? 1 : 0;

  return {
    weightedSignal: Math.min(
      phraseMatches * weights.phrase +
        Math.min(directMatches, 3) * weights.direct +
        Math.min(conceptMatches, 2) * weights.concept,
      weights.cap,
    ),
    directMatches,
    conceptMatches,
    phraseMatches,
  };
}

function getStageMetrics(
  stageText: string,
  assessment: AssessmentForWeighting,
  config: StageConfig,
): StageMetrics {
  const normalizedStageText = normalizeValue(stageText);
  const stageKeywords = getMeaningfulKeywords(normalizedStageText);
  const stageConcepts = getMatchedConceptIds(normalizedStageText);

  const stakeholderRole = getFieldMatchMetrics(
    normalizedStageText,
    stageKeywords,
    stageConcepts,
    assessment.stakeholderRole,
    config.stakeholderRole,
  );
  const backgroundCategory = getFieldMatchMetrics(
    normalizedStageText,
    stageKeywords,
    stageConcepts,
    assessment.backgroundCategory,
    config.backgroundCategory,
  );
  const relationshipToArea = getFieldMatchMetrics(
    normalizedStageText,
    stageKeywords,
    stageConcepts,
    assessment.relationshipToArea,
    config.relationshipToArea,
  );
  const city = getFieldMatchMetrics(
    normalizedStageText,
    stageKeywords,
    stageConcepts,
    assessment.city,
    config.city,
  );
  const region = getFieldMatchMetrics(
    normalizedStageText,
    stageKeywords,
    stageConcepts,
    assessment.region,
    config.region,
  );
  const country = getFieldMatchMetrics(
    normalizedStageText,
    stageKeywords,
    stageConcepts,
    assessment.country,
    config.country,
  );

  return {
    weightedSignal:
      stakeholderRole.weightedSignal +
      backgroundCategory.weightedSignal +
      relationshipToArea.weightedSignal +
      city.weightedSignal +
      region.weightedSignal +
      country.weightedSignal,
    primaryDirectMatches:
      stakeholderRole.directMatches +
      backgroundCategory.directMatches +
      relationshipToArea.directMatches,
    primaryConceptMatches:
      stakeholderRole.conceptMatches +
      backgroundCategory.conceptMatches +
      relationshipToArea.conceptMatches,
    primaryPhraseMatches:
      stakeholderRole.phraseMatches +
      backgroundCategory.phraseMatches +
      relationshipToArea.phraseMatches,
    contextualDirectMatches:
      city.directMatches + region.directMatches + country.directMatches,
    contextualPhraseMatches:
      city.phraseMatches + region.phraseMatches + country.phraseMatches,
  };
}

function evaluateTitleStage(
  topicContext: ConsultationTopicContext,
  assessment: AssessmentForWeighting,
): StageResult {
  const metrics = getStageMetrics(
    topicContext.title ?? '',
    assessment,
    TITLE_STAGE_CONFIG,
  );
  const hasStrongMatch =
    metrics.primaryPhraseMatches > 0 ||
    metrics.primaryDirectMatches >= 2 ||
    metrics.weightedSignal >= 1.1;
  const hasWeakMatch =
    metrics.primaryDirectMatches >= 1 ||
    metrics.contextualDirectMatches >= 1 ||
    metrics.contextualPhraseMatches > 0;

  if (hasStrongMatch) {
    return {
      level: 'strong',
      adjustment: Number(
        clamp(
          0.5 +
            metrics.weightedSignal * 0.12 +
            metrics.primaryDirectMatches * 0.03,
          0.5,
          0.9,
        ).toFixed(4),
      ),
      metrics,
    };
  }

  if (hasWeakMatch) {
    return {
      level: 'weak',
      adjustment: Number(
        clamp(
          0.1 +
            metrics.weightedSignal * 0.25 +
            metrics.primaryDirectMatches * 0.05 +
            metrics.contextualDirectMatches * 0.02,
          0.1,
          0.3,
        ).toFixed(4),
      ),
      metrics,
    };
  }

  return {
    level: 'none',
    adjustment: Number(
      (-clamp(0.52 - metrics.weightedSignal * 0.45, 0.3, 0.6)).toFixed(4),
    ),
    metrics,
  };
}

function evaluateTopicCategoryStage(
  topicContext: ConsultationTopicContext,
  assessment: AssessmentForWeighting,
): StageResult {
  const metrics = getStageMetrics(
    topicContext.topicCategory,
    assessment,
    CATEGORY_STAGE_CONFIG,
  );
  const hasStrongMatch =
    metrics.primaryPhraseMatches > 0 ||
    metrics.primaryDirectMatches >= 1 ||
    metrics.primaryConceptMatches >= 1;
  const hasWeakMatch =
    metrics.contextualDirectMatches >= 1 || metrics.contextualPhraseMatches > 0;

  if (hasStrongMatch) {
    return {
      level: 'strong',
      adjustment: Number(
        clamp(
          0.3 +
            metrics.weightedSignal * 0.12 +
            metrics.primaryConceptMatches * 0.015,
          0.3,
          0.6,
        ).toFixed(4),
      ),
      metrics,
    };
  }

  if (hasWeakMatch) {
    return {
      level: 'weak',
      adjustment: Number(
        clamp(
          0.05 +
            metrics.weightedSignal * 0.12 +
            metrics.contextualDirectMatches * 0.02,
          0.05,
          0.15,
        ).toFixed(4),
      ),
      metrics,
    };
  }

  return {
    level: 'none',
    adjustment: Number(
      (-clamp(0.24 - metrics.weightedSignal * 0.2, 0.2, 0.4)).toFixed(4),
    ),
    metrics,
  };
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

function getConditionalExperienceBonus(
  assessment: AssessmentForWeighting,
  titleStage: StageResult,
  topicCategoryStage: StageResult,
): number {
  const baseBonus = getExperienceBonus(
    normalizeValue(assessment.experienceLevel),
  );

  if (baseBonus === 0) {
    return 0;
  }

  const relevanceSignal =
    titleStage.metrics.weightedSignal * 1.35 +
    topicCategoryStage.metrics.weightedSignal * 0.8;

  if (titleStage.level === 'strong' && relevanceSignal >= 1.1) {
    return baseBonus;
  }

  if (
    relevanceSignal >= 0.85 &&
    (titleStage.level !== 'none' || topicCategoryStage.level !== 'none')
  ) {
    return Number(Math.min(baseBonus * 0.45, 0.15).toFixed(4));
  }

  return Number(Math.min(baseBonus * 0.15, 0.05).toFixed(4));
}

function getSecondaryContextAdjustment(
  topicContext: ConsultationTopicContext,
  assessment: AssessmentForWeighting,
  titleStage: StageResult,
  topicCategoryStage: StageResult,
): number {
  if (titleStage.level === 'none' && topicCategoryStage.level === 'none') {
    return 0;
  }

  const fullContextText = normalizeValue(
    [
      topicContext.title,
      topicContext.topicCategory,
      topicContext.summary,
      topicContext.methodologySummary,
    ]
      .filter(Boolean)
      .join(' '),
  );

  let adjustment = 0;
  const city = normalizeValue(assessment.city);
  const region = normalizeValue(assessment.region);
  const country = normalizeValue(assessment.country);
  const relationshipToArea = normalizeValue(assessment.relationshipToArea);

  if (city && fullContextText.includes(city)) {
    adjustment += 0.04;
  }

  if (region && fullContextText.includes(region)) {
    adjustment += 0.02;
  }

  if (country && fullContextText.includes(country)) {
    adjustment += 0.01;
  }

  const fullContextTokens = new Set(getMeaningfulKeywords(fullContextText));
  const isPlaceBasedConsultation = PLACE_BASED_CONTEXT_ALIASES.some((alias) =>
    textContainsAlias(fullContextText, alias, fullContextTokens),
  );

  if (isPlaceBasedConsultation) {
    if (relationshipToArea === 'resident') {
      adjustment += 0.04;
    } else if (relationshipToArea === 'non resident') {
      adjustment -= 0.03;
    } else if (relationshipToArea === 'visitor') {
      adjustment -= 0.04;
    }
  }

  return Number(clamp(adjustment, -0.08, 0.08).toFixed(4));
}

function applyRelevanceGate(
  weight: number,
  titleStage: StageResult,
  topicCategoryStage: StageResult,
): number {
  if (titleStage.level === 'strong' || topicCategoryStage.level === 'strong') {
    return weight;
  }

  const combinedSignal =
    titleStage.metrics.weightedSignal +
    topicCategoryStage.metrics.weightedSignal;
  const gatingPenalty =
    combinedSignal >= 0.6 ? 0.1 : combinedSignal >= 0.3 ? 0.16 : 0.22;

  return Math.min(weight, 1.05) - gatingPenalty;
}

function getSpecializedWeight(
  topicContext: ConsultationTopicContext,
  assessment: AssessmentForWeighting,
): number {
  const titleStage = evaluateTitleStage(topicContext, assessment);
  const topicCategoryStage = evaluateTopicCategoryStage(
    topicContext,
    assessment,
  );

  let weight = 1;

  weight += titleStage.adjustment;
  weight += topicCategoryStage.adjustment;
  weight = applyRelevanceGate(weight, titleStage, topicCategoryStage);
  weight += getConditionalExperienceBonus(
    assessment,
    titleStage,
    topicCategoryStage,
  );
  weight += getSecondaryContextAdjustment(
    topicContext,
    assessment,
    titleStage,
    topicCategoryStage,
  );

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
