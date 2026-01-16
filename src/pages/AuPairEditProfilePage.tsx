import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuPairOnboarding } from '../components/AuPairOnboarding';
import { Loading } from '../components/ui';

export function AuPairEditProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) {
    navigate('/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AuPairOnboarding 
        mode="edit" 
        userId={user.id} 
        onComplete={() => navigate('/settings')} 
      />
    </div>
  );
}
