import { Navigate, useParams } from 'react-router-dom';

const SECTION_MAP: Record<string, string> = {
  general: 'personal',
  preview: 'overview',
  security: 'security',
  notifications: 'notifications',
  billing: 'billing',
  'au-pair': 'roles',
  'host-family': 'roles',
  employer: 'roles',
  'job-seeker': 'roles',
};

export function LegacySettingsRedirectPage() {
  const params = useParams();
  const raw = params['*'] || '';
  const firstSegment = raw.split('/').filter(Boolean)[0] || '';
  const section = SECTION_MAP[firstSegment] || 'overview';

  return <Navigate to={`/account?section=${section}`} replace />;
}
