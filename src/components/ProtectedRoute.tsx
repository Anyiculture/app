import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Loading } from './ui/Loading';
import { accessControlService } from '../services/accessControlService';

interface ProtectedRouteProps {
  children: ReactNode;
  requirePaymentApproval?: boolean;
}

export function ProtectedRoute({ children, requirePaymentApproval = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checkingPaymentAccess, setCheckingPaymentAccess] = useState(requirePaymentApproval);
  const [blockedRedirect, setBlockedRedirect] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const withRedirect = (basePath: string, redirectPath: string) => {
      if (!basePath) return redirectPath;
      if (/[?&]redirect=/.test(basePath)) return basePath;
      const separator = basePath.includes('?') ? '&' : '?';
      return `${basePath}${separator}redirect=${encodeURIComponent(redirectPath)}`;
    };

    const verifyPaymentAccess = async () => {
      if (!requirePaymentApproval || !user?.id) {
        setCheckingPaymentAccess(false);
        setBlockedRedirect(null);
        return;
      }

      setCheckingPaymentAccess(true);
      try {
        const access = await accessControlService.resolveMessagingAccess(user.id);
        if (cancelled) return;

        if (!access.allowed) {
          const currentPath = `${location.pathname}${location.search}`;
          const fallback = `/au-pair/payment?state=free`;
          const redirectPath = withRedirect(access.redirectTo || fallback, currentPath);
          setBlockedRedirect(redirectPath);
          return;
        }

        setBlockedRedirect(null);
      } catch (error) {
        console.error('Failed to verify payment access in route guard:', error);
        setBlockedRedirect(null);
      } finally {
        if (!cancelled) setCheckingPaymentAccess(false);
      }
    };

    void verifyPaymentAccess();
    return () => {
      cancelled = true;
    };
  }, [requirePaymentApproval, user?.id, location.pathname, location.search]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    const redirectPath = `${location.pathname}${location.search}`;
    return <Navigate to={`/signin?redirect=${encodeURIComponent(redirectPath)}`} replace />;
  }

  if (requirePaymentApproval && checkingPaymentAccess) {
    return <Loading />;
  }

  if (requirePaymentApproval && blockedRedirect) {
    return <Navigate to={blockedRedirect} replace />;
  }

  return <>{children}</>;
}
