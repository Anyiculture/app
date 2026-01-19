import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { BackgroundBlobs } from '../../components/ui/BackgroundBlobs';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  User, 
  Settings, 
  Shield, 
  CreditCard,
  LogOut,
  ChevronRight,
  Briefcase,
  Baby,
  Home,
  FileText,
  Bell,
  Eye
} from 'lucide-react';

export function SettingsLayout() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  // const location = useLocation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [activeRoles, setActiveRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    
    // Check active roles to conditionally show sidebar items
    const checkRoles = async () => {
        const roles: string[] = [];
        
        // Check Au Pair
        const { data: auPair } = await supabase.from('au_pair_profiles').select('id').eq('user_id', user.id).maybeSingle();
        if (auPair) roles.push('au_pair');

        // Check Host Family
        const { data: family } = await supabase.from('host_family_profiles').select('id').eq('user_id', user.id).maybeSingle();
        if (family) roles.push('host_family');

        // Check Employer
        const { data: employer } = await supabase.from('profiles_employer').select('id').eq('user_id', user.id).maybeSingle();
        if (employer) roles.push('employer');

        // Check Job Seeker
        const { data: seeker } = await supabase.from('profiles_jobseeker').select('id').eq('user_id', user.id).maybeSingle();
        if (seeker) roles.push('job_seeker');
        
        setActiveRoles(roles);
    };
    
    checkRoles();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { to: '/settings/general', label: t('settings.profile.edit') || 'Edit Profile', icon: User },
    { to: '/settings/security', label: t('settings.accountSecurity'), icon: Shield },
    { to: '/settings/notifications', label: t('settings.notifications.label'), icon: Bell },
    { to: '/settings/billing', label: t('settings.billingPlans'), icon: CreditCard },
  ];

  const roleItems = [
    { role: 'au_pair', to: '/settings/au-pair', label: t('settings.roles.auPair'), icon: Baby },
    { role: 'host_family', to: '/settings/host-family', label: t('settings.roles.hostFamily'), icon: Home },
    { role: 'employer', to: '/settings/employer', label: t('settings.roles.company'), icon: Briefcase },
    { role: 'job_seeker', to: '/settings/job-seeker', label: t('settings.roles.jobSeeker'), icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 relative overflow-hidden font-sans">
      <BackgroundBlobs className="opacity-60" />

      <div className="max-w-6xl mx-auto px-4 relative z-10 animate-in fade-in duration-700">
        
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden flex flex-col md:flex-row min-h-[700px]">
          
          {/* Sidebar */}
          <div className="w-full md:w-80 bg-white/40 border-r border-white/50 p-6 flex flex-col justify-between backdrop-blur-md">
            <div>
                 <div className="mb-8 px-2">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-2">
                        <Settings className="text-blue-600" />
                        {t('settings.title')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">{t('settings.description')}</p>
                 </div>

                <div className="mb-6">
                    <NavLink
                        to={`/profile/${user?.id}`}
                        className={({ isActive }) => `w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all duration-300 ease-out group ${
                            isActive
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 scale-[1.02]'
                                : 'bg-blue-50/50 text-blue-600 hover:bg-blue-50 hover:text-blue-700 border border-blue-100 hover:shadow-sm'
                        }`}
                    >
                        <div className="flex items-center gap-3.5">
                            <Eye size={20} className="text-blue-500 group-hover:text-blue-600" />
                            <span className="font-semibold">{t('profilePage.viewProfile') || 'View Public Profile'}</span>
                        </div>
                        <ChevronRight size={16} className="text-blue-400" />
                    </NavLink>
                </div>

                <nav className="space-y-1">
                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">{t('common.account')}</p>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all duration-300 ease-out group ${
                                isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 scale-[1.02]'
                                    : 'text-gray-600 hover:bg-white/80 hover:text-gray-900 border border-transparent hover:border-white/50 hover:shadow-sm'
                            }`}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className="flex items-center gap-3.5">
                                        <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-500 transition-colors'} strokeWidth={isActive ? 2.5 : 2} />
                                        <span className={`text-[15px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                                    </div>
                                    {isActive && <ChevronRight size={16} className="text-white/80" />}
                                </>
                            )}
                        </NavLink>
                    ))}

                    {activeRoles.length > 0 && (
                        <>
                            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">{t('common.roles')}</p>
                            {roleItems.filter(item => activeRoles.includes(item.role)).map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) => `w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all duration-300 ease-out group ${
                                        isActive
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-200 scale-[1.02]'
                                            : 'text-gray-600 hover:bg-white/80 hover:text-gray-900 border border-transparent hover:border-white/50 hover:shadow-sm'
                                    }`}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div className="flex items-center gap-3.5">
                                                <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-purple-500 transition-colors'} strokeWidth={isActive ? 2.5 : 2} />
                                                <span className={`text-[15px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                                            </div>
                                            {isActive && <ChevronRight size={16} className="text-white/80" />}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </>
                    )}
                </nav>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-200/50">
               <button
                  onClick={() => setShowLogoutDialog(true)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors group"
                >
                  <LogOut size={20} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                  <span className="text-[15px] font-medium">{t('auth.signOut')}</span>
                </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8 md:p-14 overflow-y-auto bg-white/60">
             <Outlet />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleSignOut}
        title={t('common.signOut')}
        message={t('auth.signOutConfirm')}
        confirmText={t('common.signOut')}
        cancelText={t('common.cancel')}
        variant="warning"
      />
    </div>
  );
}
