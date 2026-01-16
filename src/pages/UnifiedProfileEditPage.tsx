import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loading } from '../components/ui';
import { AuPairEditProfilePage } from './AuPairEditProfilePage';
import { HostFamilyEditProfilePage } from './HostFamilyEditProfilePage';
import { JobSeekerEditProfilePage } from './JobSeekerEditProfilePage';
import { EmployerProfileEditPage } from './EmployerProfileEditPage';

export function UnifiedProfileEditPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <Loading />;
  
  if (!user) {
    navigate('/signin');
    return null;
  }

  // If role is in metadata but not context, try to fallback or show loading
  // Assuming userRole is populated correctly from context
  const userRole = profile?.role;
  
  switch (userRole) {
    case 'au_pair':
      return <AuPairEditProfilePage />;
    case 'host_family':
      return <HostFamilyEditProfilePage />;
    case 'job_seeker':
      return <JobSeekerEditProfilePage />;
    case 'employer':
      return <EmployerProfileEditPage />;
    default:
      // Fallback or error if role not found
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-red-500">User role not found. Please contact support.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-blue-500 underline">Go Home</button>
        </div>
      );
  }
}
