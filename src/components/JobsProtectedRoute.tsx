import { useEffect, useState, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { jobsRoleService } from '../services/jobsRoleService';
import { JobsRoleSelection } from './JobsRoleSelection';
import { JobSeekerOnboarding } from './JobSeekerOnboarding';
import { EmployerOnboarding } from './EmployerOnboarding';
import { adminService } from '../services/adminService';
import { useI18n } from '../contexts/I18nContext';

interface JobsProtectedRouteProps {
  children: ReactNode;
  requireRole?: 'job_seeker' | 'employer' | 'any';
  requireProfileCompletion?: boolean;
}

export function JobsProtectedRoute({ children, requireRole = 'any', requireProfileCompletion = true }: JobsProtectedRouteProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'job_seeker' | 'employer' | null>(null);

  useEffect(() => {
    checkUserAccess();
  }, [user]);

  const checkUserAccess = async () => {
    if (!user?.id) {
      navigate('/signin');
      return;
    }

    setLoading(true);
    
    // Check if user is admin - they can access everything
    try {
      const isAdminUser = await adminService.checkIsAdmin();
      if (isAdminUser) {
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
    }

    const roleInfo = await jobsRoleService.checkUserRole(user.id);

    if (!roleInfo.hasRole) {
      setShowRoleSelection(true);
      setLoading(false);
      return;
    }

    if (requireRole !== 'any' && roleInfo.role !== requireRole) {
      alert(`This feature is only available for ${requireRole === 'job_seeker' ? 'job seekers' : 'employers'}`);
      navigate('/jobs');
      return;
    }

    if (!requireProfileCompletion) {
      setLoading(false);
      return;
    }

    if (!roleInfo.profileCompleted) {
      // If we are already on the edit profile page, don't force the onboarding component
      // This allows the EditProfilePage to handle the UI (which includes isEditing=true)
      if (window.location.pathname.includes('/edit-profile')) {
        setLoading(false);
        return;
      }

      // Only set these if we're not already showing onboarding to prevent loops
      if (!showOnboarding) {
        setSelectedRole(roleInfo.role);
        setShowOnboarding(true);
        setShowRoleSelection(false);
      }
      setLoading(false);
      return;
    }
    
    // If we're here, user has role and profile is completed (or not required)
    setShowOnboarding(false);
    setShowRoleSelection(false);

    setLoading(false);
  };

  const handleRoleSelected = async (role: 'job_seeker' | 'employer') => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      await jobsRoleService.setUserRole(user.id, role);
      // Re-check access to ensure all state is consistent
      await checkUserAccess();
    } catch (e) {
      console.error('Error setting role:', e);
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    setLoading(true);
    try {
      // Re-check access to update state
      await checkUserAccess();
    } catch (e) {
      console.error('Error updating status:', e);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (showRoleSelection) {
    return <JobsRoleSelection onRoleSelected={handleRoleSelected} />;
  }

  if (showOnboarding && selectedRole && user?.id) {
    if (selectedRole === 'job_seeker') {
      return <JobSeekerOnboarding userId={user.id} onComplete={handleOnboardingComplete} />;
    }
    if (selectedRole === 'employer') {
      return <EmployerOnboarding userId={user.id} onComplete={handleOnboardingComplete} />;
    }
  }

  return <>{children}</>;
}
