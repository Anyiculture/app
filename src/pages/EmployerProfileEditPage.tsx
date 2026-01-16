import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EmployerOnboarding } from '../components/EmployerOnboarding';
import { Loading } from '../components/ui';

export function EmployerProfileEditPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) {
    navigate('/signin');
    return null;
  }

  return (
    <EmployerOnboarding 
      mode="edit" 
      userId={user.id} 
      onComplete={() => navigate('/employer/dashboard')} 
    />
  );
}
