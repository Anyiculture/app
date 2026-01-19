import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ShoppingBag, 
  CreditCard, 
  Briefcase, 
  Baby, 
  FileText, 
  GraduationCap, 
  MessageSquare, 
  Settings, 
  LogOut,
  MessageCircle
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useI18n } from '../../../contexts/I18nContext';
import { Button } from '../../ui/Button';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  className?: string;
}

export function AdminSidebar({ activeTab, onTabChange, onLogout, className }: AdminSidebarProps) {
  const { t } = useI18n();
  const [visibleModules, setVisibleModules] = useState<string[]>([]);

  useEffect(() => {
    loadSettings();
    window.addEventListener('admin_settings_updated', loadSettings);
    return () => window.removeEventListener('admin_settings_updated', loadSettings);
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem('admin_dashboard_modules');
    if (saved) {
      try {
        const modules = JSON.parse(saved);
        setVisibleModules(modules.filter((m: any) => m.enabled).map((m: any) => m.id));
      } catch (e) {
        // Fallback to all if error
        setVisibleModules(['visa', 'jobs', 'education', 'marketplace', 'events', 'community', 'au-pair']);
      }
    } else {
      // Default all visible
      setVisibleModules(['visa', 'jobs', 'education', 'marketplace', 'events', 'community', 'au-pair']);
    }
  };

  const navItems = [
    { id: 'overview', label: 'admin.sidebar.overview', icon: LayoutDashboard },
    { id: 'users', label: 'admin.sidebar.users', icon: Users },
    // { id: 'content', label: 'admin.sidebar.content', icon: Upload }, 
    { id: 'events', label: 'admin.sidebar.events', icon: Calendar },
    { id: 'marketplace', label: 'admin.sidebar.store', icon: ShoppingBag },
    { id: 'payments', label: 'admin.sidebar.payments', icon: CreditCard },
    { id: 'jobs', label: 'admin.sidebar.jobs', icon: Briefcase },
    { id: 'au-pair', label: 'admin.sidebar.auPair', icon: Baby },
    { id: 'visa', label: 'admin.sidebar.visa', icon: FileText },
    { id: 'education', label: 'admin.sidebar.education', icon: GraduationCap },
    { id: 'community', label: 'admin.sidebar.community', icon: MessageSquare },
    { id: 'settings', label: 'admin.sidebar.settings', icon: Settings },
    { id: 'messaging', label: 'admin.sidebar.messaging', icon: MessageCircle },
  ];

  const filteredNavItems = navItems.filter(item => {
    // Always show core items
    if (['overview', 'users', 'payments', 'settings', 'messaging'].includes(item.id)) return true;
    // Filter others based on settings
    return visibleModules.includes(item.id);
  });

  return (
    <div className={cn("w-64 bg-white border-r border-gray-100 h-screen fixed left-0 top-0 flex flex-col z-30 hidden lg:flex", className)}>
      <div className="p-6 flex items-center gap-3">
        <div className="bg-vibrant-purple p-2 rounded-lg">
           <LayoutDashboard className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-lg text-gray-900 tracking-tight">{t('admin.portal')}</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === item.id 
                ? "bg-purple-50 text-vibrant-purple" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon size={18} className={cn(activeTab === item.id ? "text-vibrant-purple" : "text-gray-400")} />
            {t(item.label) || item.label.split('.').pop()} 
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={onLogout}
        >
          <LogOut size={18} className="mr-2" />
          {t('admin.logout')}
        </Button>
      </div>
    </div>
  );
}
