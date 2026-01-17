import { Search, Bell, Sun, Moon, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';

interface AdminHeaderProps {
  title?: string;
}

export function AdminHeader({}: AdminHeaderProps) {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder={t('admin.header.searchPlaceholder')}
            className="w-full h-10 pl-10 pr-4 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex items-center h-5 px-1.5 text-[10px] font-medium text-gray-400 bg-white border border-gray-200 rounded">⌘ K</kbd>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6 ml-4">
        {/* Theme Toggle (Mock) */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
          <button className="p-1.5 bg-white rounded-full shadow-sm text-yellow-500">
            <Sun size={14} />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-gray-600">
            <Moon size={14} />
          </button>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-gray-500" />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
