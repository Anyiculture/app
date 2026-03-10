import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loading } from './ui/Loading';

interface ProtectedRouteProps {
  children: ReactNode;
  requirePaymentApproval?: boolean;
}

export function ProtectedRoute({ children, requirePaymentApproval = false }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    // Redirect to login but maybe save the location to redirect back?
    // For now, just simple redirect
    setTimeout(() => navigate('/signin'), 0);
    return <Loading />; // or null
  }

  // Check for payment approval if required
  if (requirePaymentApproval && profile) {
    const isHostFamily = (profile as any).au_pair_role === 'host_family';
    const isPremium = (profile as any).au_pair_subscription_status === 'premium';
    
    if (isHostFamily && !isPremium) {
      setTimeout(() => navigate('/au-pair/payment'), 0);
      return <Loading />;
    }
  }

  return <>{children}</>;
}
