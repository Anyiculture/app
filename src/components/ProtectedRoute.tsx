import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loading } from './ui/Loading';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
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

  return <>{children}</>;
}
