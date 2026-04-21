const STORED_VALUE_LABELS: Record<string, string> = {
  AGE_18_24: '18-24',
  AGE_25_34: '25-34',
  AGE_35_44: '35-44',
  AGE_45_54: '45-54',
  AGE_55_64: '55-64',
  AGE_65_PLUS: '65+',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
  MALE: 'Male',
  FEMALE: 'Female',
  NON_BINARY: 'Non-binary',
  OTHER: 'Other',
  ITALY: 'Italy',
  EMILIA_ROMAGNA: 'Emilia-Romagna',
  BOLOGNA: 'Bologna',
  MODENA: 'Modena',
  PARMA: 'Parma',
  REGGIO_EMILIA: 'Reggio Emilia',
  RAVENNA: 'Ravenna',
  RIMINI: 'Rimini',
  FERRARA: 'Ferrara',
  FORLI: 'Forli',
  CESENA: 'Cesena',
  PIACENZA: 'Piacenza',
  IMOLA: 'Imola',
  CARPI: 'Carpi',
  FAENZA: 'Faenza',
  SASSUOLO: 'Sassuolo',
  RICCIONE: 'Riccione',
  CENTO: 'Cento',
  LUGO: 'Lugo',
  FORMIGINE: 'Formigine',
  CASTELFRANCO_EMILIA: 'Castelfranco Emilia',
  SAN_LAZZARO_DI_SAVENA: 'San Lazzaro di Savena',
  UNIVERSITY_STUDENT: 'University student',
  SCHOOL_STUDENT: 'School student',
  BUSINESS_OWNER: 'Business owner',
  ENTREPRENEUR: 'Entrepreneur',
  PRIVATE_SECTOR_EMPLOYEE: 'Private sector employee',
  PUBLIC_SECTOR_EMPLOYEE: 'Public sector employee',
  FREELANCER: 'Freelancer',
  SELF_EMPLOYED: 'Self-employed',
  RESEARCHER: 'Researcher',
  ACADEMIC: 'Academic',
  TEACHER: 'Teacher',
  NGO_MEMBER: 'NGO member',
  VOLUNTEER: 'Volunteer',
  CIVIL_SERVANT: 'Civil servant',
  POLICY_MAKER: 'Policy maker',
  HEALTHCARE_WORKER: 'Healthcare worker',
  LEGAL_PROFESSIONAL: 'Legal professional',
  CREATIVE_PROFESSIONAL: 'Creative professional',
  UNEMPLOYED: 'Unemployed',
  RETIRED: 'Retired',
  BUSINESS_AND_MANAGEMENT: 'Business and management',
  ECONOMICS_AND_FINANCE: 'Economics and finance',
  ACCOUNTING_AND_AUDITING: 'Accounting and auditing',
  MARKETING_AND_COMMUNICATION: 'Marketing and communication',
  ENTREPRENEURSHIP_AND_INNOVATION: 'Entrepreneurship and innovation',
  COMPUTER_SCIENCE: 'Computer science',
  SOFTWARE_ENGINEERING: 'Software engineering',
  DATA_SCIENCE: 'Data science',
  ARTIFICIAL_INTELLIGENCE: 'Artificial intelligence',
  CYBERSECURITY: 'Cybersecurity',
  INFORMATION_SYSTEMS: 'Information systems',
  ENGINEERING: 'Engineering',
  INDUSTRIAL_ENGINEERING: 'Industrial engineering',
  CIVIL_ENGINEERING: 'Civil engineering',
  ELECTRICAL_ENGINEERING: 'Electrical engineering',
  MECHANICAL_ENGINEERING: 'Mechanical engineering',
  ARCHITECTURE_AND_URBAN_PLANNING: 'Architecture and urban planning',
  EDUCATION: 'Education',
  TEACHING_AND_TRAINING: 'Teaching and training',
  SOCIAL_SCIENCES: 'Social sciences',
  POLITICAL_SCIENCE: 'Political science',
  PUBLIC_ADMINISTRATION: 'Public administration',
  INTERNATIONAL_RELATIONS: 'International relations',
  LAW: 'Law',
  CRIMINOLOGY_AND_PUBLIC_SAFETY: 'Criminology and public safety',
  HEALTHCARE: 'Healthcare',
  MEDICINE: 'Medicine',
  NURSING: 'Nursing',
  PUBLIC_HEALTH: 'Public health',
  PSYCHOLOGY: 'Psychology',
  HUMANITIES: 'Humanities',
  HISTORY: 'History',
  PHILOSOPHY: 'Philosophy',
  LANGUAGES_AND_LITERATURE: 'Languages and literature',
  ARTS_AND_DESIGN: 'Arts and design',
  MEDIA_AND_JOURNALISM: 'Media and journalism',
  ENVIRONMENT_AND_SUSTAINABILITY: 'Environment and sustainability',
  AGRICULTURE_AND_FOOD: 'Agriculture and food',
  TOURISM_AND_HOSPITALITY: 'Tourism and hospitality',
  TRANSPORT_AND_MOBILITY: 'Transport and mobility',
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
  NO_FORMAL_STUDY: 'No formal study',
  SECONDARY_EDUCATION: 'Secondary education',
  VOCATIONAL_CERTIFICATION: 'Vocational certification',
  BACHELOR_DEGREE: "Bachelor's degree",
  MASTER_DEGREE: "Master's degree",
  DOCTORATE: 'Doctorate',
  POST_DOCTORATE: 'Post-doctorate',
  RESIDENT: 'Resident',
  NON_RESIDENT: 'Non-resident',
  VISITOR: 'Visitor',
  SELF_ASSESSMENT: 'Self-assessment',
};

function formatYearsOfExperienceLabel(years: number): string {
  return `${years} ${years === 1 ? 'year' : 'years'}`;
}

export function formatStoredValueLabel(value?: string | number | null): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return formatYearsOfExperienceLabel(value);
  }

  const trimmed = String(value ?? '').trim();

  if (!trimmed) {
    return '';
  }

  if (/^\d+$/.test(trimmed)) {
    return formatYearsOfExperienceLabel(Number(trimmed));
  }

  const exactLabel = STORED_VALUE_LABELS[trimmed];
  if (exactLabel) {
    return exactLabel;
  }

  return trimmed
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
