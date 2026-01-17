import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Globe, 
  Calendar, 
  FileText, 
  UserCheck, 
  Settings, 
  LogOut, 
  CreditCard,
  BarChart3,
  Activity
} from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
}

export function AdminSidebar({ activeTab, setActiveTab, onLogout }: AdminSidebarProps) {
  const { t } = useI18n();

  const navItems = [
    { id: 'overview', label: t('admin.dashboard.title'), icon: LayoutDashboard },
    { id: 'analytics', label: t('admin.analytics.title'), icon: BarChart3 },
    { id: 'users', label: t('admin.userManagement'), icon: Users },
    { id: 'jobs', label: t('admin.jobsManagement'), icon: Briefcase },
    { id: 'marketplace', label: t('admin.marketplace.moderation'), icon: Globe },
    { id: 'events', label: t('admin.eventsManagement'), icon: Calendar },
    { id: 'visa', label: t('admin.visaManagement.title'), icon: FileText },
    { id: 'au-pair', label: t('admin.auPairManagement'), icon: UserCheck },
    { id: 'payments', label: t('admin.payments.title'), icon: CreditCard },
  ];

  const generalItems = [
    { id: 'settings', label: t('admin.settings.title'), icon: Settings },
    { id: 'activity', label: t('admin.activity'), icon: Activity },
  ];

  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-100 flex flex-col z-50">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          A
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">AnyiCulture</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-8">
        <div>
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {t('admin.sidebar.navigation')}
          </p>
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {t('admin.sidebar.general')}
          </p>
          <div className="space-y-1">
            {generalItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logout Area */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={18} />
          {t('common.signOut') || 'Log Out'}
        </button>
      </div>
    </div>
  );
}
