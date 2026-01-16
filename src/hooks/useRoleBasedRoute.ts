import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePersonalization } from '../contexts/PersonalizationContext';

export function useRoleBasedRoute(requiredRoles?: string[]) {
  const navigate = useNavigate();
  const location = useLocation();
  const { primaryRole, roles, loading } = usePersonalization();

  useEffect(() => {
    if (loading) return;

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = roles.some(role =>
        requiredRoles.includes(`${role.module}:${role.role_type}`)
      );

      if (!hasRequiredRole) {
        navigate('/home', { state: { from: location }, replace: true });
      }
    }
  }, [loading, roles, requiredRoles, location, navigate]);

  return { primaryRole, roles, loading };
}
