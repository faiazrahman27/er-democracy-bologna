type AssessmentForWeighting = {
  ageRange?: string | null;
  gender?: string | null;
  stakeholderRole: string | null;
  backgroundCategory: string | null;
  experienceLevel: string | null;
  yearsOfExperience: number | null;
  studyLevel: string | null;
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
  semanticPhraseWeight: number;
  semanticRootCount: number;
  semanticRootSignal: number;
  semanticCoverage: number;
  specificity: number;
};

type BackgroundInfluence = {
  applicability: number;
  active: boolean;
  stronglyActive: boolean;
  match: FieldMatch;
};

type SemanticExpansion = {
  aliases: string[];
  specificity: number;
};

type FieldSemanticProfile = {
  tokens: string[];
  roots: string[];
  phrases: string[];
  aliasTokens: string[];
  aliasRoots: string[];
  aliasPhrases: string[];
  specificity: number;
};

type RelevanceLevel = 'strong' | 'partial' | 'weak';

const MIN_SPECIALIZED_WEIGHT = 0.5;
const MAX_SPECIALIZED_WEIGHT = 2.0;
const MIN_SELF_ASSESSMENT_SCORE = 1;
const MID_SELF_ASSESSMENT_SCORE = 5;
const MAX_SELF_ASSESSMENT_SCORE = 10;
const MIN_SELF_ASSESSMENT_WEIGHT = 0.5;
const MID_SELF_ASSESSMENT_WEIGHT = 1;
const MAX_SELF_ASSESSMENT_WEIGHT = 2;

const CONSULTATION_STAGE_WEIGHTS: Record<ConsultationStageName, number> = {
  title: 1,
  topicCategory: 0.72,
  summary: 0.38,
  methodologySummary: 0.28,
};

const GENERIC_STOP_WORDS = new Set([
  'a',
  'ai',
  'al',
  'alla',
  'alle',
  'also',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'che',
  'con',
  'consultation',
  'consultations',
  'consultazione',
  'consultazioni',
  'da',
  'dagli',
  'dai',
  'dal',
  'dalla',
  'dalle',
  'dei',
  'degli',
  'del',
  'della',
  'delle',
  'di',
  'e',
  'ed',
  'fra',
  'for',
  'from',
  'gli',
  'i',
  'il',
  'in',
  'into',
  'is',
  'it',
  'its',
  'la',
  'le',
  'lo',
  'nel',
  'nella',
  'nelle',
  'nei',
  'negli',
  'of',
  'on',
  'o',
  'per',
  'piu',
  'or',
  'su',
  'that',
  'the',
  'their',
  'these',
  'this',
  'those',
  'tra',
  'to',
  'un',
  'una',
  'uno',
  'via',
  'vote',
  'votazione',
  'votazioni',
  'voting',
  'with',
]);

const NON_SCORING_FIELD_TOKENS = new Set(['other', 'prefer', 'not', 'say']);

const LOCATION_CONTEXT_MARKERS = new Set([
  'area',
  'areas',
  'aree',
  'campus',
  'campuses',
  'city',
  'cities',
  'citta',
  'comunal',
  'comune',
  'comuni',
  'community',
  'communities',
  'district',
  'districts',
  'facility',
  'facilities',
  'local',
  'locale',
  'locali',
  'municipal',
  'municipale',
  'municipali',
  'municipality',
  'municipio',
  'neighborhood',
  'neighbourhood',
  'place',
  'places',
  'piazza',
  'piazze',
  'quartiere',
  'quartieri',
  'resident',
  'residents',
  'residente',
  'residenti',
  'site',
  'sites',
  'spazio',
  'spazi',
  'street',
  'streets',
  'territorio',
  'territorial',
  'territoriale',
  'territoriali',
  'urban',
  'urbani',
  'vicinato',
  'zone',
  'zones',
]);

const NON_DISCRIMINATIVE_ALIAS_TOKENS = new Set([
  'access',
  'activities',
  'activity',
  'care',
  'community',
  'communities',
  'decision',
  'decisions',
  'delivery',
  'design',
  'development',
  'evidence',
  'general',
  'initiative',
  'initiatives',
  'local',
  'operations',
  'participation',
  'plan',
  'planning',
  'plans',
  'policy',
  'programme',
  'programmes',
  'programs',
  'project',
  'projects',
  'public',
  'quality',
  'review',
  'reviews',
  'service',
  'services',
  'strategy',
  'support',
  'system',
  'systems',
  'wellbeing',
  'workshop',
  'workshops',
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
  const normalizedScore = clamp(
    score,
    MIN_SELF_ASSESSMENT_SCORE,
    MAX_SELF_ASSESSMENT_SCORE,
  );

  if (normalizedScore <= MID_SELF_ASSESSMENT_SCORE) {
    return round(
      MIN_SELF_ASSESSMENT_WEIGHT +
        ((normalizedScore - MIN_SELF_ASSESSMENT_SCORE) /
          (MID_SELF_ASSESSMENT_SCORE - MIN_SELF_ASSESSMENT_SCORE)) *
          (MID_SELF_ASSESSMENT_WEIGHT - MIN_SELF_ASSESSMENT_WEIGHT),
    );
  }

  return round(
    MID_SELF_ASSESSMENT_WEIGHT +
      ((normalizedScore - MID_SELF_ASSESSMENT_SCORE) /
        (MAX_SELF_ASSESSMENT_SCORE - MID_SELF_ASSESSMENT_SCORE)) *
        (MAX_SELF_ASSESSMENT_WEIGHT - MID_SELF_ASSESSMENT_WEIGHT),
  );
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

function createSemanticExpansion(
  aliases: string[],
  specificity: number,
): SemanticExpansion {
  return {
    aliases: toUniqueArray(
      aliases.map((alias) => normalizeValue(alias)).filter(Boolean),
    ),
    specificity: round(clamp(specificity, 0.35, 0.95), 2),
  };
}

const ROLE_SEMANTIC_EXPANSIONS: Record<string, SemanticExpansion> = {
  'university student': createSemanticExpansion(
    [
      'campus life',
      'campus housing',
      'student housing',
      'lecture halls',
      'course scheduling',
      'academic support',
      'higher education',
      'servizi agli studenti',
      'vita universitaria',
      'ateneo',
      'universita',
    ],
    0.64,
  ),
  'school student': createSemanticExpansion(
    [
      'school life',
      'classroom learning',
      'school curriculum',
      'secondary education',
      'didattica scolastica',
      'vita scolastica',
      'scuola',
    ],
    0.58,
  ),
  'business owner': createSemanticExpansion(
    [
      'local business',
      'commercial activity',
      'business development',
      'small enterprise',
      'commercio locale',
      'impresa',
    ],
    0.62,
  ),
  entrepreneur: createSemanticExpansion(
    [
      'startup ecosystem',
      'venture creation',
      'innovation hub',
      'business incubation',
      'impresa innovativa',
      'imprenditoria',
    ],
    0.68,
  ),
  'private sector employee': createSemanticExpansion(
    [
      'workplace conditions',
      'company workforce',
      'industry employment',
      'settore privato',
      'corporate work',
    ],
    0.56,
  ),
  'public sector employee': createSemanticExpansion(
    [
      'municipal staff',
      'public administration',
      'local government operations',
      'servizi pubblici',
      'amministrazione comunale',
    ],
    0.66,
  ),
  freelancer: createSemanticExpansion(
    [
      'independent professionals',
      'freelance work',
      'creative freelancing',
      'liberi professionisti',
    ],
    0.56,
  ),
  'self employed': createSemanticExpansion(
    [
      'self employed workers',
      'independent business',
      'small enterprise',
      'lavoratori autonomi',
    ],
    0.58,
  ),
  researcher: createSemanticExpansion(
    [
      'scientific research',
      'evidence synthesis',
      'data collection',
      'laboratory work',
      'ricerca scientifica',
      'ricerca accademica',
    ],
    0.72,
  ),
  academic: createSemanticExpansion(
    [
      'faculty governance',
      'higher education policy',
      'university operations',
      'academic services',
      'governo accademico',
      'universita',
    ],
    0.68,
  ),
  teacher: createSemanticExpansion(
    [
      'teacher training',
      'classroom practice',
      'curriculum design',
      'school pedagogy',
      'formazione docenti',
      'insegnamento',
    ],
    0.66,
  ),
  'ngo member': createSemanticExpansion(
    [
      'nonprofit services',
      'civic organizations',
      'community advocacy',
      'terzo settore',
      'organizzazioni civiche',
    ],
    0.6,
  ),
  volunteer: createSemanticExpansion(
    [
      'community volunteering',
      'mutual aid',
      'civic support',
      'volontariato',
      'supporto civico',
    ],
    0.54,
  ),
  'civil servant': createSemanticExpansion(
    [
      'public office',
      'municipal administration',
      'administrative procedure',
      'servizi comunali',
      'ufficio pubblico',
      'comune',
    ],
    0.7,
  ),
  'policy maker': createSemanticExpansion(
    [
      'policy design',
      'regulatory framework',
      'strategic governance',
      'public decision making',
      'definizione delle politiche',
      'governance pubblica',
    ],
    0.74,
  ),
  'healthcare worker': createSemanticExpansion(
    [
      'patient care',
      'hospital services',
      'clinical operations',
      'health services',
      'assistenza sanitaria',
      'ospedale',
    ],
    0.7,
  ),
  'legal professional': createSemanticExpansion(
    [
      'legal compliance',
      'justice system',
      'rights protection',
      'regulatory interpretation',
      'normativa',
      'giustizia',
    ],
    0.72,
  ),
  'creative professional': createSemanticExpansion(
    [
      'creative industries',
      'visual communication',
      'cultural production',
      'design practice',
      'industrie culturali',
      'progettazione creativa',
    ],
    0.62,
  ),
  unemployed: createSemanticExpansion(
    [
      'employment services',
      'job training',
      'labour market support',
      'workforce transition',
      'servizi per il lavoro',
    ],
    0.48,
  ),
  retired: createSemanticExpansion(
    [
      'senior services',
      'ageing policy',
      'elder care',
      'pension systems',
      'servizi per anziani',
      'pensione',
    ],
    0.52,
  ),
};

const BACKGROUND_SEMANTIC_EXPANSIONS: Record<string, SemanticExpansion> = {
  'business and management': createSemanticExpansion(
    [
      'business development',
      'commercial strategy',
      'enterprise governance',
      'organizational management',
      'gestione aziendale',
      'sviluppo d impresa',
    ],
    0.46,
  ),
  'economics and finance': createSemanticExpansion(
    [
      'economic policy',
      'public budget',
      'financial planning',
      'investment strategy',
      'economia',
      'finanza',
      'bilancio',
    ],
    0.62,
  ),
  'accounting and auditing': createSemanticExpansion(
    [
      'financial reporting',
      'audit controls',
      'regulatory audit',
      'bookkeeping',
      'contabilita',
      'revisione contabile',
    ],
    0.7,
  ),
  'marketing and communication': createSemanticExpansion(
    [
      'public communication',
      'brand strategy',
      'outreach campaign',
      'stakeholder communication',
      'marketing territoriale',
      'comunicazione pubblica',
    ],
    0.58,
  ),
  'entrepreneurship and innovation': createSemanticExpansion(
    [
      'startup ecosystem',
      'innovation policy',
      'venture creation',
      'business incubation',
      'innovazione',
      'startup',
    ],
    0.68,
  ),
  'computer science': createSemanticExpansion(
    [
      'computing systems',
      'algorithms',
      'software platforms',
      'informatics',
      'informatica',
      'sistemi digitali',
    ],
    0.7,
  ),
  'software engineering': createSemanticExpansion(
    [
      'software architecture',
      'application platform',
      'software development',
      'developer tools',
      'sviluppo software',
      'architettura software',
    ],
    0.8,
  ),
  'data science': createSemanticExpansion(
    [
      'data analytics',
      'statistical modelling',
      'data platform',
      'predictive analysis',
      'analisi dei dati',
      'modelli statistici',
    ],
    0.76,
  ),
  'artificial intelligence': createSemanticExpansion(
    [
      'machine learning',
      'algorithmic systems',
      'predictive models',
      'neural systems',
      'intelligenza artificiale',
      'apprendimento automatico',
    ],
    0.82,
  ),
  cybersecurity: createSemanticExpansion(
    [
      'digital security',
      'incident response',
      'privacy protection',
      'threat prevention',
      'sicurezza informatica',
      'protezione dei dati',
    ],
    0.82,
  ),
  'information systems': createSemanticExpansion(
    [
      'digital services',
      'enterprise systems',
      'it infrastructure',
      'digital operations',
      'sistemi informativi',
      'servizi digitali',
    ],
    0.74,
  ),
  engineering: createSemanticExpansion(
    [
      'technical infrastructure',
      'systems engineering',
      'engineering design',
      'infrastrutture tecniche',
      'progettazione tecnica',
    ],
    0.48,
  ),
  'industrial engineering': createSemanticExpansion(
    [
      'process optimization',
      'manufacturing systems',
      'supply chain',
      'industrial operations',
      'ingegneria industriale',
      'ottimizzazione dei processi',
    ],
    0.72,
  ),
  'civil engineering': createSemanticExpansion(
    [
      'public infrastructure',
      'roads and bridges',
      'structural safety',
      'construction works',
      'infrastrutture civili',
      'opere pubbliche',
    ],
    0.76,
  ),
  'electrical engineering': createSemanticExpansion(
    [
      'power systems',
      'electrical grid',
      'energy distribution',
      'electronics infrastructure',
      'rete elettrica',
      'sistemi elettrici',
    ],
    0.74,
  ),
  'mechanical engineering': createSemanticExpansion(
    [
      'mechanical systems',
      'machinery',
      'manufacturing equipment',
      'thermal systems',
      'impianti meccanici',
      'macchinari',
    ],
    0.7,
  ),
  'architecture and urban planning': createSemanticExpansion(
    [
      'urban regeneration',
      'public space',
      'spatial planning',
      'land use',
      'built environment',
      'urbanistica',
      'rigenerazione urbana',
      'quartieri',
      'territorio',
    ],
    0.84,
  ),
  education: createSemanticExpansion(
    [
      'learning systems',
      'education policy',
      'schools and universities',
      'student learning',
      'istruzione',
      'apprendimento',
      'scuola',
      'universita',
    ],
    0.44,
  ),
  'teaching and training': createSemanticExpansion(
    [
      'teacher development',
      'professional training',
      'instructional design',
      'classroom pedagogy',
      'formazione',
      'didattica',
    ],
    0.62,
  ),
  'social sciences': createSemanticExpansion(
    [
      'social inclusion',
      'community research',
      'social inequality',
      'societal analysis',
      'scienze sociali',
      'inclusione sociale',
    ],
    0.5,
  ),
  'political science': createSemanticExpansion(
    [
      'democratic institutions',
      'civic participation',
      'public governance',
      'electoral systems',
      'scienze politiche',
      'partecipazione civica',
    ],
    0.66,
  ),
  'public administration': createSemanticExpansion(
    [
      'municipal services',
      'local government',
      'administrative reform',
      'civic administration',
      'amministrazione pubblica',
      'servizi comunali',
      'comune',
    ],
    0.74,
  ),
  'international relations': createSemanticExpansion(
    [
      'international cooperation',
      'migration policy',
      'diplomatic relations',
      'european affairs',
      'relazioni internazionali',
      'cooperazione internazionale',
    ],
    0.66,
  ),
  law: createSemanticExpansion(
    [
      'legal framework',
      'regulatory compliance',
      'rights protection',
      'justice policy',
      'diritto',
      'normativa',
      'tutela dei diritti',
    ],
    0.72,
  ),
  'criminology and public safety': createSemanticExpansion(
    [
      'public safety',
      'crime prevention',
      'policing policy',
      'emergency response',
      'sicurezza pubblica',
      'prevenzione del crimine',
    ],
    0.76,
  ),
  healthcare: createSemanticExpansion(
    [
      'health services',
      'patient care',
      'clinical access',
      'care delivery',
      'sanita',
      'assistenza sanitaria',
    ],
    0.5,
  ),
  medicine: createSemanticExpansion(
    [
      'clinical treatment',
      'medical diagnosis',
      'hospital medicine',
      'medicina clinica',
      'diagnosi medica',
      'ospedale',
    ],
    0.76,
  ),
  nursing: createSemanticExpansion(
    [
      'nursing care',
      'patient assistance',
      'care coordination',
      'infermieristica',
      'assistenza ai pazienti',
    ],
    0.7,
  ),
  'public health': createSemanticExpansion(
    [
      'prevention policy',
      'epidemiology',
      'health promotion',
      'population health',
      'salute pubblica',
      'prevenzione sanitaria',
    ],
    0.74,
  ),
  psychology: createSemanticExpansion(
    [
      'mental health',
      'behavioural support',
      'counselling services',
      'psychological wellbeing',
      'salute mentale',
      'supporto psicologico',
    ],
    0.68,
  ),
  humanities: createSemanticExpansion(
    [
      'cultural heritage',
      'ethics and values',
      'literary culture',
      'humanistic studies',
      'patrimonio culturale',
      'studi umanistici',
    ],
    0.46,
  ),
  history: createSemanticExpansion(
    [
      'historical heritage',
      'archives and memory',
      'museum collections',
      'storia locale',
      'archivi storici',
    ],
    0.64,
  ),
  philosophy: createSemanticExpansion(
    [
      'ethical reflection',
      'moral reasoning',
      'public ethics',
      'filosofia morale',
      'etica pubblica',
    ],
    0.6,
  ),
  'languages and literature': createSemanticExpansion(
    [
      'language learning',
      'translation studies',
      'literary education',
      'multilingual communication',
      'lingue',
      'letteratura',
    ],
    0.62,
  ),
  'arts and design': createSemanticExpansion(
    [
      'visual design',
      'creative production',
      'cultural design',
      'arti visive',
      'design culturale',
    ],
    0.64,
  ),
  'media and journalism': createSemanticExpansion(
    [
      'news media',
      'journalistic reporting',
      'digital publishing',
      'public information',
      'giornalismo',
      'mezzi di comunicazione',
    ],
    0.66,
  ),
  'environment and sustainability': createSemanticExpansion(
    [
      'climate resilience',
      'green infrastructure',
      'energy transition',
      'biodiversity',
      'economia circolare',
      'sostenibilita',
      'ambiente',
      'clima',
    ],
    0.8,
  ),
  'agriculture and food': createSemanticExpansion(
    [
      'food systems',
      'agricultural production',
      'rural development',
      'agri food chain',
      'agricoltura',
      'filiera alimentare',
    ],
    0.72,
  ),
  'tourism and hospitality': createSemanticExpansion(
    [
      'visitor economy',
      'destination management',
      'hospitality services',
      'tourism strategy',
      'turismo',
      'ospitalita',
    ],
    0.68,
  ),
  'transport and mobility': createSemanticExpansion(
    [
      'public transit',
      'active mobility',
      'cycling infrastructure',
      'bus network',
      'tram service',
      'traffic management',
      'mobilita',
      'trasporto',
      'piste ciclabili',
      'autobus',
    ],
    0.82,
  ),
};

const FIELD_SEMANTIC_EXPANSIONS: Record<string, SemanticExpansion> = {
  ...ROLE_SEMANTIC_EXPANSIONS,
  ...BACKGROUND_SEMANTIC_EXPANSIONS,
};

function getAliasTokens(
  aliasPhrases: string[],
  baseTokens: string[],
): string[] {
  return toUniqueArray(
    aliasPhrases
      .flatMap((phrase) => getMeaningfulTokens(phrase, true))
      .filter(
        (token) =>
          !baseTokens.includes(token) &&
          !NON_DISCRIMINATIVE_ALIAS_TOKENS.has(token),
      ),
  );
}

function buildFieldSemanticProfile(
  fieldValue: string | null | undefined,
): FieldSemanticProfile | null {
  const normalizedField = normalizeValue(fieldValue);

  if (!normalizedField) {
    return null;
  }

  const tokens = getMeaningfulTokens(normalizedField, true);

  if (tokens.length === 0) {
    return null;
  }

  const roots = toUniqueArray(tokens.map(stemToken));
  const phrases = toUniqueArray([
    ...(tokens.length >= 2 ? [tokens.join(' ')] : []),
    ...buildPhrases(tokens),
  ]);
  const expansion = FIELD_SEMANTIC_EXPANSIONS[normalizedField];
  const aliasPhrases =
    expansion?.aliases.filter(
      (alias) => alias !== normalizedField && !phrases.includes(alias),
    ) ?? [];
  const aliasTokens = getAliasTokens(aliasPhrases, tokens);
  const aliasRoots = toUniqueArray(aliasTokens.map(stemToken)).filter(
    (root) => !roots.includes(root),
  );

  return {
    tokens,
    roots,
    phrases,
    aliasTokens,
    aliasRoots,
    aliasPhrases,
    specificity:
      expansion?.specificity ??
      round(clamp(0.42 + Math.min(tokens.length, 3) * 0.08, 0.42, 0.7), 2),
  };
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
    semanticPhraseWeight: 0,
    semanticRootCount: 0,
    semanticRootSignal: 0,
    semanticCoverage: 0,
    specificity: 0,
  };
}

function getFieldMatch(
  contextSignals: ConsultationContextSignals,
  fieldValue: string | null | undefined,
): FieldMatch {
  const profile = buildFieldSemanticProfile(fieldValue);

  if (!profile) {
    return getNoMatch();
  }

  let exactPhraseWeight = 0;

  for (const phrase of profile.phrases) {
    exactPhraseWeight = Math.max(
      exactPhraseWeight,
      contextSignals.phraseWeights.get(phrase) ?? 0,
    );
  }

  let matchedRootCount = 0;
  let matchedRootSignal = 0;
  let strongestSourceWeight = 0;

  for (const fieldRoot of profile.roots) {
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
    profile.roots.length > 0 ? matchedRootCount / profile.roots.length : 0;

  let semanticPhraseWeight = 0;

  for (const aliasPhrase of profile.aliasPhrases) {
    semanticPhraseWeight = Math.max(
      semanticPhraseWeight,
      (contextSignals.phraseWeights.get(aliasPhrase) ?? 0) * 0.88,
    );
  }

  let semanticRootCount = 0;
  let semanticRootSignal = 0;

  for (const aliasRoot of profile.aliasRoots) {
    let bestRootSignal = 0;
    let bestSourceWeight = 0;

    for (const [contextRoot, contextSignal] of contextSignals.rootWeights) {
      const relation = getRootRelation(aliasRoot, contextRoot);

      if (relation === 0) {
        continue;
      }

      const adjustedSignal = contextSignal * relation * 0.82;
      const adjustedSourceWeight =
        (contextSignals.rootStrongestSource.get(contextRoot) ?? 0) *
        relation *
        0.9;

      if (adjustedSignal > bestRootSignal) {
        bestRootSignal = adjustedSignal;
        bestSourceWeight = adjustedSourceWeight;
      }
    }

    if (bestRootSignal > 0) {
      semanticRootCount += 1;
      semanticRootSignal += Math.min(bestRootSignal, 1.05);
      strongestSourceWeight = Math.max(strongestSourceWeight, bestSourceWeight);
    }
  }

  const semanticCoverage =
    profile.aliasRoots.length > 0
      ? semanticRootCount / profile.aliasRoots.length
      : 0;

  let kind: FieldMatchKind = 'none';

  if (
    exactPhraseWeight >= 0.72 ||
    matchedRootSignal >= 1.45 ||
    semanticPhraseWeight >= 0.64 ||
    semanticRootSignal >= 1.12 ||
    (matchedRootCount >= 2 &&
      coverage >= 0.5 &&
      strongestSourceWeight >= 0.72) ||
    (semanticRootCount >= 2 &&
      semanticCoverage >= 0.4 &&
      strongestSourceWeight >= 0.72) ||
    (exactPhraseWeight >= 0.38 && matchedRootSignal >= 0.78) ||
    (semanticPhraseWeight >= 0.28 && semanticRootSignal >= 0.52)
  ) {
    kind = 'strong';
  } else if (
    exactPhraseWeight > 0 ||
    matchedRootCount > 0 ||
    semanticPhraseWeight > 0 ||
    semanticRootCount > 0
  ) {
    kind = 'partial';
  }

  const strength = clamp(
    exactPhraseWeight * 0.24 +
      matchedRootSignal * 0.18 +
      coverage * 0.26 +
      strongestSourceWeight * 0.12 +
      semanticPhraseWeight * 0.12 +
      semanticRootSignal * 0.05 +
      semanticCoverage * 0.03,
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
    semanticPhraseWeight: round(semanticPhraseWeight),
    semanticRootCount,
    semanticRootSignal: round(semanticRootSignal),
    semanticCoverage: round(semanticCoverage),
    specificity: profile.specificity,
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
    match.semanticPhraseWeight >= 0.64 ||
    match.matchedRootCount >= 2 ||
    match.matchedRootSignal >= 1.45 ||
    match.semanticRootSignal >= 1.12
  ) {
    applicability = 1;
  } else if (
    match.exactPhraseWeight >= 0.38 ||
    match.semanticPhraseWeight >= 0.28 ||
    (match.matchedRootCount >= 1 && match.strongestSourceWeight >= 0.72) ||
    (match.semanticRootCount >= 1 && match.strongestSourceWeight >= 0.72)
  ) {
    applicability = 0.35 + Math.min(match.strength * 0.15, 0.15);
  }

  if (applicability > 0) {
    const specificityFactor =
      (match.kind === 'strong' ? 0.72 : 0.58) +
      match.specificity * (match.kind === 'strong' ? 0.28 : 0.42);

    applicability = clamp(
      applicability * specificityFactor +
        (match.kind === 'strong' && match.specificity >= 0.75 ? 0.05 : 0),
      0,
      1,
    );
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

  let penalty = 0.16;

  if (stakeholderRoleMatch.kind === 'none') {
    penalty += 0.18;
  } else if (stakeholderRoleMatch.kind === 'partial') {
    penalty += 0.04;
  }

  if (
    !backgroundInfluence.active ||
    backgroundInfluence.match.kind === 'none'
  ) {
    penalty += 0.12;
  } else if (!backgroundInfluence.stronglyActive) {
    penalty += 0.03;
  }

  return (
    1 -
    penalty +
    stakeholderRoleContribution * 0.22 +
    backgroundContribution * 0.22
  );
}

function getExperienceLevelScore(
  experienceLevel: string | null | undefined,
): number {
  switch (normalizeValue(experienceLevel)) {
    case 'expert':
      return 0.92;
    case 'advanced':
      return 0.72;
    case 'intermediate':
      return 0.44;
    case 'beginner':
      return 0.08;
    default:
      return 0;
  }
}

function getYearsOfExperienceScore(
  yearsOfExperience: number | null | undefined,
): number {
  const years = clamp(Math.trunc(yearsOfExperience ?? 0), 0, 60);

  if (years <= 0) {
    return 0;
  }

  return round(clamp(1 - Math.exp(-years / 7), 0, 1));
}

function getExpertiseDepthScore(
  experienceLevel: string | null | undefined,
  yearsOfExperience: number | null | undefined,
): number {
  const experienceLevelScore = getExperienceLevelScore(experienceLevel);
  const yearsScore = getYearsOfExperienceScore(yearsOfExperience);

  if (experienceLevelScore === 0 && yearsScore === 0) {
    return 0;
  }

  let consistencyAdjustment = 0;

  if (experienceLevelScore >= 0.72 && yearsScore >= 0.72) {
    consistencyAdjustment = 0.04;
  } else if (experienceLevelScore >= 0.9 && yearsScore < 0.08) {
    consistencyAdjustment = -0.02;
  }

  return round(
    clamp(
      experienceLevelScore * 0.45 + yearsScore * 0.55 + consistencyAdjustment,
      0,
      1,
    ),
  );
}

function getStudyLevelScore(studyLevel: string | null | undefined): number {
  switch (normalizeValue(studyLevel)) {
    case 'post doctorate':
      return 0.94;
    case 'doctorate':
      return 0.84;
    case 'master degree':
      return 0.68;
    case 'bachelor degree':
      return 0.52;
    case 'vocational certification':
      return 0.34;
    case 'secondary education':
      return 0.18;
    case 'no formal study':
      return 0.08;
    case 'other':
      return 0.28;
    case 'prefer not to say':
      return 0.16;
    default:
      return 0;
  }
}

function getExperienceAdjustment(
  relevanceLevel: RelevanceLevel,
  stakeholderRoleMatch: FieldMatch,
  backgroundInfluence: BackgroundInfluence,
  experienceLevel: string | null | undefined,
  yearsOfExperience: number | null | undefined,
): number {
  if (relevanceLevel === 'weak') {
    return 0;
  }

  const expertiseDepthScore = getExpertiseDepthScore(
    experienceLevel,
    yearsOfExperience,
  );

  if (expertiseDepthScore === 0) {
    return 0;
  }

  const applicability = clamp(
    stakeholderRoleMatch.strength * 0.45 +
      backgroundInfluence.applicability * 0.4 +
      (relevanceLevel === 'strong' ? 0.2 : 0.08),
    relevanceLevel === 'strong' ? 0.3 : 0.12,
    1,
  );

  const cap = relevanceLevel === 'strong' ? 0.11 : 0.045;

  return round(cap * expertiseDepthScore * applicability);
}

function getStudyLevelAdjustment(
  relevanceLevel: RelevanceLevel,
  stakeholderRoleMatch: FieldMatch,
  backgroundInfluence: BackgroundInfluence,
  studyLevel: string | null | undefined,
): number {
  if (relevanceLevel === 'weak') {
    return 0;
  }

  const studyLevelScore = getStudyLevelScore(studyLevel);

  if (studyLevelScore === 0) {
    return 0;
  }

  const applicability = clamp(
    backgroundInfluence.applicability * 0.75 +
      backgroundInfluence.match.strength * 0.15 +
      stakeholderRoleMatch.strength * 0.1,
    0,
    1,
  );

  if (applicability < 0.2) {
    return 0;
  }

  const cap = relevanceLevel === 'strong' ? 0.07 : 0.026;
  return round(cap * studyLevelScore * applicability);
}

function getSignalResolutionAdjustment(
  relevanceLevel: RelevanceLevel,
  stakeholderRoleMatch: FieldMatch,
  backgroundInfluence: BackgroundInfluence,
): number {
  const combinedStrength =
    stakeholderRoleMatch.strength * 0.58 +
    backgroundInfluence.match.strength * 0.42;

  if (relevanceLevel === 'strong') {
    return round((combinedStrength - 0.55) * 0.05);
  }

  if (relevanceLevel === 'partial') {
    return round((combinedStrength - 0.35) * 0.03);
  }

  return round((combinedStrength - 0.15) * 0.02);
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

  weight += getSignalResolutionAdjustment(
    relevanceLevel,
    stakeholderRoleMatch,
    backgroundInfluence,
  );
  weight += getExperienceAdjustment(
    relevanceLevel,
    stakeholderRoleMatch,
    backgroundInfluence,
    assessment.experienceLevel,
    assessment.yearsOfExperience,
  );
  weight += getStudyLevelAdjustment(
    relevanceLevel,
    stakeholderRoleMatch,
    backgroundInfluence,
    assessment.studyLevel,
  );
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
      input.selfAssessmentScore < MIN_SELF_ASSESSMENT_SCORE ||
      input.selfAssessmentScore > MAX_SELF_ASSESSMENT_SCORE
    ) {
      throw new Error(
        `A valid selfAssessmentScore between ${MIN_SELF_ASSESSMENT_SCORE} and ${MAX_SELF_ASSESSMENT_SCORE} is required`,
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
