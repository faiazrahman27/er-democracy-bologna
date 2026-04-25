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
  'communication',
  'coordination',
  'care',
  'community',
  'communities',
  'decision',
  'decisions',
  'delivery',
  'design',
  'development',
  'digital',
  'enterprise',
  'evidence',
  'financial',
  'general',
  'governance',
  'initiative',
  'initiatives',
  'innovation',
  'infrastructure',
  'local',
  'management',
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
  'research',
  'review',
  'reviews',
  'security',
  'service',
  'services',
  'strategy',
  'support',
  'system',
  'systems',
  'training',
  'transformation',
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
      'campus facilities',
      'lecture halls',
      'library services',
      'course scheduling',
      'exam scheduling',
      'study spaces',
      'tutorial services',
      'student wellbeing',
      'student counselling',
      'student representation',
      'teaching quality',
      'academic support',
      'higher education',
      'scholarship services',
      'borse di studio',
      'didattica universitaria',
      'diritto allo studio',
      'aule studio',
      'segreterie studenti',
      'servizi agli studenti',
      'vita universitaria',
      'ateneo',
      'universita',
      'student services office',
      'academic advising',
      'course registration',
      'degree planning',
      'semester workload',
      'exam preparation',
      'student mobility',
      'international student support',
      'student visa support',
      'campus administration',
      'university library',
      'research seminars',
      'laboratory courses',
      'student feedback',
      'academic appeals',
      'student mental health',
    ],
    0.64,
  ),
  'school student': createSemanticExpansion(
    [
      'school life',
      'classroom learning',
      'school curriculum',
      'secondary education',
      'school timetable',
      'school transport',
      'after school programmes',
      'student guidance',
      'canteen services',
      'didattica scolastica',
      'orientamento scolastico',
      'mensa scolastica',
      'vita scolastica',
      'scuola',
      'school attendance',
      'homework workload',
      'classroom safety',
      'school discipline',
      'school counselling',
      'school inclusion',
      'special education support',
      'school digital platform',
      'learning materials',
      'textbooks',
      'school exams',
      'school facilities',
      'school playground',
      'school sports',
      'school lunch',
      'school health services',
      'student bullying prevention',
      'school mental health',
      'school teacher feedback',
      'parent teacher communication',
      'school bus routes',
      'safe routes to school',
      'youth participation',
      'student voice',
      'primary education',
      'middle school education',
      'high school education',
      'school accessibility',
    ],
    0.58,
  ),
  'business owner': createSemanticExpansion(
    [
      'local business',
      'commercial activity',
      'business development',
      'small enterprise',
      'local retail',
      'merchant services',
      'main street commerce',
      'commercial permits',
      'neighborhood shops',
      'attivita commerciali',
      'commercio locale',
      'negozi di vicinato',
      'impresa',
      'business licensing',
      'business tax burden',
      'commercial rent',
      'shopfront access',
      'local supply chain',
      'customer foot traffic',
      'business continuity planning',
      'commercial waste collection',
      'retail opening hours',
      'business district',
      'local market regulation',
      'business permits',
      'small business finance',
      'merchant payments',
      'digital payments',
      'business insurance',
      'customer data management',
      'business cybersecurity',
      'commercial parking',
      'delivery logistics',
      'supplier contracts',
      'consumer protection compliance',
      'employment costs',
      'workforce hiring',
      'business resilience',
      'local procurement',
      'business advisory services',
      'chamber of commerce',
      'business association',
    ],
    0.62,
  ),
  entrepreneur: createSemanticExpansion(
    [
      'startup ecosystem',
      'venture creation',
      'innovation hub',
      'business incubation',
      'startup financing',
      'accelerator programmes',
      'new venture growth',
      'innovation ecosystem',
      'accelerazione d impresa',
      'ecosistema startup',
      'impresa innovativa',
      'nuove imprese',
      'imprenditoria',
      'founder support',
      'startup mentoring',
      'seed funding',
      'early stage venture',
      'venture capital',
      'angel investment',
      'startup grants',
      'product market fit',
      'business model validation',
      'innovation financing',
      'startup legal support',
      'startup hiring',
      'founder network',
      'scale up support',
      'technology commercialization',
      'intellectual property strategy',
      'startup acceleration',
      'business innovation lab',
      'new product development',
      'market entry strategy',
      'startup procurement',
      'digital entrepreneurship',
      'social entrepreneurship',
      'green entrepreneurship',
      'startup ecosystem governance',
      'entrepreneurial training',
      'pitch competitions',
      'prototype development',
      'minimum viable product',
    ],
    0.68,
  ),
  'private sector employee': createSemanticExpansion(
    [
      'workplace conditions',
      'company workforce',
      'industry employment',
      'employee commuting',
      'workforce development',
      'occupational safety',
      'company operations',
      'shift work',
      'pendolarismo lavorativo',
      'sicurezza sul lavoro',
      'settore privato',
      'corporate work',
      'employee rights',
      'workplace policy',
      'employee benefits',
      'remote work',
      'hybrid work',
      'workplace flexibility',
      'work life balance',
      'shift scheduling',
      'overtime rules',
      'career development',
      'skills upgrading',
      'corporate training',
      'workplace mental health',
      'occupational health',
      'workplace safety compliance',
      'employment contract',
      'payroll systems',
      'performance review',
      'team communication',
      'workforce planning',
      'employee data privacy',
      'human resources systems',
      'corporate cybersecurity',
      'internal communications',
      'office commuting',
      'industrial relations',
      'employee representation',
      'workforce digital tools',
      'professional development',
      'job security',
    ],
    0.56,
  ),
  'public sector employee': createSemanticExpansion(
    [
      'municipal staff',
      'public administration',
      'local government operations',
      'public service delivery',
      'administrative offices',
      'municipal workforce',
      'service counters',
      'public agency operations',
      'enti pubblici',
      'sportelli pubblici',
      'servizi pubblici',
      'amministrazione comunale',
      'public records',
      'records access',
      'administrative data access',
      'public information handling',
      'public service coordination',
      'public sector data governance',
      'cross agency coordination',
      'public sector compliance',
      'citizen service records',
      'government service delivery',
      'public office workflow',
      'public records management',
      'public data protection',
      'service access authorization',
      'public accountability',
      'restricted information handling',
      'case management system',
      'public sector digital service',
      'identity verification',
      'service request handling',
      'public complaints handling',
      'administrative case files',
      'official documentation',
      'public counter services',
      'government data sharing',
      'public sector privacy',
      'data retention rules',
      'public service accountability',
      'administrative transparency',
      'interdepartmental coordination',
      'public sector cybersecurity',
      'access control workflow',
      'public service continuity',
    ],
    0.66,
  ),
  freelancer: createSemanticExpansion(
    [
      'independent professionals',
      'freelance work',
      'creative freelancing',
      'client work',
      'independent consulting',
      'project based work',
      'portfolio careers',
      'partita iva',
      'coworking',
      'liberi professionisti',
      'independent contractor',
      'client acquisition',
      'freelance contracts',
      'invoice management',
      'tax reporting',
      'portfolio management',
      'coworking spaces',
      'remote work tools',
      'digital collaboration',
      'freelance marketplace',
      'project proposals',
      'creative services',
      'consulting services',
      'professional liability',
      'client data privacy',
      'self employment taxation',
      'freelance income stability',
      'business registration',
      'contract negotiation',
      'payment delays',
      'workload planning',
      'solo professional',
      'independent work platform',
      'freelance cybersecurity',
      'home office work',
      'flexible employment',
      'gig economy',
      'digital nomad work',
      'micro business operations',
      'professional services',
      'service pricing',
      'client communication',
    ],
    0.56,
  ),
  'self employed': createSemanticExpansion(
    [
      'self employed workers',
      'independent business',
      'small enterprise',
      'micro enterprise',
      'professional practice',
      'independent trade',
      'self employment support',
      'attivita autonoma',
      'lavoro autonomo',
      'lavoratori autonomi',
      'sole proprietorship',
      'micro business management',
      'self employment income',
      'independent trade services',
      'professional license',
      'tax compliance',
      'business expenses',
      'service delivery',
      'client management',
      'small contractor',
      'individual enterprise',
      'self employed insurance',
      'self employed pension',
      'trade registration',
      'work vehicle access',
      'business continuity',
      'customer appointment scheduling',
      'data protection for clients',
      'payment processing',
      'local service provider',
      'home based business',
      'professional bookkeeping',
      'independent sales',
      'self employed health coverage',
      'small service business',
      'business administration',
      'supplier coordination',
      'self employed training',
      'professional tools',
      'risk management for small operators',
    ],
    0.58,
  ),
  researcher: createSemanticExpansion(
    [
      'scientific research',
      'evidence synthesis',
      'data collection',
      'laboratory work',
      'applied research',
      'research methodology',
      'research evaluation',
      'survey research',
      'peer review',
      'field studies',
      'research protocols',
      'research design',
      'academic publishing',
      'metodologia della ricerca',
      'protocolli di ricerca',
      'pubblicazioni scientifiche',
      'valutazione della ricerca',
      'ricerca scientifica',
      'ricerca accademica',
      'research ethics',
      'research data management',
      'data stewardship',
      'literature review',
      'evidence review',
      'scientific evidence',
      'clinical research',
      'health services research',
      'policy research',
      'quantitative research',
      'qualitative research',
      'mixed methods research',
      'statistical analysis',
      'survey design',
      'interview protocols',
      'research consent',
      'institutional review',
      'ethics approval',
      'human subjects research',
      'data anonymization',
      'data sharing agreements',
      'research reproducibility',
      'open science',
      'evidence based policy',
      'impact evaluation',
      'programme evaluation',
      'experimental design',
      'observational study',
      'longitudinal study',
      'field research',
      'research grant',
    ],
    0.72,
  ),
  academic: createSemanticExpansion(
    [
      'faculty governance',
      'higher education policy',
      'university operations',
      'academic services',
      'degree programmes',
      'curriculum governance',
      'teaching quality assurance',
      'course accreditation',
      'faculty senate',
      'department governance',
      'research supervision',
      'course delivery',
      'programmi di studio',
      'coordinamento dei corsi',
      'didattica universitaria',
      'governo accademico',
      'senato accademico',
      'universita',
      'university governance',
      'academic committee',
      'research ethics board',
      'faculty research',
      'teaching committee',
      'academic standards',
      'degree accreditation',
      'course approval',
      'academic quality assurance',
      'student assessment policy',
      'faculty administration',
      'department strategy',
      'university research office',
      'academic data governance',
      'learning analytics',
      'student records',
      'academic integrity',
      'plagiarism policy',
      'research governance',
      'doctoral supervision',
      'master thesis supervision',
      'academic mentoring',
      'scholarly communication',
      'university public engagement',
    ],
    0.68,
  ),
  teacher: createSemanticExpansion(
    [
      'teacher training',
      'classroom practice',
      'curriculum design',
      'school pedagogy',
      'student assessment',
      'lesson planning',
      'school inclusion',
      'learning pathways',
      'classroom management',
      'formazione docenti',
      'insegnamento',
      'orientamento didattico',
      'valutazione degli studenti',
      'lesson delivery',
      'student learning needs',
      'formative assessment',
      'summative assessment',
      'classroom inclusion',
      'special needs education',
      'student safeguarding',
      'school communication',
      'parent engagement',
      'teaching materials',
      'learning objectives',
      'education technology',
      'digital classroom',
      'student records',
      'school data privacy',
      'teacher workload',
      'teacher professional development',
      'curriculum implementation',
      'student behavior support',
      'learning assessment',
      'education accessibility',
      'student progress monitoring',
      'classroom wellbeing',
      'school policy implementation',
      'youth guidance',
      'teacher collaboration',
      'pedagogical methods',
      'teaching standards',
      'school improvement',
    ],
    0.66,
  ),
  'ngo member': createSemanticExpansion(
    [
      'nonprofit services',
      'civic organizations',
      'community advocacy',
      'social impact programmes',
      'nonprofit partnerships',
      'humanitarian aid',
      'community outreach',
      'advocacy campaigns',
      'associazionismo civico',
      'cooperazione sociale',
      'terzo settore',
      'organizzazioni civiche',
      'civil society advocacy',
      'community programmes',
      'beneficiary support',
      'social service delivery',
      'human rights advocacy',
      'public interest campaign',
      'community needs assessment',
      'nonprofit governance',
      'charity operations',
      'voluntary sector',
      'donor reporting',
      'grant management',
      'service users',
      'vulnerable groups support',
      'community trust building',
      'grassroots organizing',
      'social inclusion projects',
      'nonprofit data protection',
      'case work support',
      'community partnership',
      'social innovation',
      'civic engagement campaign',
      'public consultation outreach',
      'community mediation',
      'rights based services',
      'advocacy research',
    ],
    0.6,
  ),
  volunteer: createSemanticExpansion(
    [
      'community volunteering',
      'mutual aid',
      'civic support',
      'community assistance',
      'food distribution',
      'emergency volunteering',
      'neighborhood mutual aid',
      'aiuto di prossimita',
      'volontariato',
      'volontariato civico',
      'supporto civico',
      'volunteer coordination',
      'volunteer training',
      'community relief',
      'emergency assistance',
      'first aid support',
      'food bank support',
      'charity support',
      'event volunteering',
      'civil protection support',
      'mutual aid network',
      'community response',
      'volunteer registry',
      'vulnerable residents support',
      'neighborhood assistance',
      'public event support',
      'social care volunteering',
      'hospital volunteering',
      'patient support volunteering',
      'disaster response volunteering',
      'community safety volunteering',
      'volunteer communication',
      'volunteer scheduling',
      'service outreach',
      'volunteer safeguarding',
    ],
    0.54,
  ),
  'civil servant': createSemanticExpansion(
    [
      'public office',
      'municipal administration',
      'administrative procedure',
      'permit processing',
      'administrative enforcement',
      'municipal regulation',
      'public records',
      'records management',
      'service counters',
      'public registry',
      'administrative acts',
      'sportello unico',
      'sportello comunale',
      'atti amministrativi',
      'procedimenti amministrativi',
      'attuazione amministrativa',
      'servizi comunali',
      'ufficio pubblico',
      'comune',
      'case records',
      'restricted records access',
      'public data handling',
      'administrative data sharing',
      'records confidentiality',
      'document access control',
      'public information governance',
      'official records workflow',
      'case file processing',
      'identity verification',
      'access authorization',
      'audit logs',
      'record access request',
      'service eligibility verification',
      'confidential case files',
      'citizen registry',
      'civil registry',
      'administrative case management',
      'public service records',
      'government records retention',
      'administrative transparency',
      'official correspondence',
      'document verification',
      'data disclosure request',
      'public sector privacy compliance',
      'legal basis review',
      'public decision file',
      'administrative accountability',
      'permit records',
      'licensing records',
      'inspection records',
    ],
    0.7,
  ),
  'policy maker': createSemanticExpansion(
    [
      'policy design',
      'regulatory framework',
      'strategic governance',
      'public decision making',
      'policy implementation',
      'institutional coordination',
      'preparedness planning',
      'response governance',
      'regulatory strategy',
      'legislative agenda',
      'programme steering',
      'policy oversight',
      'institutional reform',
      'indirizzo politico',
      'programmazione strategica',
      'coordinamento istituzionale',
      'attuazione delle politiche',
      'definizione delle politiche',
      'governance pubblica',
      'health policy',
      'health data policy',
      'emergency care policy',
      'patient safety policy',
      'privacy policy',
      'data sharing policy',
      'medical records policy',
      'cross provider governance',
      'interoperability policy',
      'public health governance',
      'clinical governance',
      'consent policy',
      'data protection policy',
      'access control policy',
      'audit policy',
      'regulatory safeguards',
      'institutional accountability',
      'emergency access rules',
      'healthcare interoperability rules',
      'medical information governance',
      'privacy safeguards policy',
      'patient data access policy',
      'risk based regulation',
      'evidence based regulation',
      'implementation roadmap',
      'public value assessment',
      'stakeholder consultation design',
      'policy trade off analysis',
      'regulatory impact assessment',
      'emergency preparedness policy',
      'healthcare interoperability governance',
      'national health strategy',
      'local health strategy',
      'digital health regulation',
      'patient rights policy',
      'cybersecurity policy',
    ],
    0.74,
  ),
  'healthcare worker': createSemanticExpansion(
    [
      'patient care',
      'hospital services',
      'clinical operations',
      'health services',
      'emergency triage',
      'frontline care',
      'hospital coordination',
      'clinical pathways',
      'care continuity',
      'triage',
      'ward operations',
      'outpatient care',
      'hospital staffing',
      'assistenza clinica',
      'reparti ospedalieri',
      'pronto soccorso',
      'coordinamento ospedaliero',
      'assistenza sanitaria',
      'ospedale',
      'emergency department',
      'urgent care',
      'emergency care',
      'patient records',
      'medical records',
      'patient history',
      'clinical notes',
      'medication history',
      'allergy information',
      'chronic conditions',
      'critical lab results',
      'clinical handover',
      'care handoff',
      'emergency treatment decisions',
      'patient safety',
      'clinical safety',
      'bedside care',
      'care coordination',
      'doctor nurse communication',
      'healthcare provider coordination',
      'hospital information access',
      'electronic health records',
      'health records access',
      'emergency medical access',
      'clinical accountability',
      'urgent treatment workflow',
      'emergency room workflow',
      'patient chart access',
      'medical chart review',
      'care team coordination',
      'triage assessment',
      'vital signs review',
      'patient chart',
      'hospital chart',
      'treatment plan',
      'clinical documentation',
      'patient consent',
      'medical confidentiality',
      'care team communication',
      'patient identification',
      'emergency responder handoff',
      'ambulance handover',
      'hospital admission workflow',
      'discharge summary',
      'clinical decision making',
      'acute care pathway',
    ],
    0.7,
  ),
  'legal professional': createSemanticExpansion(
    [
      'legal compliance',
      'justice system',
      'rights protection',
      'regulatory interpretation',
      'administrative law',
      'municipal regulation',
      'ordinance compliance',
      'regulatory enforcement',
      'statutory obligations',
      'licensing compliance',
      'administrative appeals',
      'public procurement law',
      'contract compliance',
      'appalti pubblici',
      'diritto amministrativo',
      'ricorsi amministrativi',
      'regolamenti comunali',
      'conformita normativa',
      'normativa',
      'giustizia',
      'healthcare law',
      'medical law',
      'privacy law',
      'data protection law',
      'patient rights',
      'patient consent',
      'informed consent',
      'emergency consent exception',
      'confidentiality rules',
      'medical confidentiality',
      'legal basis for access',
      'lawful data sharing',
      'records disclosure',
      'access authorization',
      'audit requirements',
      'liability risk',
      'professional accountability',
      'regulatory safeguards',
      'compliance review',
      'data minimization',
      'purpose limitation',
      'patient data rights',
      'health data disclosure',
      'health records compliance',
      'privacy impact assessment',
      'health records disclosure',
      'patient information access',
      'emergency access legality',
      'clinical liability',
      'medical negligence risk',
      'data processing agreement',
      'cross provider agreement',
      'statutory authorization',
      'lawful emergency exception',
      'records retention law',
    ],
    0.72,
  ),
  'creative professional': createSemanticExpansion(
    [
      'creative industries',
      'visual communication',
      'cultural production',
      'design practice',
      'graphic design',
      'audiovisual production',
      'creative direction',
      'exhibition design',
      'comunicazione visiva',
      'industrie culturali',
      'produzione audiovisiva',
      'progettazione creativa',
      'creative campaign',
      'public awareness design',
      'service communication design',
      'user experience design',
      'visual identity',
      'design research',
      'communication materials',
      'public information design',
      'accessibility design',
      'wayfinding design',
      'health communication design',
      'civic poster design',
      'digital content design',
      'community storytelling',
      'creative strategy',
      'information architecture',
      'content production',
      'video production',
      'visual campaign',
      'campaign messaging',
      'design systems',
      'user interface design',
      'human centered design',
      'experience mapping',
      'public service design',
      'service blueprint',
      'design facilitation',
      'community arts programme',
      'cultural communication',
      'media production workflow',
    ],
    0.62,
  ),
  unemployed: createSemanticExpansion(
    [
      'employment services',
      'job training',
      'labour market support',
      'workforce transition',
      'job placement',
      'reskilling programmes',
      'career counselling',
      'employability services',
      'orientamento al lavoro',
      'ricollocazione',
      'servizi per il lavoro',
      'job search support',
      'employment centre',
      'skills assessment',
      'vocational retraining',
      'career transition',
      'income support',
      'employment benefits',
      'job readiness',
      'interview preparation',
      'cv support',
      'digital job application',
      'labour activation',
      'training access',
      'employment barriers',
      'work placement',
      'apprenticeship access',
      'upskilling support',
      'reskilling pathways',
      'career guidance',
      'workforce reintegration',
      'public employment services',
      'job matching',
      'unemployment support',
      'social assistance',
    ],
    0.48,
  ),
  retired: createSemanticExpansion(
    [
      'senior services',
      'ageing policy',
      'elder care',
      'pension systems',
      'active ageing',
      'senior mobility',
      'community centres',
      'pensioner services',
      'centri anziani',
      'invecchiamento attivo',
      'servizi per anziani',
      'pensione',
      'elderly services',
      'senior care',
      'age friendly services',
      'retirement income',
      'pension access',
      'senior health',
      'home care',
      'community care',
      'social isolation prevention',
      'accessible transport for seniors',
      'senior digital inclusion',
      'retired residents',
      'older adults participation',
      'long term care',
      'elder abuse prevention',
      'senior housing',
      'aging population',
      'active senior programmes',
      'senior recreation',
      'healthcare access for seniors',
      'medication management for seniors',
      'caregiver support',
      'senior safety',
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
      'business operations',
      'operations management',
      'business continuity',
      'commercial management',
      'gestione operativa',
      'governance aziendale',
      'gestione aziendale',
      'sviluppo d impresa',
      'strategic planning',
      'organizational strategy',
      'change management',
      'risk management',
      'process management',
      'service management',
      'stakeholder management',
      'project portfolio management',
      'business process redesign',
      'operational governance',
      'performance indicators',
      'resource allocation',
      'service quality management',
      'customer relationship management',
      'business analytics',
      'organizational resilience',
      'continuity planning',
      'management controls',
      'governance framework',
      'business case development',
      'implementation management',
      'programme delivery',
      'operations strategy',
      'organizational policy',
      'workflow optimization',
      'service design management',
      'capacity planning',
      'enterprise risk',
    ],
    0.46,
  ),
  'economics and finance': createSemanticExpansion(
    [
      'economic policy',
      'public budget',
      'financial planning',
      'investment strategy',
      'cost benefit analysis',
      'fiscal policy',
      'economic impact assessment',
      'budget forecasting',
      'analisi economica',
      'economia',
      'finanza',
      'bilancio',
      'politica fiscale',
      'spesa pubblica',
      'economic modelling',
      'financial risk',
      'public finance',
      'cost effectiveness',
      'budget allocation',
      'funding model',
      'capital investment',
      'operating cost',
      'cost control',
      'cost recovery',
      'financial sustainability',
      'economic evaluation',
      'return on investment',
      'fiscal impact',
      'financial governance',
      'public expenditure',
      'health economics',
      'welfare economics',
      'labour economics',
      'urban economics',
      'transport economics',
      'environmental economics',
      'financial regulation',
      'risk pricing',
      'insurance costs',
      'financial accountability',
      'budgetary impact',
      'cost sharing',
    ],
    0.62,
  ),
  'accounting and auditing': createSemanticExpansion(
    [
      'financial reporting',
      'audit controls',
      'regulatory audit',
      'bookkeeping',
      'internal controls',
      'expense reporting',
      'audit trail',
      'financial compliance',
      'contabilita',
      'audit interno',
      'controllo di gestione',
      'revisione contabile',
      'audit evidence',
      'compliance audit',
      'financial audit',
      'operational audit',
      'internal audit programme',
      'risk based audit',
      'controls testing',
      'access audit',
      'audit logging',
      'audit documentation',
      'financial controls',
      'segregation of duties',
      'control environment',
      'audit findings',
      'audit report',
      'control weakness',
      'fraud risk',
      'records reconciliation',
      'compliance monitoring',
      'assurance review',
      'governance controls',
      'financial accountability',
      'expenditure controls',
      'procurement audit',
      'grant audit',
      'public sector audit',
      'system audit',
      'data access audit',
      'privacy audit',
      'cybersecurity audit',
    ],
    0.7,
  ),
  'marketing and communication': createSemanticExpansion(
    [
      'public communication',
      'brand strategy',
      'outreach campaign',
      'stakeholder communication',
      'audience engagement',
      'content strategy',
      'campaign planning',
      'institutional communication',
      'brand positioning',
      'campagne informative',
      'marketing territoriale',
      'comunicazione pubblica',
      'comunicazione istituzionale',
      'public engagement',
      'public awareness',
      'communication strategy',
      'campaign evaluation',
      'risk communication',
      'crisis communication',
      'health communication',
      'digital communication',
      'community outreach',
      'audience research',
      'message testing',
      'stakeholder engagement',
      'social media communication',
      'media relations',
      'press communication',
      'information campaign',
      'behavior change communication',
      'citizen communication',
      'public consultation communication',
      'plain language communication',
      'accessibility communication',
      'multichannel communication',
      'public trust messaging',
      'campaign analytics',
      'user engagement',
      'content planning',
      'service communication',
    ],
    0.58,
  ),
  'entrepreneurship and innovation': createSemanticExpansion(
    [
      'startup ecosystem',
      'innovation policy',
      'venture creation',
      'business incubation',
      'innovation ecosystem',
      'accelerator programmes',
      'venture building',
      'startup support',
      'technology transfer',
      'ecosistema innovazione',
      'innovazione',
      'startup',
      'trasferimento tecnologico',
      'innovation strategy',
      'business model innovation',
      'social innovation',
      'public sector innovation',
      'digital innovation',
      'product innovation',
      'service innovation',
      'innovation management',
      'innovation lab',
      'prototype testing',
      'pilot programme',
      'innovation procurement',
      'open innovation',
      'research commercialization',
      'technology adoption',
      'emerging technology',
      'startup policy',
      'entrepreneurial ecosystem',
      'market validation',
      'scale up strategy',
      'venture development',
      'innovation funding',
      'innovation governance',
      'design thinking',
      'rapid experimentation',
      'innovation risk',
      'new service model',
      'digital platform innovation',
      'innovation readiness',
    ],
    0.68,
  ),
  'computer science': createSemanticExpansion(
    [
      'computing systems',
      'algorithms',
      'software platforms',
      'informatics',
      'distributed systems',
      'database systems',
      'computational methods',
      'programming languages',
      'basi di dati',
      'informatica',
      'programmazione',
      'sistemi digitali',
      'health data systems',
      'medical record systems',
      'secure databases',
      'distributed records',
      'identity systems',
      'access control systems',
      'data exchange protocols',
      'system interoperability',
      'clinical software systems',
      'secure application design',
      'software algorithms',
      'data structures',
      'operating systems',
      'computer networks',
      'database design',
      'information retrieval',
      'distributed computing',
      'cloud computing',
      'human computer interaction',
      'software security',
      'privacy preserving computing',
      'cryptography',
      'systems design',
      'data processing',
      'computational infrastructure',
      'web systems',
      'api systems',
      'data management systems',
      'machine learning systems',
      'natural language systems',
      'computer vision systems',
      'real time systems',
      'embedded systems',
      'scalable systems',
      'network protocols',
      'system architecture',
      'software reliability',
      'program verification',
    ],
    0.7,
  ),
  'software engineering': createSemanticExpansion(
    [
      'software architecture',
      'application platform',
      'software development',
      'developer tools',
      'backend services',
      'system integration',
      'api design',
      'quality assurance',
      'continuous integration',
      'integrazione applicativa',
      'sviluppo software',
      'architettura software',
      'requirements engineering',
      'software testing',
      'test automation',
      'code quality',
      'software maintainability',
      'technical debt',
      'software lifecycle',
      'devops',
      'continuous delivery',
      'microservices',
      'api integration',
      'secure software development',
      'application security testing',
      'software deployment',
      'release management',
      'software observability',
      'logging systems',
      'monitoring systems',
      'error handling',
      'backend architecture',
      'frontend architecture',
      'database integration',
      'authentication systems',
      'authorization systems',
      'role based permissions',
      'audit logging implementation',
      'data validation',
      'input sanitization',
      'system scalability',
      'service reliability',
      'fault tolerance',
      'software documentation',
      'agile development',
      'scrum delivery',
      'software project management',
      'platform engineering',
      'system interoperability',
      'integration testing',
    ],
    0.8,
  ),
  'data science': createSemanticExpansion(
    [
      'data analytics',
      'statistical modelling',
      'data platform',
      'predictive analysis',
      'data governance',
      'data pipelines',
      'statistical inference',
      'forecasting models',
      'business intelligence',
      'analisi dei dati',
      'governance dei dati',
      'modellazione predittiva',
      'modelli statistici',
      'health data analytics',
      'clinical data analysis',
      'patient data quality',
      'medical data governance',
      'health records analysis',
      'clinical risk indicators',
      'data quality checks',
      'data reliability',
      'patient information quality',
      'clinical data validation',
      'data cleaning',
      'data quality',
      'data integration',
      'feature engineering',
      'predictive modelling',
      'classification models',
      'risk modelling',
      'data visualization',
      'dashboarding',
      'statistical testing',
      'causal inference',
      'model evaluation',
      'data warehouse',
      'data lake',
      'data catalog',
      'metadata management',
      'data lineage',
      'data privacy analytics',
      'sensitive data analysis',
      'clinical analytics',
      'population analytics',
      'decision analytics',
      'forecast validation',
      'bias detection',
      'algorithmic audit',
      'data governance controls',
      'data access controls',
      'record linkage',
      'entity matching',
      'secure data sharing',
      'data anonymization',
      'pseudonymization',
    ],
    0.76,
  ),
  'artificial intelligence': createSemanticExpansion(
    [
      'machine learning',
      'algorithmic systems',
      'predictive models',
      'neural systems',
      'ai systems',
      'model deployment',
      'natural language processing',
      'computer vision',
      'decision support algorithms',
      'modelli generativi',
      'intelligenza artificiale',
      'apprendimento automatico',
      'visione artificiale',
      'automated decision support',
      'clinical decision support',
      'model governance',
      'algorithmic accountability',
      'ai governance',
      'machine learning operations',
      'model monitoring',
      'model validation',
      'training data quality',
      'model bias',
      'algorithmic bias',
      'explainable ai',
      'human oversight',
      'decision automation',
      'predictive risk scoring',
      'natural language models',
      'medical ai systems',
      'ai safety',
      'model deployment pipeline',
      'model drift',
      'algorithmic transparency',
      'responsible ai',
      'ai ethics',
      'ai risk management',
      'computer aided diagnosis',
      'intelligent systems',
      'recommendation systems',
      'classification algorithms',
      'decision support models',
      'clinical prediction models',
      'automated triage support',
      'ai audit',
      'ai assurance',
      'model interpretability',
      'data driven decision support',
      'algorithmic impact assessment',
      'ai compliance',
    ],
    0.82,
  ),
  cybersecurity: createSemanticExpansion(
    [
      'digital security',
      'incident response',
      'privacy protection',
      'threat prevention',
      'cyber incident response',
      'network security',
      'vulnerability management',
      'identity access management',
      'security operations',
      'incidenti cyber',
      'sicurezza delle reti',
      'sicurezza informatica',
      'protezione dei dati',
      'access control',
      'role based access control',
      'authentication',
      'authorization',
      'audit logs',
      'access logging',
      'security audit',
      'data breach prevention',
      'medical data security',
      'healthcare cybersecurity',
      'patient data protection',
      'electronic health record security',
      'health records security',
      'secure data sharing',
      'secure interoperability',
      'encrypted records',
      'data confidentiality',
      'least privilege access',
      'emergency access controls',
      'break glass access',
      'security monitoring',
      'privacy safeguards',
      'identity verification',
      'privileged access management',
      'access review',
      'record access audit',
      'health data security',
      'secure clinical systems',
      'identity governance',
      'multi factor authentication',
      'session management',
      'security incident handling',
      'breach response',
      'threat modelling',
      'security architecture',
      'zero trust architecture',
      'endpoint protection',
      'network segmentation',
      'security information event management',
      'intrusion detection',
      'penetration testing',
      'vulnerability scanning',
      'patch management',
      'secure configuration',
      'encryption at rest',
      'encryption in transit',
      'key management',
      'data loss prevention',
      'security operations centre',
      'incident playbook',
      'cyber resilience',
      'disaster recovery',
      'backup security',
      'ransomware prevention',
      'phishing prevention',
      'security awareness',
      'third party security',
    ],
    0.82,
  ),
  'information systems': createSemanticExpansion(
    [
      'digital services',
      'enterprise systems',
      'it infrastructure',
      'digital operations',
      'enterprise architecture',
      'digital transformation',
      'erp systems',
      'information governance',
      'service integration',
      'governance dei sistemi informativi',
      'sistemi informativi',
      'servizi digitali',
      'hospital information systems',
      'health information systems',
      'electronic health records',
      'ehr systems',
      'patient record systems',
      'clinical information systems',
      'health data exchange',
      'health information exchange',
      'interoperability',
      'cross provider interoperability',
      'system integration',
      'data integration',
      'secure data access',
      'records access workflow',
      'identity management',
      'access management',
      'audit logging',
      'data governance',
      'data sharing infrastructure',
      'clinical workflow systems',
      'emergency department systems',
      'hospital data systems',
      'medical records system',
      'patient master index',
      'clinical data repository',
      'healthcare data interoperability',
      'emergency records workflow',
      'care coordination platform',
      'enterprise information architecture',
      'digital service architecture',
      'case management systems',
      'customer relationship systems',
      'document management systems',
      'workflow automation',
      'master data management',
      'reference data management',
      'system interoperability standards',
      'api based integration',
      'integration middleware',
      'service bus',
      'data exchange platform',
      'information lifecycle management',
      'records lifecycle',
      'enterprise content management',
      'information security management',
      'business process management systems',
      'user access management',
      'role permission model',
      'system availability',
      'business continuity systems',
      'disaster recovery systems',
      'system procurement',
      'system implementation',
      'user acceptance testing',
      'information quality',
      'data stewardship',
      'enterprise data model',
      'digital identity systems',
    ],
    0.74,
  ),
  engineering: createSemanticExpansion(
    [
      'technical infrastructure',
      'systems engineering',
      'engineering design',
      'technical feasibility',
      'engineering standards',
      'system reliability',
      'project engineering',
      'affidabilita tecnica',
      'infrastrutture tecniche',
      'progettazione tecnica',
      'technical risk assessment',
      'system design',
      'infrastructure reliability',
      'engineering feasibility',
      'technical standards compliance',
      'safety engineering',
      'maintenance planning',
      'asset management',
      'engineering operations',
      'technical inspection',
      'failure analysis',
      'resilience engineering',
      'systems reliability',
      'technical documentation',
      'engineering project delivery',
      'quality assurance engineering',
      'requirements analysis',
      'technical procurement',
      'engineering risk control',
      'operational safety',
      'technical lifecycle management',
      'design validation',
      'safety case',
      'engineering governance',
      'technical due diligence',
    ],
    0.48,
  ),
  'industrial engineering': createSemanticExpansion(
    [
      'process optimization',
      'manufacturing systems',
      'supply chain',
      'industrial operations',
      'production planning',
      'process engineering',
      'operational efficiency',
      'lean manufacturing',
      'industrial logistics',
      'gestione della produzione',
      'ingegneria industriale',
      'ottimizzazione dei processi',
      'workflow optimization',
      'queue management',
      'resource scheduling',
      'capacity optimization',
      'process mapping',
      'time motion study',
      'operations research',
      'simulation modelling',
      'service operations',
      'hospital operations',
      'emergency department flow',
      'patient flow management',
      'bottleneck analysis',
      'lean healthcare',
      'operational redesign',
      'throughput analysis',
      'service capacity',
      'demand forecasting',
      'staff scheduling',
      'supply chain resilience',
      'inventory management',
      'process standardization',
      'quality improvement',
      'six sigma',
      'operations analytics',
      'production control',
      'logistics planning',
      'facility layout',
      'workflow efficiency',
      'human factors engineering',
    ],
    0.72,
  ),
  'civil engineering': createSemanticExpansion(
    [
      'public infrastructure',
      'roads and bridges',
      'structural safety',
      'construction works',
      'drainage systems',
      'bridge maintenance',
      'road safety engineering',
      'transport corridors',
      'water infrastructure',
      'stormwater management',
      'structural inspections',
      'road maintenance',
      'bridge retrofits',
      'hydraulic infrastructure',
      'idraulica urbana',
      'manutenzione stradale',
      'rete stradale',
      'sicurezza strutturale',
      'infrastrutture civili',
      'opere pubbliche',
      'structural assessment',
      'seismic retrofitting',
      'building inspection',
      'construction safety',
      'bridge inspection',
      'road geometry',
      'traffic calming design',
      'stormwater drainage',
      'flood protection',
      'slope stability',
      'geotechnical investigation',
      'foundation assessment',
      'pavement design',
      'asset condition survey',
      'infrastructure resilience',
      'public works design',
      'construction project management',
      'site safety',
      'structural load assessment',
      'building code compliance',
      'urban infrastructure planning',
      'water supply systems',
      'wastewater networks',
      'transport infrastructure',
      'pedestrian safety engineering',
      'cycling infrastructure design',
      'road drainage',
      'maintenance prioritization',
      'infrastructure asset management',
      'construction quality control',
    ],
    0.76,
  ),
  'electrical engineering': createSemanticExpansion(
    [
      'power systems',
      'electrical grid',
      'energy distribution',
      'electronics infrastructure',
      'smart grid',
      'electrical substations',
      'charging infrastructure',
      'grid resilience',
      'power electronics',
      'impianti elettrici',
      'rete elettrica',
      'sistemi elettrici',
      'electrical safety',
      'power distribution',
      'grid stability',
      'renewable integration',
      'charging stations',
      'electric vehicle infrastructure',
      'substation design',
      'backup power',
      'hospital backup power',
      'uninterruptible power supply',
      'critical power systems',
      'medical electrical systems',
      'building electrical systems',
      'lighting systems',
      'smart meters',
      'energy monitoring',
      'load management',
      'power quality',
      'electrical maintenance',
      'electrical compliance',
      'low voltage systems',
      'control systems',
      'automation systems',
      'sensor networks',
      'building management systems',
      'telecommunications infrastructure',
      'network cabling',
      'emergency power planning',
      'grid modernization',
      'energy storage systems',
    ],
    0.74,
  ),
  'mechanical engineering': createSemanticExpansion(
    [
      'mechanical systems',
      'machinery',
      'manufacturing equipment',
      'thermal systems',
      'hvac systems',
      'heating and cooling systems',
      'heat exchange',
      'fluid systems',
      'thermodynamics',
      'building services engineering',
      'thermal plant',
      'fluid dynamics',
      'energy efficiency retrofit',
      'centrali termiche',
      'climatizzazione',
      'impianti termici',
      'scambiatori di calore',
      'impianti meccanici',
      'macchinari',
      'hvac design',
      'ventilation systems',
      'hospital ventilation',
      'infection control ventilation',
      'building climate systems',
      'mechanical plant',
      'boiler systems',
      'cooling systems',
      'air handling units',
      'energy retrofit',
      'thermal comfort',
      'mechanical maintenance',
      'equipment reliability',
      'medical gas systems',
      'hospital mechanical systems',
      'fire smoke control',
      'fluid mechanics',
      'pump systems',
      'water heating systems',
      'district heating',
      'energy performance',
      'building automation',
      'mechanical safety',
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
      'urban mobility planning',
      'street design',
      'walkability',
      'neighborhood planning',
      'public realm',
      'master planning',
      'urban design',
      'zoning',
      'streetscape design',
      'assetto urbano',
      'pianificazione della mobilita',
      'progettazione urbana',
      'spazio urbano',
      'progettazione stradale',
      'uso del suolo',
      'urbanistica',
      'rigenerazione urbana',
      'quartieri',
      'territorio',
      'building design',
      'urban design policy',
      'zoning regulation',
      'land use planning',
      'public realm design',
      'neighborhood regeneration',
      'housing density',
      'mixed use development',
      'walkable neighborhoods',
      'transit oriented development',
      'accessibility planning',
      'universal design',
      'public facility planning',
      'hospital site planning',
      'school site planning',
      'urban services planning',
      'street hierarchy',
      'parking policy',
      'open space planning',
      'climate resilient urban design',
      'urban heat mitigation',
      'green corridors',
      'blue green infrastructure',
      'planning permission',
      'development control',
      'urban design guidelines',
      'heritage conservation planning',
      'place making',
      'spatial equity',
      'community facilities planning',
      'urban safety design',
    ],
    0.84,
  ),
  education: createSemanticExpansion(
    [
      'learning systems',
      'education policy',
      'schools and universities',
      'student learning',
      'teaching quality',
      'learning outcomes',
      'student services',
      'study spaces',
      'curriculum governance',
      'assessment design',
      'student support services',
      'learning pathways',
      'governance didattica',
      'didattica universitaria',
      'servizi per studenti',
      'supporto didattico',
      'istruzione',
      'apprendimento',
      'scuola',
      'universita',
      'education access',
      'education equity',
      'student achievement',
      'learning assessment',
      'curriculum development',
      'school governance',
      'higher education governance',
      'student records',
      'education data privacy',
      'learning analytics',
      'student support',
      'school inclusion policy',
      'digital learning systems',
      'educational technology',
      'student wellbeing services',
      'academic advising',
      'school leadership',
      'education reform',
      'teacher quality',
      'education funding',
      'student progression',
      'learning standards',
      'assessment policy',
      'course design',
      'vocational education',
    ],
    0.44,
  ),
  'teaching and training': createSemanticExpansion(
    [
      'teacher development',
      'professional training',
      'instructional design',
      'classroom pedagogy',
      'adult education',
      'teacher coaching',
      'skills training',
      'professional development',
      'formazione',
      'didattica',
      'formazione professionale',
      'progettazione formativa',
      'training needs analysis',
      'skills curriculum',
      'professional skills development',
      'competency framework',
      'instructional methods',
      'training evaluation',
      'adult learning methods',
      'workplace training',
      'technical training',
      'safety training',
      'healthcare staff training',
      'cybersecurity awareness training',
      'privacy training',
      'compliance training',
      'emergency response training',
      'simulation training',
      'scenario based learning',
      'learning materials design',
      'training delivery',
      'trainer facilitation',
      'skills certification',
      'micro credentials',
      'learning outcomes assessment',
      'capacity building',
      'staff onboarding',
      'continuous professional education',
      'e learning modules',
      'blended training',
      'train the trainer',
      'competence assessment',
    ],
    0.62,
  ),
  'social sciences': createSemanticExpansion(
    [
      'social inclusion',
      'community research',
      'social inequality',
      'societal analysis',
      'community engagement',
      'demographic analysis',
      'participatory research',
      'social cohesion',
      'analisi sociale',
      'ricerca sociale',
      'scienze sociali',
      'inclusione sociale',
      'community behavior',
      'public attitudes',
      'social impact',
      'social policy',
      'inequality analysis',
      'demographic trends',
      'public participation',
      'stakeholder analysis',
      'survey methodology',
      'focus groups',
      'qualitative interviews',
      'community needs',
      'social vulnerability',
      'service accessibility',
      'social determinants of health',
      'trust in institutions',
      'social risk',
      'behavioral insights',
      'citizen engagement',
      'participatory governance',
      'public opinion research',
      'community resilience',
      'social networks',
      'social cohesion policy',
      'equity assessment',
      'inclusion assessment',
      'human behavior analysis',
      'organizational behavior',
    ],
    0.5,
  ),
  'political science': createSemanticExpansion(
    [
      'democratic institutions',
      'civic participation',
      'public governance',
      'electoral systems',
      'policy analysis',
      'institutional design',
      'democratic governance',
      'civic institutions',
      'analisi politica',
      'istituzioni democratiche',
      'scienze politiche',
      'partecipazione civica',
      'policy process',
      'public institutions',
      'governance systems',
      'democratic accountability',
      'institutional legitimacy',
      'public decision process',
      'political participation',
      'public policy analysis',
      'comparative governance',
      'administrative politics',
      'regulatory politics',
      'policy implementation study',
      'multi level governance',
      'public consultation design',
      'civic trust',
      'citizen representation',
      'stakeholder power analysis',
      'political accountability',
      'public authority',
      'legislative oversight',
      'democratic deliberation',
      'participatory democracy',
      'policy legitimacy',
      'interest group analysis',
      'public sector reform',
      'institutional capacity',
      'governance failure',
      'transparency policy',
      'rights governance',
      'public accountability systems',
    ],
    0.66,
  ),
  'public administration': createSemanticExpansion(
    [
      'municipal services',
      'local government',
      'administrative reform',
      'civic administration',
      'permit administration',
      'administrative enforcement',
      'policy implementation',
      'emergency coordination',
      'institutional coordination',
      'administrative procedure',
      'public procurement',
      'service delivery reform',
      'performance management',
      'governo locale',
      'sportello unico',
      'attuazione delle politiche',
      'regolamenti comunali',
      'amministrazione pubblica',
      'servizi comunali',
      'comune',
      'public records management',
      'records access management',
      'administrative data sharing',
      'public sector data governance',
      'inter agency coordination',
      'cross agency coordination',
      'public service accountability',
      'public information access',
      'service continuity',
      'emergency service coordination',
      'public service records',
      'access authorization workflow',
      'public data protection',
      'institutional accountability',
      'public sector information systems',
      'public service data sharing',
      'case management records',
      'administrative audit logs',
      'administrative service design',
      'government workflow',
      'case management process',
      'citizen service delivery',
      'administrative burden reduction',
      'public sector digital transformation',
      'government interoperability',
      'public sector performance',
      'service standards',
      'administrative capacity',
      'public sector risk management',
      'public sector audit',
      'government procurement',
      'regulatory administration',
      'records retention policy',
      'document disclosure process',
      'public sector privacy compliance',
    ],
    0.74,
  ),
  'international relations': createSemanticExpansion(
    [
      'international cooperation',
      'migration policy',
      'diplomatic relations',
      'european affairs',
      'cross border cooperation',
      'european policy',
      'international development',
      'global governance',
      'affari europei',
      'cooperazione transfrontaliera',
      'relazioni internazionali',
      'cooperazione internazionale',
      'eu policy',
      'european regulation',
      'cross border data sharing',
      'international data transfer',
      'global health governance',
      'international health cooperation',
      'migration governance',
      'humanitarian response',
      'international development policy',
      'diplomatic coordination',
      'transnational regulation',
      'international security cooperation',
      'eu digital policy',
      'eu health policy',
      'data adequacy',
      'cross border healthcare',
      'international public health',
      'international crisis response',
      'global privacy regulation',
      'international standards',
      'multilateral cooperation',
      'international institutions',
      'policy harmonization',
      'international legal frameworks',
      'cross border services',
      'international mobility',
      'humanitarian logistics',
      'global governance reform',
      'development cooperation projects',
      'international programme management',
    ],
    0.66,
  ),
  law: createSemanticExpansion(
    [
      'legal framework',
      'regulatory compliance',
      'rights protection',
      'justice policy',
      'administrative law',
      'municipal regulation',
      'regulatory enforcement',
      'legal obligations',
      'public procurement law',
      'licensing rules',
      'administrative appeals',
      'contract compliance',
      'appalti pubblici',
      'diritto amministrativo',
      'obblighi legali',
      'ricorsi amministrativi',
      'regolamenti comunali',
      'conformita normativa',
      'diritto',
      'normativa',
      'tutela dei diritti',
      'privacy law',
      'data protection law',
      'healthcare law',
      'medical records law',
      'patient rights',
      'patient consent',
      'informed consent',
      'emergency consent',
      'lawful access',
      'lawful data sharing',
      'legal basis',
      'confidentiality',
      'medical confidentiality',
      'professional secrecy',
      'data minimization',
      'purpose limitation',
      'audit requirement',
      'access accountability',
      'legal liability',
      'regulatory safeguards',
      'compliance audit',
      'records disclosure',
      'patient data protection',
      'health information law',
      'records access law',
      'health data compliance',
      'emergency access legality',
      'privacy impact assessment',
      'sensitive personal data',
      'data subject rights',
      'public interest processing',
      'emergency exception',
      'consent exemption',
      'cross provider agreement',
      'data sharing agreement',
      'controller responsibility',
      'processor responsibility',
      'breach notification',
      'data protection impact assessment',
      'access log review',
      'professional duty',
      'duty of care',
      'medical negligence',
      'healthcare compliance',
    ],
    0.72,
  ),
  'criminology and public safety': createSemanticExpansion(
    [
      'public safety',
      'crime prevention',
      'policing policy',
      'emergency response',
      'community safety',
      'emergency management',
      'urban security',
      'civil protection',
      'polizia locale',
      'protezione civile',
      'sicurezza pubblica',
      'prevenzione del crimine',
      'emergency services',
      'first response',
      'incident command',
      'public order',
      'community policing',
      'crime analysis',
      'risk assessment',
      'emergency preparedness',
      'disaster response',
      'civil protection planning',
      'urban safety planning',
      'security patrols',
      'victim support',
      'violence prevention',
      'public safety data',
      'emergency dispatch',
      '911 equivalent services',
      'fire safety response',
      'ambulance coordination',
      'crisis management',
      'threat assessment',
      'safety inspection',
      'crowd safety',
      'event safety',
      'public safety communication',
      'law enforcement coordination',
      'emergency operations centre',
      'resilience planning',
      'hazard response',
      'critical incident review',
    ],
    0.76,
  ),
  healthcare: createSemanticExpansion(
    [
      'health services',
      'patient care',
      'clinical access',
      'care delivery',
      'hospital coordination',
      'care continuity',
      'emergency triage',
      'healthcare resilience',
      'primary care',
      'outpatient services',
      'care pathways',
      'hospital access',
      'continuita assistenziale',
      'presa in carico',
      'pronto soccorso',
      'sanita',
      'assistenza sanitaria',
      'emergency department',
      'urgent care',
      'emergency medical care',
      'patient records',
      'medical records',
      'health records',
      'patient information',
      'patient history',
      'clinical information',
      'clinical notes',
      'medication records',
      'allergy records',
      'chronic condition records',
      'critical lab results',
      'diagnostic records',
      'care handover',
      'clinical handoff',
      'cross provider care',
      'healthcare provider coordination',
      'continuity of care',
      'emergency access to records',
      'emergency medical access',
      'healthcare data sharing',
      'hospital information access',
      'electronic health records',
      'health information exchange',
      'patient safety',
      'clinical safety',
      'treatment decisions',
      'emergency treatment decisions',
      'medical decision support',
      'care coordination',
      'clinical accountability',
      'patient confidentiality',
      'healthcare privacy',
      'patient record access',
      'medical record access',
      'care team communication',
      'hospital records access',
      'emergency care coordination',
      'urgent patient information',
      'acute care',
      'critical care',
      'ambulance handover',
      'emergency responder information',
      'hospital admission',
      'patient identification',
      'medical reconciliation',
      'duplicate test avoidance',
      'medication error prevention',
      'safe prescribing',
      'care escalation',
      'risk indicators',
    ],
    0.5,
  ),
  medicine: createSemanticExpansion(
    [
      'clinical treatment',
      'medical diagnosis',
      'hospital medicine',
      'clinical protocols',
      'diagnostic pathways',
      'specialist care',
      'medical wards',
      'medicina clinica',
      'diagnosi medica',
      'ospedale',
      'percorsi clinici',
      'protocolli clinici',
      'emergency medicine',
      'urgent diagnosis',
      'acute care',
      'critical care',
      'clinical decision making',
      'medical decision making',
      'treatment planning',
      'diagnostic history',
      'medication history',
      'allergy information',
      'patient history',
      'clinical records',
      'medical records',
      'patient records',
      'laboratory results',
      'lab results',
      'radiology reports',
      'clinical documentation',
      'doctor access to records',
      'emergency treatment',
      'risk indicators',
      'clinical risk',
      'patient safety',
      'medical accountability',
      'clinical accountability',
      'care continuity',
      'clinical handover',
      'hospital handover',
      'emergency patient assessment',
      'acute patient management',
      'medical chart review',
      'patient chart access',
      'physician assessment',
      'differential diagnosis',
      'clinical examination',
      'vital signs interpretation',
      'drug interaction review',
      'medication reconciliation',
      'contraindications',
      'patient allergy check',
      'chronic disease history',
      'acute symptoms',
      'emergency warning signs',
      'clinical urgency',
      'triage priority',
      'diagnostic test results',
      'imaging results',
      'pathology reports',
      'care plan',
      'treatment protocol',
      'clinical guideline',
      'evidence based medicine',
      'inpatient care',
    ],
    0.76,
  ),
  nursing: createSemanticExpansion(
    [
      'nursing care',
      'patient assistance',
      'care coordination',
      'patient monitoring',
      'ward care',
      'nursing staff coordination',
      'bedside assistance',
      'assistenza di reparto',
      'coordinamento infermieristico',
      'infermieristica',
      'assistenza ai pazienti',
      'patient handover',
      'clinical handover',
      'nursing handoff',
      'emergency nursing',
      'triage nursing',
      'patient observation',
      'vital signs',
      'medication administration',
      'allergy checks',
      'care notes',
      'nursing notes',
      'patient chart review',
      'hospital chart review',
      'patient safety',
      'clinical safety',
      'care continuity',
      'emergency department nursing',
      'urgent care nursing',
      'bedside documentation',
      'patient record review',
      'medical chart access',
      'nursing documentation',
      'care team handoff',
      'nursing assessment',
      'care plan execution',
      'patient monitoring chart',
      'early warning score',
      'ward round preparation',
      'care escalation',
      'pressure injury prevention',
      'fall risk assessment',
      'medication safety',
      'patient identification check',
      'infection control nursing',
      'discharge preparation',
      'admission assessment',
      'handover communication',
      'nurse patient confidentiality',
      'nursing workflow',
      'clinical communication',
      'care transition',
      'patient advocacy',
      'family communication',
      'nursing care quality',
      'staffing safety',
      'clinical observations',
      'bedside charting',
    ],
    0.7,
  ),
  'public health': createSemanticExpansion(
    [
      'prevention policy',
      'epidemiology',
      'health promotion',
      'population health',
      'emergency preparedness',
      'outbreak response',
      'epidemiological surveillance',
      'health emergency coordination',
      'preparedness exercises',
      'vaccination campaigns',
      'screening programmes',
      'health surveillance',
      'prevention programmes',
      'prevenzione collettiva',
      'emergenza sanitaria',
      'sanita territoriale',
      'sorveglianza epidemiologica',
      'preparazione alle emergenze',
      'salute pubblica',
      'prevenzione sanitaria',
      'health system resilience',
      'public health emergency',
      'healthcare system coordination',
      'emergency care planning',
      'health data governance',
      'health information sharing',
      'patient safety policy',
      'population health data',
      'health risk management',
      'public health records',
      'healthcare access policy',
      'emergency response planning',
      'cross provider coordination',
      'continuity of care planning',
      'health service continuity',
      'emergency medical preparedness',
      'health data oversight',
      'public health data sharing',
      'emergency health systems',
      'disease surveillance',
      'health emergency preparedness',
      'population risk assessment',
      'community health protection',
      'health equity',
      'health service planning',
      'public health informatics',
      'outbreak data systems',
      'emergency operations planning',
      'healthcare surge planning',
      'public health law',
      'health promotion strategy',
      'screening data',
      'vaccination records',
      'health indicators',
      'health outcomes monitoring',
      'population level safety',
      'health system performance',
      'public health ethics',
      'privacy in public health',
      'data linkage for health',
    ],
    0.74,
  ),
  psychology: createSemanticExpansion(
    [
      'mental health',
      'behavioural support',
      'counselling services',
      'psychological wellbeing',
      'psychological services',
      'emotional wellbeing',
      'behavioral health',
      'mental health support',
      'benessere psicologico',
      'consulenza psicologica',
      'salute mentale',
      'supporto psicologico',
      'mental health assessment',
      'psychological care',
      'behavioral intervention',
      'clinical psychology',
      'counselling support',
      'stress management',
      'trauma support',
      'crisis counselling',
      'community mental health',
      'student mental health',
      'workplace wellbeing',
      'patient emotional support',
      'health behavior',
      'behavior change',
      'psychosocial support',
      'cognitive assessment',
      'mental health records',
      'confidential counselling records',
      'psychological confidentiality',
      'therapy access',
      'substance use support',
      'suicide prevention',
      'anxiety support',
      'depression support',
      'resilience training',
      'behavioral risk',
      'patient autonomy',
      'communication behavior',
      'trust and privacy',
      'patient decision making',
    ],
    0.68,
  ),
  humanities: createSemanticExpansion(
    [
      'cultural heritage',
      'ethics and values',
      'literary culture',
      'humanistic studies',
      'cultural interpretation',
      'humanistic education',
      'critical studies',
      'heritage interpretation',
      'interpretazione culturale',
      'patrimonio culturale',
      'studi umanistici',
      'studi culturali',
      'ethics of technology',
      'health humanities',
      'medical humanities',
      'human values',
      'public values',
      'cultural context',
      'social meaning',
      'human dignity',
      'rights discourse',
      'narrative ethics',
      'historical interpretation',
      'cultural memory',
      'language and meaning',
      'public reasoning',
      'critical interpretation',
      'ethical literacy',
      'civic values',
      'cultural inclusion',
      'heritage policy',
      'public culture',
      'social narratives',
      'interpretive analysis',
      'human centered policy',
    ],
    0.46,
  ),
  history: createSemanticExpansion(
    [
      'historical heritage',
      'archives and memory',
      'museum collections',
      'local archives',
      'public memory',
      'historical research',
      'archival heritage',
      'memoria pubblica',
      'ricerca storica',
      'storia locale',
      'archivi storici',
      'institutional history',
      'public archives',
      'healthcare history',
      'medical history',
      'local institutional memory',
      'historical records',
      'archive access',
      'records preservation',
      'public documentation',
      'heritage records',
      'policy history',
      'urban history',
      'social history',
      'historical evidence',
      'historical accountability',
      'archival research methods',
      'record keeping history',
      'institutional memory',
      'public memory policy',
      'historical continuity',
      'documentary heritage',
      'records classification',
      'archives governance',
      'historical context',
      'medical archives',
      'hospital archives',
      'administrative archives',
      'privacy in archives',
      'historical data use',
    ],
    0.64,
  ),
  philosophy: createSemanticExpansion(
    [
      'ethical reflection',
      'moral reasoning',
      'public ethics',
      'applied ethics',
      'bioethics',
      'civic ethics',
      'ethics committees',
      'bioetica',
      'etica applicata',
      'filosofia morale',
      'etica pubblica',
      'medical ethics',
      'healthcare ethics',
      'patient consent ethics',
      'privacy ethics',
      'data sharing ethics',
      'emergency care ethics',
      'patient autonomy',
      'clinical ethics',
      'ethical safeguards',
      'rights based ethics',
      'professional responsibility',
      'confidentiality ethics',
      'consent exception ethics',
      'patient dignity',
      'public interest ethics',
      'moral trade offs',
      'ethical decision making',
      'justice in healthcare',
      'beneficence',
      'nonmaleficence',
      'autonomy and consent',
      'emergency ethics',
      'bioethical analysis',
      'ethical proportionality',
      'fairness in access',
      'ethics of care',
      'responsibility ethics',
      'institutional ethics',
      'trust and privacy',
      'human dignity',
      'ethical governance',
    ],
    0.6,
  ),
  'languages and literature': createSemanticExpansion(
    [
      'language learning',
      'translation studies',
      'literary education',
      'multilingual communication',
      'language mediation',
      'reading promotion',
      'literary studies',
      'translation services',
      'lingue',
      'letteratura',
      'mediazione linguistica',
      'promozione della lettura',
      'plain language',
      'health literacy',
      'translation accuracy',
      'medical translation',
      'public information translation',
      'multilingual access',
      'language barriers',
      'intercultural communication',
      'patient communication',
      'consent form language',
      'accessible writing',
      'civic literacy',
      'reading comprehension',
      'document clarity',
      'service translation',
      'community language access',
      'interpretation services',
      'medical interpreting',
      'legal interpreting',
      'multilingual public services',
      'terminology management',
      'health communication language',
      'cross cultural communication',
    ],
    0.62,
  ),
  'arts and design': createSemanticExpansion(
    [
      'visual design',
      'creative production',
      'cultural design',
      'graphic communication',
      'service design',
      'exhibition design',
      'creative direction',
      'arti visive',
      'design culturale',
      'direzione creativa',
      'progettazione visiva',
      'information design',
      'user experience',
      'interface design',
      'visual accessibility',
      'public service design',
      'health service design',
      'patient journey mapping',
      'service blueprinting',
      'wayfinding systems',
      'hospital signage',
      'visual communication',
      'communication design',
      'user research',
      'design thinking',
      'human centered design',
      'inclusive design',
      'accessibility guidelines',
      'interaction design',
      'digital product design',
      'content design',
      'civic design',
      'participatory design',
      'co design workshop',
      'design prototyping',
    ],
    0.64,
  ),
  'media and journalism': createSemanticExpansion(
    [
      'news media',
      'journalistic reporting',
      'digital publishing',
      'public information',
      'editorial policy',
      'fact checking',
      'local news',
      'investigative reporting',
      'editoria digitale',
      'informazione locale',
      'giornalismo',
      'mezzi di comunicazione',
      'public interest reporting',
      'health journalism',
      'data journalism',
      'investigative journalism',
      'media ethics',
      'source protection',
      'public accountability reporting',
      'policy reporting',
      'science communication',
      'health communication',
      'privacy reporting',
      'cybersecurity reporting',
      'public information access',
      'freedom of information',
      'news verification',
      'misinformation response',
      'crisis reporting',
      'local journalism',
      'public debate coverage',
      'editorial accountability',
      'audience trust',
      'media literacy',
      'public records journalism',
    ],
    0.66,
  ),
  'environment and sustainability': createSemanticExpansion(
    [
      'climate resilience',
      'green infrastructure',
      'energy transition',
      'biodiversity',
      'climate adaptation',
      'decarbonization',
      'emissions reduction',
      'sustainable mobility',
      'urban sustainability',
      'climate mitigation',
      'environmental assessment',
      'resource efficiency',
      'urban ecology',
      'adattamento climatico',
      'efficienza delle risorse',
      'mobilita sostenibile',
      'decarbonizzazione',
      'economia circolare',
      'sostenibilita',
      'ambiente',
      'valutazione ambientale',
      'clima',
      'environmental governance',
      'climate policy',
      'air quality',
      'water quality',
      'waste reduction',
      'circular economy',
      'sustainable transport',
      'green building',
      'energy efficiency',
      'renewable energy',
      'climate risk',
      'climate resilience planning',
      'urban heat',
      'flood resilience',
      'nature based solutions',
      'biodiversity protection',
      'sustainable procurement',
      'environmental monitoring',
      'carbon accounting',
      'resource management',
    ],
    0.8,
  ),
  'agriculture and food': createSemanticExpansion(
    [
      'food systems',
      'agricultural production',
      'rural development',
      'agri food chain',
      'food security',
      'agroecology',
      'short supply chains',
      'food distribution',
      'agricoltura',
      'filiera corta',
      'filiera alimentare',
      'sicurezza alimentare',
      'food safety',
      'farm management',
      'livestock health',
      'veterinary oversight',
      'antimicrobial resistance',
      'soil health',
      'crop production',
      'irrigation management',
      'food supply chain',
      'local food systems',
      'food waste reduction',
      'farm sustainability',
      'organic farming',
      'agricultural policy',
      'rural services',
      'food inspection',
      'food distribution logistics',
      'school meals',
      'public food procurement',
      'nutrition policy',
      'food labeling',
      'animal welfare',
      'farm biosecurity',
      'agricultural resilience',
      'short food supply chain',
      'food affordability',
      'urban agriculture',
      'community gardens',
      'food security planning',
      'agri business',
    ],
    0.72,
  ),
  'tourism and hospitality': createSemanticExpansion(
    [
      'visitor economy',
      'destination management',
      'hospitality services',
      'tourism strategy',
      'visitor services',
      'cultural tourism',
      'hotel operations',
      'destination promotion',
      'accoglienza turistica',
      'gestione dei flussi turistici',
      'turismo',
      'ospitalita',
      'visitor management',
      'hotel services',
      'restaurant operations',
      'tourism flows',
      'destination strategy',
      'visitor safety',
      'tourist information',
      'hospitality workforce',
      'seasonal employment',
      'event tourism',
      'cultural routes',
      'tourism marketing',
      'short term rentals',
      'visitor mobility',
      'tourism sustainability',
      'overtourism management',
      'guest experience',
      'service quality in hospitality',
      'tourism data',
      'visitor economy impact',
      'tourist access',
      'accommodation regulation',
      'food service hospitality',
      'tour operator services',
      'tourist safety communication',
      'destination resilience',
      'local business tourism',
      'conference tourism',
      'heritage tourism',
      'tourism accessibility',
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
      'multimodal transport',
      'mobility hubs',
      'street safety',
      'pedestrian network',
      'local transit',
      'intermodal exchange',
      'transit planning',
      'shared mobility',
      'mobility demand management',
      'rail services',
      'road circulation',
      'pianificazione del traffico',
      'sicurezza stradale',
      'mobilita multimodale',
      'mobilita',
      'trasporto',
      'trasporto pubblico locale',
      'piste ciclabili',
      'autobus',
      'bus priority',
      'bus stops',
      'tram corridors',
      'metro planning',
      'rail integration',
      'bike lanes',
      'protected cycling lanes',
      'pedestrian crossings',
      'road safety',
      'traffic signals',
      'parking management',
      'low emission zones',
      'freight delivery',
      'last mile mobility',
      'shared bicycles',
      'car sharing',
      'micromobility',
      'walking routes',
      'accessible transport',
      'transport equity',
      'commuter routes',
      'night transport',
      'public transport frequency',
      'service reliability',
      'mobility data',
      'traffic congestion',
      'transport emissions',
      'safe routes',
      'school mobility',
      'hospital access transport',
      'emergency vehicle access',
      'transport hub design',
      'intermodal planning',
      'park and ride',
      'mobility as a service',
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
        ? 0.03
        : 0;

    return (
      0.98 +
      stakeholderRoleContribution * 0.95 +
      backgroundContribution * 0.92 +
      synergy
    );
  }

  if (relevanceLevel === 'partial') {
    const synergy =
      stakeholderRoleMatch.kind === 'partial' && backgroundInfluence.active
        ? 0.03
        : 0;

    return (
      0.92 +
      stakeholderRoleContribution * 0.78 +
      backgroundContribution * 0.88 +
      synergy
    );
  }

  let penalty = 0.15;

  if (stakeholderRoleMatch.kind === 'none') {
    penalty += 0.17;
  } else if (stakeholderRoleMatch.kind === 'partial') {
    penalty += 0.04;
  }

  if (
    !backgroundInfluence.active ||
    backgroundInfluence.match.kind === 'none'
  ) {
    penalty += 0.1;
  } else if (!backgroundInfluence.stronglyActive) {
    penalty += 0.03;
  }

  return (
    1 -
    penalty +
    stakeholderRoleContribution * 0.3 +
    backgroundContribution * 0.34 +
    stakeholderRoleMatch.strength * 0.03 +
    backgroundInfluence.match.strength * 0.05
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
  const expertiseDepthScore = getExpertiseDepthScore(
    experienceLevel,
    yearsOfExperience,
  );

  if (expertiseDepthScore === 0) {
    return 0;
  }

  if (relevanceLevel === 'weak') {
    const applicability = clamp(
      stakeholderRoleMatch.strength * 0.32 +
        backgroundInfluence.match.strength * 0.36 +
        backgroundInfluence.applicability * 0.18 +
        0.18,
      0,
      0.48,
    );

    if (applicability < 0.06) {
      return 0;
    }

    return round(0.05 * expertiseDepthScore * applicability);
  }

  const applicability = clamp(
    stakeholderRoleMatch.strength * 0.45 +
      backgroundInfluence.applicability * 0.4 +
      (relevanceLevel === 'strong' ? 0.2 : 0.08),
    relevanceLevel === 'strong' ? 0.3 : 0.12,
    1,
  );

  const cap = relevanceLevel === 'strong' ? 0.085 : 0.05;

  return round(cap * expertiseDepthScore * applicability);
}

function getStudyLevelAdjustment(
  relevanceLevel: RelevanceLevel,
  stakeholderRoleMatch: FieldMatch,
  backgroundInfluence: BackgroundInfluence,
  studyLevel: string | null | undefined,
): number {
  const studyLevelScore = getStudyLevelScore(studyLevel);

  if (studyLevelScore === 0) {
    return 0;
  }

  if (relevanceLevel === 'weak') {
    const applicability = clamp(
      backgroundInfluence.match.strength * 0.42 +
        stakeholderRoleMatch.strength * 0.24 +
        backgroundInfluence.applicability * 0.12 +
        0.12,
      0,
      0.4,
    );

    if (applicability < 0.05) {
      return 0;
    }

    return round(0.02 * studyLevelScore * applicability);
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

  const cap = relevanceLevel === 'strong' ? 0.055 : 0.03;
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
    return round((combinedStrength - 0.6) * 0.04);
  }

  if (relevanceLevel === 'partial') {
    return round((combinedStrength - 0.34) * 0.032);
  }

  return round((combinedStrength - 0.08) * 0.04);
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
  if (!locationRelevant) {
    return 0;
  }

  let baseAdjustment = 0;

  switch (normalizeValue(relationshipToArea)) {
    case 'resident':
      baseAdjustment =
        relevanceLevel === 'strong'
          ? 0.028
          : relevanceLevel === 'partial'
            ? 0.018
            : 0.012;
      break;
    case 'non resident':
      baseAdjustment =
        relevanceLevel === 'strong'
          ? 0.01
          : relevanceLevel === 'partial'
            ? 0.007
            : 0.004;
      break;
    case 'visitor':
      baseAdjustment =
        relevanceLevel === 'strong'
          ? -0.016
          : relevanceLevel === 'partial'
            ? -0.012
            : -0.01;
      break;
    default:
      baseAdjustment = 0;
      break;
  }

  return round(baseAdjustment);
}

function getCityAdjustment(
  relevanceLevel: RelevanceLevel,
  contextSignals: ConsultationContextSignals,
  locationRelevant: boolean,
  city: string | null | undefined,
): number {
  if (!locationRelevant) {
    return 0;
  }

  const normalizedCity = normalizeValue(city);

  if (!normalizedCity || !contextSignals.fullText.includes(normalizedCity)) {
    return 0;
  }

  return relevanceLevel === 'strong'
    ? 0.012
    : relevanceLevel === 'partial'
      ? 0.008
      : 0.004;
}

function getExceptionalSpecialistAdjustment(
  relevanceLevel: RelevanceLevel,
  stakeholderRoleMatch: FieldMatch,
  backgroundInfluence: BackgroundInfluence,
  contextSignals: ConsultationContextSignals,
  assessment: AssessmentForWeighting,
): number {
  if (
    relevanceLevel !== 'strong' ||
    stakeholderRoleMatch.kind !== 'strong' ||
    backgroundInfluence.match.kind !== 'strong' ||
    !backgroundInfluence.stronglyActive
  ) {
    return 0;
  }

  const normalizedRelationship = normalizeValue(assessment.relationshipToArea);
  const normalizedCity = normalizeValue(assessment.city);
  const cityAligned =
    !!normalizedCity && contextSignals.fullText.includes(normalizedCity);

  if (normalizedRelationship !== 'resident' || !cityAligned) {
    return 0;
  }

  const expertiseDepthScore = getExpertiseDepthScore(
    assessment.experienceLevel,
    assessment.yearsOfExperience,
  );
  const studyLevelScore = getStudyLevelScore(assessment.studyLevel);

  if (expertiseDepthScore < 0.72 || studyLevelScore < 0.68) {
    return 0;
  }

  const phraseSignal = Math.max(
    stakeholderRoleMatch.exactPhraseWeight,
    stakeholderRoleMatch.semanticPhraseWeight,
    backgroundInfluence.match.exactPhraseWeight,
    backgroundInfluence.match.semanticPhraseWeight,
  );
  const roleElite = clamp((stakeholderRoleMatch.strength - 0.74) / 0.26, 0, 1);
  const backgroundElite = clamp(
    (backgroundInfluence.match.strength - 0.82) / 0.18,
    0,
    1,
  );
  const applicabilityElite = clamp(
    (backgroundInfluence.applicability - 0.9) / 0.1,
    0,
    1,
  );
  const expertiseElite = clamp((expertiseDepthScore - 0.72) / 0.28, 0, 1);
  const studyElite = clamp((studyLevelScore - 0.68) / 0.26, 0, 1);
  const phraseElite = clamp((phraseSignal - 0.72) / 0.88, 0, 1);

  return round(
    clamp(
      roleElite * 0.055 +
        backgroundElite * 0.05 +
        applicabilityElite * 0.02 +
        expertiseElite * 0.03 +
        studyElite * 0.08 +
        phraseElite * 0.03,
      0,
      0.2,
    ),
  );
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
  weight += getExceptionalSpecialistAdjustment(
    relevanceLevel,
    stakeholderRoleMatch,
    backgroundInfluence,
    contextSignals,
    assessment,
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
