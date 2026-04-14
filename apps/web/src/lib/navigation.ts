import { ROUTES } from './routes';
import { PERMISSIONS } from './permissions';

export const ADMIN_NAV = [
  {
    label: 'Overview',
    href: ROUTES.admin.root,
  },
  {
    label: 'Consultations',
    href: ROUTES.admin.consultations,
    permission: PERMISSIONS.CONSULTATION_VIEW_ADMIN,
  },
  {
    label: 'Articles',
    href: ROUTES.admin.articles,
    permission: PERMISSIONS.ARTICLE_VIEW_ADMIN,
  },
  {
    label: 'Create consultation',
    href: ROUTES.admin.createConsultation,
    permission: PERMISSIONS.CONSULTATION_CREATE,
  },
];

export const PUBLIC_NAV = [
  {
    label: 'Home',
    href: ROUTES.public.home,
  },
  {
    label: 'Consultations',
    href: ROUTES.public.consultations,
  },
  {
    label: 'Articles',
    href: ROUTES.public.articles,
  },
];
