import { useAuth } from '../../../contexts/AuthContext';
import { useI18n } from '../../../contexts/I18nContext';
import { Search, Globe, Menu } from 'lucide-react';

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user } = useAuth();
  const { language, setLanguage } = useI18n();

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
        >
          <Menu size={20} />
        </button>
        
        {/* Search Bar - Visual Only for now */}
        <div className="hidden md:flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 w-64">
          <Search size={16} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Toggle */}
        <button 
          onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
          className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
        >
          <Globe size={18} />
          <span className="text-xs font-medium uppercase">{language}</span>
        </button>

        <div className="h-6 w-px bg-gray-200" />

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{user?.user_metadata?.full_name || 'Admin User'}</p>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-vibrant-purple text-white flex items-center justify-center font-bold shadow-sm">
            {user?.email?.[0].toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
