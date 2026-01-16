import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuPairOnboarding } from '../components/AuPairOnboarding';
import { HostFamilyOnboarding } from '../components/HostFamilyOnboarding';
import { useEffect, useState } from 'react';
import { auPairService } from '../services/auPairService';

export function AuPairOnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'host_family' | 'au_pair' | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/signin?redirect=/aupair/onboarding');
      return;
    }
    
    // Check if user has a role
    const checkRole = async () => {
        try {
            setLoading(true);
            const status = await auPairService.getUserSubscriptionStatus();
            if (!status.role) {
                // No role, go to selection
                navigate('/aupair');
            } else if (status.onboardingCompleted) {
                // Already done, go to dashboard
                navigate('/aupair');
            } else {
                setRole(status.role);
            }
        } catch (e) {
            console.error(e);
            navigate('/aupair');
        } finally {
            setLoading(false);
        }
    };
    checkRole();
  }, [user, navigate]);

  const handleComplete = () => {
    // Redirect based on role
    if (role === 'au_pair') {
        navigate('/families/browse');
    } else {
        navigate('/au-pairs/browse');
    }
  };

  if (loading) {
     return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
     );
  }

  if (role === 'au_pair') {
    return <AuPairOnboarding userId={user!.id} onComplete={handleComplete} />;
  }

  if (role === 'host_family') {
    return <HostFamilyOnboarding userId={user!.id} onComplete={handleComplete} />;
  }

  return null;
}
