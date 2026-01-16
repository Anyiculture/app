import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { JobSeekerOnboarding } from '../components/JobSeekerOnboarding';
import { Loading } from '../components/ui';

export function JobSeekerEditProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) {
    navigate('/signin');
    return null;
  }

  return (
    <JobSeekerOnboarding 
      mode="edit" 
      userId={user.id} 
      onComplete={() => navigate('/jobs')} 
    />
  );
}
