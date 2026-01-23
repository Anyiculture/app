import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminService, AdminStats } from '../services/adminService';
import { Loading } from '../components/ui/Loading';
import { AdminLayout } from '../components/admin/layout/AdminLayout';
import { OverviewPanel } from '../components/admin/overview/OverviewPanel';
import { VisaAdminPanel } from '../components/admin/VisaAdminPanel';
import { AuPairAdminPanel } from '../components/admin/AuPairAdminPanel';
import { EducationAdminPanel } from '../components/admin/education/EducationAdminPanel';
import { UsersAdminPanel } from '../components/admin/users/UsersAdminPanel';
import { AdminSettingsPanel } from '../components/admin/settings/AdminSettingsPanel';
import { EventsAdminPanel } from '../components/admin/EventsAdminPanel';
import { MarketplaceAdminPanel } from '../components/admin/marketplace/MarketplaceAdminPanel';
import { JobsAdminPanel } from '../components/admin/jobs/JobsAdminPanel';
import { CommunityAdminPanel } from '../components/admin/CommunityAdminPanel';
import { PaymentsAdminPanel } from '../components/admin/PaymentsAdminPanel';
import { MessagingAdminPanel } from '../components/admin/MessagingAdminPanel';
import AIContentCreator from '../components/admin/content/AIContentCreator';
import { LockScreen } from '../components/admin/ui/LockScreen';

export function AdminPortalPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  
  // Get active tab from URL or default to 'overview'
  const activeTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    try {
      setLoading(true);
      
      // Check for Admin PIN lock
      const hasPin = user.user_metadata?.admin_pin;
      const isUnlocked = sessionStorage.getItem('admin_unlocked') === 'true';
      
      if (hasPin && !isUnlocked) {
        setIsLocked(true);
      }

      const hasAccess = await adminService.checkIsAdmin();
      
      if (!hasAccess) {
        console.warn('User does not have admin access, redirecting...');
        navigate('/dashboard');
        return;
      }

      const statsData = await adminService.getAdminStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error in AdminPortal access check:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = () => {
    sessionStorage.setItem('admin_unlocked', 'true');
    setIsLocked(false);
  };

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/signin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (isLocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  if (!stats) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPanel stats={stats} />;
      case 'users':
        return <UsersAdminPanel />;
      case 'ai-creator':
        return <AIContentCreator />;
      case 'jobs':
        return <JobsAdminPanel />;
      case 'marketplace':
        return <MarketplaceAdminPanel />;
      case 'events':
        return <EventsAdminPanel />;
      case 'payments':
        return <PaymentsAdminPanel />;
      case 'visa':
        return <VisaAdminPanel />;
      case 'au-pair':
        return <AuPairAdminPanel />;
      case 'education':
        return <EducationAdminPanel />;
      case 'community':
        return <CommunityAdminPanel />;
      case 'messaging':
        return <MessagingAdminPanel />;
      case 'settings':
        return <AdminSettingsPanel />;
      default:
        return <OverviewPanel stats={stats} />;
    }
  };

  return (
    <AdminLayout 
      activeTab={activeTab} 
      onTabChange={handleTabChange} 
      onLogout={handleLogout}
    >
      {renderContent()}
    </AdminLayout>
  );
}
