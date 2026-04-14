export const ROUTES = {
  public: {
    home: '/',
    consultations: '/consultations',
    articles: '/articles',
    contact: '/contact',
    privacy: '/privacy',
    terms: '/terms',
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    verifyEmail: '/verify-email',
  },

  user: {
    dashboard: '/dashboard',
    assessment: '/assessment',
  },

  admin: {
    root: '/admin',
    consultations: '/admin/consultations',
    articles: '/admin/articles',
    createConsultation: '/admin/votes',
    assessments: '/admin/assessments',
  },
} as const;
