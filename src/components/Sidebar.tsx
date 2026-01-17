import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { adminService } from '../services/adminService';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard,
  Briefcase,
  GraduationCap,
  Calendar,
  ShoppingBag,
  MessageSquare,
  FileText,
  X,
  Settings,
  Globe,
  LogOut,
  Shield
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle?: () => void;
}

export function Sidebar({ isOpen, onClose, onToggle: _onToggle }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      supabase.from('profiles').select('interested_modules').eq('id', user.id).single().then(({ data }: any) => setUserProfile(data));
    }
  }, [user]);

  const checkAdminStatus = async () => {
    const hasAccess = await adminService.checkIsAdmin();
    setIsAdmin(hasAccess);
  };

  if (!user) return null;

  const allNavItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, module: 'dashboard' },
    { to: '/jobs', label: t('nav.jobs'), icon: Briefcase, module: 'jobs' },
    { to: '/education', label: t('nav.education'), icon: GraduationCap, module: 'education' },
    { to: '/events', label: t('nav.events'), icon: Calendar, module: 'events' },
    { to: '/marketplace', label: t('nav.marketplace'), icon: ShoppingBag, module: 'marketplace' },
    { to: '/community', label: t('nav.community'), icon: MessageSquare, module: 'community' },
    // Au Pair removed by user request, can be re-enabled if needed
    // { to: '/au-pair', label: t('nav.auPair'), icon: Baby, module: 'auPair' },
    { to: '/visa', label: t('nav.visa'), icon: FileText, module: 'visa' },
  ];

  // Filter items based on interested_modules
  const navItems = allNavItems.filter(item => {
    // Always show dashboard
    if (item.module === 'dashboard') return true;
    
    // If we haven't loaded profile yet, show basic items or all (decide strategy)
    // Strategy: Show all if loading or no profile found (safe default), or show none?
    // Let's show all by default to avoid empty sidebar, but if profile exists, filter.
    if (!userProfile || !userProfile.interested_modules) return true;

    // Check if module is in interested_modules
    // Note: 'auPair' in nav might match 'au_pair' or 'auPair' in DB.
    // GeneralOnboarding uses: 'jobs', 'marketplace', 'events', 'education', 'community', 'visa', 'auPair'
    return userProfile.interested_modules.includes(item.module);
  });

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleLanguageToggle = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-slate-900 text-white transition-transform duration-300 z-50 w-64 sm:w-72 shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800">
            <Link to="/dashboard" onClick={handleNavClick} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold text-white">{t('common.brandUpper')}</span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label={t('common.closeMenu')}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                      active
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="my-6 border-t border-slate-800" />

            {/* Utility Items */}
            <div className="space-y-1">
              <Link
                to="/messages"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                  isActive('/messages')
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <MessageSquare size={20} className="flex-shrink-0" />
                <span className="font-medium text-sm">{t('nav.messaging')}</span>
              </Link>

              <Link
                to="/settings"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                  isActive('/settings')
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Settings size={20} className="flex-shrink-0" />
                <span className="font-medium text-sm">{t('nav.settings')}</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                    isActive('/admin')
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Shield size={20} className="flex-shrink-0" />
                  <span className="font-medium text-sm">{t('nav.adminPortal')}</span>
                </Link>
              )}

              <button
                onClick={handleLanguageToggle}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-300 hover:bg-slate-800 hover:text-white"
              >
                <Globe size={20} className="flex-shrink-0" />
                <span className="font-medium text-sm flex-1 text-left">
                  {language === 'zh' ? 'English' : '中文'}
                </span>
                <span className="text-xs bg-slate-800 px-2 py-1 rounded">
                  {language.toUpperCase()}
                </span>
              </button>
            </div>
          </nav>

          {/* Footer - Sign Out */}
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-red-400 hover:bg-red-950 hover:text-red-300"
            >
              <LogOut size={20} className="flex-shrink-0" />
              <span className="font-medium text-sm">{t('auth.signOut')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Spacer for desktop when sidebar is open */}
      {isOpen && <div className="hidden lg:block w-72" />}
    </>
  );
}
