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

type ConsultationStageName =
  | 'title'
  | 'topicCategory'
  | 'summary'
  | 'methodologySummary';

type ConsultationStage = {
  name: ConsultationStageName;
  text: string;
  sourceWeight: number;
  tokens: string[];
  roots: string[];
  phrases: string[];
};

type ConsultationContextSignals = {
  fullText: string;
  stages: ConsultationStage[];
  rootWeights: Map<string, number>;
  rootStrongestSource: Map<string, number>;
  phraseWeights: Map<string, number>;
  locationMarkerSignal: number;
};

type FieldMatchKind = 'none' | 'partial' | 'strong';

type FieldMatch = {
  kind: FieldMatchKind;
  strength: number;
  exactPhraseWeight: number;
  matchedRootCount: number;
  matchedRootSignal: number;
  coverage: number;
  strongestSourceWeight: number;
};

type BackgroundInfluence = {
  applicability: number;
  active: boolean;
  stronglyActive: boolean;
  match: FieldMatch;
};

type RelevanceLevel = 'strong' | 'partial' | 'weak';

const MIN_SPECIALIZED_WEIGHT = 0.6;
const MAX_SPECIALIZED_WEIGHT = 2.0;

const CONSULTATION_STAGE_WEIGHTS: Record<ConsultationStageName, number> = {
  title: 1,
  topicCategory: 0.72,
  summary: 0.38,
  methodologySummary: 0.28,
};

const GENERIC_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'into',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'these',
  'this',
  'those',
  'to',
  'via',
  'vote',
  'voting',
  'with',
]);

const NON_SCORING_FIELD_TOKENS = new Set(['other', 'prefer', 'not', 'say']);

const LOCATION_CONTEXT_MARKERS = new Set([
  'area',
  'areas',
  'campus',
  'campuses',
  'city',
  'cities',
  'community',
  'communities',
  'district',
  'districts',
  'facility',
  'facilities',
  'local',
  'municipal',
  'municipality',
  'neighborhood',
  'neighbourhood',
  'place',
  'places',
  'resident',
  'residents',
  'site',
  'sites',
  'street',
  'streets',
  'territorial',
  'urban',
  'zone',
  'zones',
]);

function normalizeValue(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, digits = 4): number {
  return Number(value.toFixed(digits));
}

function normalizeSelfAssessmentWeight(score: number): number {
  return Number((score / 10).toFixed(4));
}

function toUniqueArray(values: string[]): string[] {
  return Array.from(new Set(values));
}

function shouldKeepToken(
  token: string,
  removeNonScoringFieldTokens = false,
): boolean {
  if (!token || token.length < 2 || GENERIC_STOP_WORDS.has(token)) {
    return false;
  }

  if (removeNonScoringFieldTokens && NON_SCORING_FIELD_TOKENS.has(token)) {
    return false;
  }

  return true;
}

function getMeaningfulTokens(
  text: string,
  removeNonScoringFieldTokens = false,
): string[] {
  const normalized = normalizeValue(text);

  if (!normalized) {
    return [];
  }

  return toUniqueArray(
    normalized
      .split(' ')
      .filter((token) => shouldKeepToken(token, removeNonScoringFieldTokens)),
  );
}

function stemToken(token: string): string {
  if (token.length <= 3) {
    return token;
  }

  if (token.endsWith('ies') && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }

  const suffixes = ['ments', 'ment', 'ations', 'ation', 'ingly', 'edly', 'ing'];

  for (const suffix of suffixes) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 3) {
      return token.slice(0, -suffix.length);
    }
  }

  if (token.endsWith('ers') && token.length > 5) {
    return token.slice(0, -3);
  }

  if (
    (token.endsWith('er') || token.endsWith('ed') || token.endsWith('es')) &&
    token.length > 4
  ) {
    return token.slice(0, -2);
  }

  if (token.endsWith('s') && !token.endsWith('ss') && token.length > 4) {
    return token.slice(0, -1);
  }

  return token;
}

function buildPhrases(tokens: string[]): string[] {
  const phrases = new Set<string>();

  for (let size = 2; size <= Math.min(3, tokens.length); size += 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      phrases.add(tokens.slice(index, index + size).join(' '));
    }
  }

  return Array.from(phrases);
}

function addWeightedSignal(
  map: Map<string, number>,
  key: string,
  signal: number,
): void {
  map.set(key, (map.get(key) ?? 0) + signal);
}

function updateStrongestSignal(
  map: Map<string, number>,
  key: string,
  signal: number,
): void {
  map.set(key, Math.max(map.get(key) ?? 0, signal));
}

function buildConsultationContextSignals(
  topicContext: ConsultationTopicContext,
): ConsultationContextSignals {
  const stageInputs: ConsultationStage[] = (
    [
      { name: 'title', text: topicContext.title ?? '' },
      { name: 'topicCategory', text: topicContext.topicCategory },
      { name: 'summary', text: topicContext.summary ?? '' },
      {
        name: 'methodologySummary',
        text: topicContext.methodologySummary ?? '',
      },
    ] as const
  )
    .map((stage) => {
      const normalizedText = normalizeValue(stage.text);
      const tokens = getMeaningfulTokens(normalizedText);

      return {
        name: stage.name,
        text: normalizedText,
        sourceWeight: CONSULTATION_STAGE_WEIGHTS[stage.name],
        tokens,
        roots: toUniqueArray(tokens.map(stemToken)),
        phrases: buildPhrases(tokens),
      };
    })
    .filter((stage) => stage.text);

  const rootWeights = new Map<string, number>();
  const rootStrongestSource = new Map<string, number>();
  const phraseWeights = new Map<string, number>();
  let locationMarkerSignal = 0;

  for (const stage of stageInputs) {
    for (const root of stage.roots) {
      addWeightedSignal(rootWeights, root, stage.sourceWeight);
      updateStrongestSignal(rootStrongestSource, root, stage.sourceWeight);
    }

    for (const phrase of stage.phrases) {
      addWeightedSignal(phraseWeights, phrase, stage.sourceWeight);
    }

    const locationTokenCount = stage.tokens.filter((token) =>
      LOCATION_CONTEXT_MARKERS.has(token),
    ).length;

    if (locationTokenCount > 0) {
      locationMarkerSignal +=
        stage.sourceWeight + Math.min((locationTokenCount - 1) * 0.08, 0.16);
    }
  }

  return {
    fullText: stageInputs
      .map((stage) => stage.text)
      .join(' ')
      .trim(),
    stages: stageInputs,
    rootWeights,
    rootStrongestSource,
    phraseWeights,
    locationMarkerSignal: round(locationMarkerSignal),
  };
}

function getRootRelation(left: string, right: string): number {
  if (left === right) {
    return 1;
  }

  const minLength = Math.min(left.length, right.length);

  if (minLength >= 5 && (left.startsWith(right) || right.startsWith(left))) {
    return 0.72;
  }

  return 0;
}

function getNoMatch(): FieldMatch {
  return {
    kind: 'none',
    strength: 0,
    exactPhraseWeight: 0,
    matchedRootCount: 0,
    matchedRootSignal: 0,
    coverage: 0,
    strongestSourceWeight: 0,
  };
}

function getFieldMatch(
  contextSignals: ConsultationContextSignals,
  fieldValue: string | null | undefined,
): FieldMatch {
  const normalizedField = normalizeValue(fieldValue);

  if (!normalizedField) {
    return getNoMatch();
  }

  const fieldTokens = getMeaningfulTokens(normalizedField, true);

  if (fieldTokens.length === 0) {
    return getNoMatch();
  }

  const fieldRoots = toUniqueArray(fieldTokens.map(stemToken));
  const fieldPhrases = toUniqueArray([
    ...(fieldTokens.length >= 2 ? [fieldTokens.join(' ')] : []),
    ...buildPhrases(fieldTokens),
  ]);

  let exactPhraseWeight = 0;

  for (const phrase of fieldPhrases) {
    exactPhraseWeight = Math.max(
      exactPhraseWeight,
      contextSignals.phraseWeights.get(phrase) ?? 0,
    );
  }

  let matchedRootCount = 0;
  let matchedRootSignal = 0;
  let strongestSourceWeight = 0;

  for (const fieldRoot of fieldRoots) {
    let bestRootSignal = 0;
    let bestSourceWeight = 0;

    for (const [contextRoot, contextSignal] of contextSignals.rootWeights) {
      const relation = getRootRelation(fieldRoot, contextRoot);

      if (relation === 0) {
        continue;
      }

      const adjustedSignal = contextSignal * relation;
      const adjustedSourceWeight =
        (contextSignals.rootStrongestSource.get(contextRoot) ?? 0) * relation;

      if (adjustedSignal > bestRootSignal) {
        bestRootSignal = adjustedSignal;
        bestSourceWeight = adjustedSourceWeight;
      }
    }

    if (bestRootSignal > 0) {
      matchedRootCount += 1;
      matchedRootSignal += Math.min(bestRootSignal, 1.25);
      strongestSourceWeight = Math.max(strongestSourceWeight, bestSourceWeight);
    }
  }

  const coverage =
    fieldRoots.length > 0 ? matchedRootCount / fieldRoots.length : 0;

  let kind: FieldMatchKind = 'none';

  if (
    exactPhraseWeight >= 0.72 ||
    matchedRootSignal >= 1.45 ||
    (matchedRootCount >= 2 &&
      coverage >= 0.5 &&
      strongestSourceWeight >= 0.72) ||
    (exactPhraseWeight >= 0.38 && matchedRootSignal >= 0.78)
  ) {
    kind = 'strong';
  } else if (exactPhraseWeight > 0 || matchedRootCount > 0) {
    kind = 'partial';
  }

  const strength = clamp(
    exactPhraseWeight * 0.28 +
      matchedRootSignal * 0.22 +
      coverage * 0.34 +
      strongestSourceWeight * 0.16,
    0,
    1,
  );

  return {
    kind,
    strength: round(strength),
    exactPhraseWeight: round(exactPhraseWeight),
    matchedRootCount,
    matchedRootSignal: round(matchedRootSignal),
    coverage: round(coverage),
    strongestSourceWeight: round(strongestSourceWeight),
  };
}

function getBackgroundInfluence(
  contextSignals: ConsultationContextSignals,
  assessment: AssessmentForWeighting,
): BackgroundInfluence {
  const match = getFieldMatch(contextSignals, assessment.backgroundCategory);

  if (match.kind === 'none') {
    return {
      applicability: 0,
      active: false,
      stronglyActive: false,
      match,
    };
  }

  let applicability = 0;

  if (
    match.exactPhraseWeight >= 0.72 ||
    match.matchedRootCount >= 2 ||
    match.matchedRootSignal >= 1.45
  ) {
    applicability = 1;
  } else if (
    match.exactPhraseWeight >= 0.38 ||
    (match.matchedRootCount >= 1 && match.strongestSourceWeight >= 0.72)
  ) {
    applicability = 0.35 + Math.min(match.strength * 0.15, 0.15);
  }

  applicability = round(applicability);

  return {
    applicability,
    active: applicability >= 0.35,
    stronglyActive: applicability >= 0.85,
    match,
  };
}

function determineOverallRelevanceLevel(
  stakeholderRoleMatch: FieldMatch,
  backgroundInfluence: BackgroundInfluence,
): RelevanceLevel {
  const backgroundStrong =
    backgroundInfluence.stronglyActive &&
    backgroundInfluence.match.kind === 'strong';
  const backgroundPartial =
    backgroundInfluence.active && backgroundInfluence.match.kind !== 'none';
  const combinedPartialStrength =
    stakeholderRoleMatch.strength + backgroundInfluence.match.strength;

  if (
    stakeholderRoleMatch.kind === 'strong' ||
    backgroundStrong ||
    (stakeholderRoleMatch.kind === 'partial' &&
      backgroundPartial &&
      combinedPartialStrength >= 0.95)
  ) {
    return 'strong';
  }

  if (stakeholderRoleMatch.kind === 'partial' || backgroundPartial) {
    return 'partial';
  }

  return 'weak';
}

function getPrimaryRelevanceWeight(
  relevanceLevel: RelevanceLevel,
  stakeholderRoleMatch: FieldMatch,
  backgroundInfluence: BackgroundInfluence,
): number {
  const stakeholderRoleContribution =
    stakeholderRoleMatch.kind === 'strong'
      ? 0.24 + stakeholderRoleMatch.strength * 0.18
      : stakeholderRoleMatch.kind === 'partial'
        ? 0.05 + stakeholderRoleMatch.strength * 0.1
        : 0;

  const backgroundBaseContribution =
    backgroundInfluence.match.kind === 'strong'
      ? 0.14 + backgroundInfluence.match.strength * 0.12
      : backgroundInfluence.match.kind === 'partial'
        ? 0.03 + backgroundInfluence.match.strength * 0.07
        : 0;

  const backgroundContribution =
    backgroundBaseContribution * backgroundInfluence.applicability;

  if (relevanceLevel === 'strong') {
    const synergy =
      stakeholderRoleMatch.kind !== 'none' && backgroundInfluence.active
        ? 0.04
        : 0;

    return (
      1.04 + stakeholderRoleContribution + backgroundContribution + synergy
    );
  }

  if (relevanceLevel === 'partial') {
    const synergy =
      stakeholderRoleMatch.kind === 'partial' && backgroundInfluence.active
        ? 0.03
        : 0;

    return (
      0.94 +
      stakeholderRoleContribution * 0.75 +
      backgroundContribution * 0.85 +
      synergy
    );
  }

  let penalty = 0.08;

  if (stakeholderRoleMatch.kind === 'none') {
    penalty += 0.07;
  }

  if (
    !backgroundInfluence.active ||
    backgroundInfluence.match.kind === 'none'
  ) {
    penalty += 0.05;
  }

  return (
    1 -
    penalty +
    stakeholderRoleContribution * 0.25 +
    backgroundContribution * 0.25
  );
}

function getExperienceAdjustment(
  relevanceLevel: RelevanceLevel,
  experienceLevel: string | null | undefined,
): number {
  if (relevanceLevel === 'weak') {
    return 0;
  }

  let baseAdjustment = 0;

  switch (normalizeValue(experienceLevel)) {
    case 'expert':
      baseAdjustment = 0.06;
      break;
    case 'advanced':
      baseAdjustment = 0.04;
      break;
    case 'intermediate':
      baseAdjustment = 0.02;
      break;
    default:
      baseAdjustment = 0;
      break;
  }

  if (baseAdjustment === 0) {
    return 0;
  }

  return relevanceLevel === 'strong'
    ? baseAdjustment
    : round(baseAdjustment * 0.6);
}

function isLocationRelevant(
  contextSignals: ConsultationContextSignals,
  assessment: AssessmentForWeighting,
): boolean {
  const normalizedCity = normalizeValue(assessment.city);

  if (normalizedCity && contextSignals.fullText.includes(normalizedCity)) {
    return true;
  }

  return contextSignals.locationMarkerSignal >= 1;
}

function getRelationshipToAreaAdjustment(
  relevanceLevel: RelevanceLevel,
  locationRelevant: boolean,
  relationshipToArea: string | null | undefined,
): number {
  if (!locationRelevant || relevanceLevel === 'weak') {
    return 0;
  }

  let baseAdjustment = 0;

  switch (normalizeValue(relationshipToArea)) {
    case 'resident':
      baseAdjustment = 0.035;
      break;
    case 'non resident':
      baseAdjustment = 0.012;
      break;
    case 'visitor':
      baseAdjustment = -0.018;
      break;
    default:
      baseAdjustment = 0;
      break;
  }

  return relevanceLevel === 'strong'
    ? baseAdjustment
    : round(baseAdjustment * 0.7);
}

function getCityAdjustment(
  relevanceLevel: RelevanceLevel,
  contextSignals: ConsultationContextSignals,
  locationRelevant: boolean,
  city: string | null | undefined,
): number {
  if (!locationRelevant || relevanceLevel === 'weak') {
    return 0;
  }

  const normalizedCity = normalizeValue(city);

  if (!normalizedCity || !contextSignals.fullText.includes(normalizedCity)) {
    return 0;
  }

  return relevanceLevel === 'strong' ? 0.015 : 0.01;
}

function getSpecializedWeight(
  topicContext: ConsultationTopicContext,
  assessment: AssessmentForWeighting,
): number {
  const contextSignals = buildConsultationContextSignals(topicContext);
  const stakeholderRoleMatch = getFieldMatch(
    contextSignals,
    assessment.stakeholderRole,
  );
  const backgroundInfluence = getBackgroundInfluence(
    contextSignals,
    assessment,
  );
  const relevanceLevel = determineOverallRelevanceLevel(
    stakeholderRoleMatch,
    backgroundInfluence,
  );
  const locationRelevant = isLocationRelevant(contextSignals, assessment);

  let weight = getPrimaryRelevanceWeight(
    relevanceLevel,
    stakeholderRoleMatch,
    backgroundInfluence,
  );

  weight += getExperienceAdjustment(relevanceLevel, assessment.experienceLevel);
  weight += getRelationshipToAreaAdjustment(
    relevanceLevel,
    locationRelevant,
    assessment.relationshipToArea,
  );
  weight += getCityAdjustment(
    relevanceLevel,
    contextSignals,
    locationRelevant,
    assessment.city,
  );

  return round(clamp(weight, MIN_SPECIALIZED_WEIGHT, MAX_SPECIALIZED_WEIGHT));
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
