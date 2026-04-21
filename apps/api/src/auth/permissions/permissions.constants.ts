export const PERMISSIONS = {
  // ========================
  // CONSULTATIONS
  // ========================
  CONSULTATION_CREATE: 'CONSULTATION_CREATE',
  CONSULTATION_EDIT: 'CONSULTATION_EDIT',
  CONSULTATION_VIEW_ADMIN: 'CONSULTATION_VIEW_ADMIN',

  // ========================
  // RESULTS / ANALYTICS
  // ========================
  RESULTS_VIEW_ADMIN: 'RESULTS_VIEW_ADMIN',
  ANALYTICS_VIEW_ADMIN: 'ANALYTICS_VIEW_ADMIN',
  PARTICIPANTS_VIEW_ADMIN: 'PARTICIPANTS_VIEW_ADMIN',

  // ========================
  // ASSESSMENT (SENSITIVE)
  // ========================
  ASSESSMENT_SECRET_LOOKUP: 'ASSESSMENT_SECRET_LOOKUP',

  // ========================
  // ARTICLES
  // ========================
  ARTICLE_CREATE: 'ARTICLE_CREATE',
  ARTICLE_EDIT: 'ARTICLE_EDIT',
  ARTICLE_DELETE: 'ARTICLE_DELETE',
  ARTICLE_PUBLISH: 'ARTICLE_PUBLISH',
  ARTICLE_VIEW_ADMIN: 'ARTICLE_VIEW_ADMIN',

  // ========================
  // MEDIA
  // ========================
  MEDIA_UPLOAD: 'MEDIA_UPLOAD',

  // ========================
  // SYSTEM / ADMIN
  // ========================
  USER_MANAGEMENT: 'USER_MANAGEMENT',
  AUDIT_LOG_VIEW: 'AUDIT_LOG_VIEW',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
