type AssessmentOption<Value extends string> = {
  value: Value;
  label: string;
};

export const AGE_RANGE_OPTIONS = [
  { value: 'AGE_18_24', label: '18-24' },
  { value: 'AGE_25_34', label: '25-34' },
  { value: 'AGE_35_44', label: '35-44' },
  { value: 'AGE_45_54', label: '45-54' },
  { value: 'AGE_55_64', label: '55-64' },
  { value: 'AGE_65_PLUS', label: '65+' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const satisfies readonly AssessmentOption<string>[];

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'NON_BINARY', label: 'Non-binary' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const satisfies readonly AssessmentOption<string>[];

export const ASSESSMENT_COUNTRY = 'ITALY' as const;
export const ASSESSMENT_COUNTRY_LABEL = 'Italy';

export const ASSESSMENT_REGION = 'EMILIA_ROMAGNA' as const;
export const ASSESSMENT_REGION_LABEL = 'Emilia-Romagna';

export const CITY_OPTIONS = [
  { value: 'BOLOGNA', label: 'Bologna' },
  { value: 'MODENA', label: 'Modena' },
  { value: 'PARMA', label: 'Parma' },
  { value: 'REGGIO_EMILIA', label: 'Reggio Emilia' },
  { value: 'RAVENNA', label: 'Ravenna' },
  { value: 'RIMINI', label: 'Rimini' },
  { value: 'FERRARA', label: 'Ferrara' },
  { value: 'FORLI', label: 'Forli' },
  { value: 'CESENA', label: 'Cesena' },
  { value: 'PIACENZA', label: 'Piacenza' },
  { value: 'IMOLA', label: 'Imola' },
  { value: 'CARPI', label: 'Carpi' },
  { value: 'FAENZA', label: 'Faenza' },
  { value: 'SASSUOLO', label: 'Sassuolo' },
  { value: 'RICCIONE', label: 'Riccione' },
  { value: 'CENTO', label: 'Cento' },
  { value: 'LUGO', label: 'Lugo' },
  { value: 'FORMIGINE', label: 'Formigine' },
  { value: 'CASTELFRANCO_EMILIA', label: 'Castelfranco Emilia' },
  { value: 'SAN_LAZZARO_DI_SAVENA', label: 'San Lazzaro di Savena' },
  { value: 'OTHER', label: 'Other' },
] as const satisfies readonly AssessmentOption<string>[];

export const STAKEHOLDER_ROLE_OPTIONS = [
  { value: 'UNIVERSITY_STUDENT', label: 'University student' },
  { value: 'SCHOOL_STUDENT', label: 'School student' },
  { value: 'BUSINESS_OWNER', label: 'Business owner' },
  { value: 'ENTREPRENEUR', label: 'Entrepreneur' },
  { value: 'PRIVATE_SECTOR_EMPLOYEE', label: 'Private sector employee' },
  { value: 'PUBLIC_SECTOR_EMPLOYEE', label: 'Public sector employee' },
  { value: 'FREELANCER', label: 'Freelancer' },
  { value: 'SELF_EMPLOYED', label: 'Self-employed' },
  { value: 'RESEARCHER', label: 'Researcher' },
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'NGO_MEMBER', label: 'NGO member' },
  { value: 'VOLUNTEER', label: 'Volunteer' },
  { value: 'CIVIL_SERVANT', label: 'Civil servant' },
  { value: 'POLICY_MAKER', label: 'Policy maker' },
  { value: 'HEALTHCARE_WORKER', label: 'Healthcare worker' },
  { value: 'LEGAL_PROFESSIONAL', label: 'Legal professional' },
  { value: 'CREATIVE_PROFESSIONAL', label: 'Creative professional' },
  { value: 'UNEMPLOYED', label: 'Unemployed' },
  { value: 'RETIRED', label: 'Retired' },
  { value: 'OTHER', label: 'Other' },
] as const satisfies readonly AssessmentOption<string>[];

export const BACKGROUND_CATEGORY_OPTIONS = [
  { value: 'BUSINESS_AND_MANAGEMENT', label: 'Business and management' },
  { value: 'ECONOMICS_AND_FINANCE', label: 'Economics and finance' },
  { value: 'ACCOUNTING_AND_AUDITING', label: 'Accounting and auditing' },
  {
    value: 'MARKETING_AND_COMMUNICATION',
    label: 'Marketing and communication',
  },
  {
    value: 'ENTREPRENEURSHIP_AND_INNOVATION',
    label: 'Entrepreneurship and innovation',
  },
  { value: 'COMPUTER_SCIENCE', label: 'Computer science' },
  { value: 'SOFTWARE_ENGINEERING', label: 'Software engineering' },
  { value: 'DATA_SCIENCE', label: 'Data science' },
  { value: 'ARTIFICIAL_INTELLIGENCE', label: 'Artificial intelligence' },
  { value: 'CYBERSECURITY', label: 'Cybersecurity' },
  { value: 'INFORMATION_SYSTEMS', label: 'Information systems' },
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'INDUSTRIAL_ENGINEERING', label: 'Industrial engineering' },
  { value: 'CIVIL_ENGINEERING', label: 'Civil engineering' },
  { value: 'ELECTRICAL_ENGINEERING', label: 'Electrical engineering' },
  { value: 'MECHANICAL_ENGINEERING', label: 'Mechanical engineering' },
  {
    value: 'ARCHITECTURE_AND_URBAN_PLANNING',
    label: 'Architecture and urban planning',
  },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'TEACHING_AND_TRAINING', label: 'Teaching and training' },
  { value: 'SOCIAL_SCIENCES', label: 'Social sciences' },
  { value: 'POLITICAL_SCIENCE', label: 'Political science' },
  { value: 'PUBLIC_ADMINISTRATION', label: 'Public administration' },
  { value: 'INTERNATIONAL_RELATIONS', label: 'International relations' },
  { value: 'LAW', label: 'Law' },
  {
    value: 'CRIMINOLOGY_AND_PUBLIC_SAFETY',
    label: 'Criminology and public safety',
  },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'MEDICINE', label: 'Medicine' },
  { value: 'NURSING', label: 'Nursing' },
  { value: 'PUBLIC_HEALTH', label: 'Public health' },
  { value: 'PSYCHOLOGY', label: 'Psychology' },
  { value: 'HUMANITIES', label: 'Humanities' },
  { value: 'HISTORY', label: 'History' },
  { value: 'PHILOSOPHY', label: 'Philosophy' },
  {
    value: 'LANGUAGES_AND_LITERATURE',
    label: 'Languages and literature',
  },
  { value: 'ARTS_AND_DESIGN', label: 'Arts and design' },
  { value: 'MEDIA_AND_JOURNALISM', label: 'Media and journalism' },
  {
    value: 'ENVIRONMENT_AND_SUSTAINABILITY',
    label: 'Environment and sustainability',
  },
  { value: 'AGRICULTURE_AND_FOOD', label: 'Agriculture and food' },
  { value: 'TOURISM_AND_HOSPITALITY', label: 'Tourism and hospitality' },
  { value: 'TRANSPORT_AND_MOBILITY', label: 'Transport and mobility' },
  { value: 'OTHER', label: 'Other' },
] as const satisfies readonly AssessmentOption<string>[];

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' },
] as const satisfies readonly AssessmentOption<string>[];

export const RELATIONSHIP_TO_AREA_OPTIONS = [
  { value: 'RESIDENT', label: 'Resident' },
  { value: 'NON_RESIDENT', label: 'Non-resident' },
  { value: 'VISITOR', label: 'Visitor' },
] as const satisfies readonly AssessmentOption<string>[];

export type AgeRange = (typeof AGE_RANGE_OPTIONS)[number]['value'];
export type Gender = (typeof GENDER_OPTIONS)[number]['value'];
export type Country = typeof ASSESSMENT_COUNTRY;
export type Region = typeof ASSESSMENT_REGION;
export type City = (typeof CITY_OPTIONS)[number]['value'];
export type StakeholderRole =
  (typeof STAKEHOLDER_ROLE_OPTIONS)[number]['value'];
export type BackgroundCategory =
  (typeof BACKGROUND_CATEGORY_OPTIONS)[number]['value'];
export type ExperienceLevel =
  (typeof EXPERIENCE_LEVEL_OPTIONS)[number]['value'];
export type RelationshipToArea =
  (typeof RELATIONSHIP_TO_AREA_OPTIONS)[number]['value'];

const ASSESSMENT_LABEL_ENTRIES = [
  ...AGE_RANGE_OPTIONS,
  ...GENDER_OPTIONS,
  { value: ASSESSMENT_COUNTRY, label: ASSESSMENT_COUNTRY_LABEL },
  { value: ASSESSMENT_REGION, label: ASSESSMENT_REGION_LABEL },
  ...CITY_OPTIONS,
  ...STAKEHOLDER_ROLE_OPTIONS,
  ...BACKGROUND_CATEGORY_OPTIONS,
  ...EXPERIENCE_LEVEL_OPTIONS,
  ...RELATIONSHIP_TO_AREA_OPTIONS,
] as const;

export const ASSESSMENT_VALUE_LABELS = Object.freeze(
  Object.fromEntries(
    ASSESSMENT_LABEL_ENTRIES.map(({ value, label }) => [value, label]),
  ) as Record<string, string>,
);

export type Assessment = {
  id: string;
  userId: string;
  secretUserId: string;
  ageRange: AgeRange | null;
  gender: Gender | null;
  city: City | null;
  region: Region | null;
  country: Country | null;
  stakeholderRole: StakeholderRole | null;
  backgroundCategory: BackgroundCategory | null;
  experienceLevel: ExperienceLevel | null;
  relationshipToArea: RelationshipToArea | null;
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
  ageRange: AgeRange;
  gender: Gender;
  city: City;
  region: Region;
  country: Country;
  stakeholderRole: StakeholderRole;
  backgroundCategory: BackgroundCategory;
  experienceLevel: ExperienceLevel;
  relationshipToArea: RelationshipToArea;
  assessmentCompleted: boolean;
};

export type SaveAssessmentResponse = {
  message: string;
  assessment: Assessment;
};
