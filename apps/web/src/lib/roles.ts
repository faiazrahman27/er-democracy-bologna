export function isAdminRole(role: string | null | undefined): boolean {
  return (
    role === 'SUPER_ADMIN' ||
    role === 'CONSULTATION_ADMIN' ||
    role === 'CONTENT_ADMIN' ||
    role === 'ANALYTICS_ADMIN' ||
    role === 'AUDITOR'
  );
}
