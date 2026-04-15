/* =========================
   ENUM TYPES (STRICT)
========================= */

export type AgeRange =
  | 'AGE_18_24'
  | 'AGE_25_34'
  | 'AGE_35_44'
  | 'AGE_45_54'
  | 'AGE_55_64'
  | 'AGE_65_PLUS'
  | 'PREFER_NOT_TO_SAY';

export type Gender =
  | 'MALE'
  | 'FEMALE'
  | 'NON_BINARY'
  | 'OTHER'
  | 'PREFER_NOT_TO_SAY';

export type City =
  | 'BOLOGNA'
  | 'MODENA'
  | 'PARMA'
  | 'REGGIO_EMILIA'
  | 'RAVENNA'
  | 'RIMINI'
  | 'FERRARA'
  | 'FORLI'
  | 'CESENA'
  | 'PIACENZA'
  | 'IMOLA'
  | 'CARPI'
  | 'FAENZA'
  | 'SASSUOLO'
  | 'RICCIONE'
  | 'CENTO'
  | 'LUGO'
  | 'FORMIGINE'
  | 'CASTELFRANCO_EMILIA'
  | 'SAN_LAZZARO_DI_SAVENA'
  | 'OTHER';

export type StakeholderRole =
  | 'UNIVERSITY_STUDENT'
  | 'SCHOOL_STUDENT'
  | 'BUSINESS_OWNER'
  | 'ENTREPRENEUR'
  | 'PRIVATE_SECTOR_EMPLOYEE'
  | 'PUBLIC_SECTOR_EMPLOYEE'
  | 'FREELANCER'
  | 'SELF_EMPLOYED'
  | 'RESEARCHER'
  | 'ACADEMIC'
  | 'TEACHER'
  | 'NGO_MEMBER'
  | 'VOLUNTEER'
  | 'CIVIL_SERVANT'
  | 'POLICY_MAKER'
  | 'HEALTHCARE_WORKER'
  | 'LEGAL_PROFESSIONAL'
  | 'CREATIVE_PROFESSIONAL'
  | 'UNEMPLOYED'
  | 'RETIRED'
  | 'OTHER';

export type BackgroundCategory =
  | 'BUSINESS_AND_MANAGEMENT'
  | 'ECONOMICS_AND_FINANCE'
  | 'ACCOUNTING_AND_AUDITING'
  | 'MARKETING_AND_COMMUNICATION'
  | 'ENTREPRENEURSHIP_AND_INNOVATION'
  | 'COMPUTER_SCIENCE'
  | 'SOFTWARE_ENGINEERING'
  | 'DATA_SCIENCE'
  | 'ARTIFICIAL_INTELLIGENCE'
  | 'CYBERSECURITY'
  | 'INFORMATION_SYSTEMS'
  | 'ENGINEERING'
  | 'INDUSTRIAL_ENGINEERING'
  | 'CIVIL_ENGINEERING'
  | 'ELECTRICAL_ENGINEERING'
  | 'MECHANICAL_ENGINEERING'
  | 'ARCHITECTURE_AND_URBAN_PLANNING'
  | 'EDUCATION'
  | 'TEACHING_AND_TRAINING'
  | 'SOCIAL_SCIENCES'
  | 'POLITICAL_SCIENCE'
  | 'PUBLIC_ADMINISTRATION'
  | 'INTERNATIONAL_RELATIONS'
  | 'LAW'
  | 'CRIMINOLOGY_AND_PUBLIC_SAFETY'
  | 'HEALTHCARE'
  | 'MEDICINE'
  | 'NURSING'
  | 'PUBLIC_HEALTH'
  | 'PSYCHOLOGY'
  | 'HUMANITIES'
  | 'HISTORY'
  | 'PHILOSOPHY'
  | 'LANGUAGES_AND_LITERATURE'
  | 'ARTS_AND_DESIGN'
  | 'MEDIA_AND_JOURNALISM'
  | 'ENVIRONMENT_AND_SUSTAINABILITY'
  | 'AGRICULTURE_AND_FOOD'
  | 'TOURISM_AND_HOSPITALITY'
  | 'TRANSPORT_AND_MOBILITY'
  | 'OTHER';

export type ExperienceLevel =
  | 'BEGINNER'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'EXPERT';

export type RelationshipToArea =
  | 'RESIDENT'
  | 'NON_RESIDENT'
  | 'VISITOR';

/* =========================
   MAIN TYPES
========================= */

export type Assessment = {
  id: string;
  userId: string;
  secretUserId: string;
  ageRange: AgeRange | null;
  gender: Gender | null;
  city: City | null;
  region: 'EMILIA_ROMAGNA' | null;
  country: 'ITALY' | null;
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
  region: 'EMILIA_ROMAGNA';
  country: 'ITALY';
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
