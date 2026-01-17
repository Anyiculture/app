import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { 
  Briefcase, 
  ShoppingBag, 
  Calendar, 
  FileText, 
  Users, 
  Search, 
  Menu,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  ChevronDown,
  MessageSquare,
  Shield,
  Globe,
  User
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { NotificationCenter } from './NotificationCenter';

// Custom rich icon wrappers with gradients/colors - Smaller Size
const NavIcon = ({ icon: Icon, colorClass }: { icon: any, colorClass: string }) => (
  <div className={`p-1 rounded-lg ${colorClass} transition-colors group-hover:scale-110 duration-200`}>
    <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
  </div>
);

export function TopNavigation() {
  const { user, profile, signOut } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname.startsWith(path);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Check if user is admin
  useEffect(() => {
    if (profile?.role === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [profile]);

  const navItems = [
    { 
      path: '/dashboard', 
      label: t('nav.dashboard'), 
      icon: LayoutDashboard,
      color: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200',
      requiresAuth: true
    },
    { 
      path: '/jobs', 
      label: t('nav.jobs'), 
      icon: Briefcase,
      color: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200'
    },
    { 
      path: '/marketplace', 
      label: t('nav.marketplace'), 
      icon: ShoppingBag,
      color: 'bg-gradient-to-br from-pink-500 to-rose-600 shadow-pink-200'
    },
    { 
      path: '/events', 
      label: t('nav.events'), 
      icon: Calendar,
      color: 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-200'
    },
    { 
      path: '/education', 
      label: t('nav.education'), 
      icon: GraduationCap,
      color: 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-purple-200'
    },
    {
      path: '/messages',
      label: t('nav.messaging'),
      icon: MessageSquare,
      color: 'bg-gradient-to-br from-indigo-400 to-cyan-500 shadow-indigo-200',
      requiresAuth: true
    },
    {
      path: '/aupair',
      label: t('nav.auPair'),
      icon: Users,
      color: 'bg-gradient-to-br from-rose-400 to-pink-500 shadow-rose-200'
    },
    { 
      path: '/visa', 
      label: t('nav.visa'), 
      icon: FileText,
      color: 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-200'
    },
    { 
      path: '/community', 
      label: t('nav.community'), 
      icon: Users,
      color: 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-cyan-200'
    },
    { 
      path: '/candidates', 
      label: t('nav.browseCandidates'),
      icon: Users,
      color: 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-purple-200',
      requiresAuth: true
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsProfileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-300 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-8">
            <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-100 group-hover:scale-105 transition-transform duration-300">
                <img 
                  src="/anyi_global_logo.png" 
                  alt={t('common.brandLogoAlt')} 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 hidden sm:block">
                {t('common.brand')}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-1">
              {navItems.filter(item => !item.requiresAuth || user).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-gray-50 text-gray-900 shadow-sm border border-gray-100 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 font-medium'
                  }`}
                >
                  <span className="text-sm">
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Search Bar - Hidden on small mobile */}
            <div className="hidden md:flex relative group">
              <input 
                type="text" 
                placeholder={t('common.searchPlaceholder')} 
                className="w-40 lg:w-56 pl-9 pr-4 py-2 bg-gray-100 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none placeholder-gray-500"
              />
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
            </div>

            {/* Notifications */}
            <NotificationCenter />

            {/* Language Toggle */}
            {/* Language Toggle */}
            <button
               onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
               className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm font-bold text-gray-600 transition-colors"
             >
               <Globe className="w-4 h-4" />
               {language === 'en' ? 'English' : '中文'}
            </button>

            {/* Profile Dropdown */}
             {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 pl-2 sm:pl-3 ml-1 border-l border-gray-100 focus:outline-none"
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 cursor-pointer hover:shadow-md transition-all">
                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                       {user.user_metadata?.avatar_url ? (
                          <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                       ) : (
                          <span className="font-bold text-sm text-transparent bg-clip-text bg-gradient-to-tr from-indigo-500 to-purple-500">
                            {user.email?.[0].toUpperCase()}
                          </span>
                       )}
                    </div>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in zoom-in-95 z-50">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    <div className="py-1">
                      <Link 
                        to="/dashboard" 
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                      >
                        <LayoutDashboard size={16} />
                        {t('nav.dashboard')}
                      </Link>
                      <Link 
                        to={`/profile/${user.id}`} 
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                      >
                        <User size={16} />
                        {t('common.viewProfile')}
                      </Link>
                      <Link 
                        to="/settings" 
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                      >
                        <Settings size={16} />
                        {t('nav.settings')}
                      </Link>
                      {isAdmin && (
                        <Link 
                          to="/admin" 
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Shield size={16} />
                          {t('nav.adminPortal')}
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-gray-50 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} />
                        {t('auth.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
                <Link to="/signin" className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200">
                  {t('auth.signIn')}
                </Link>
            )}

            {/* Mobile Menu Button */}
            <button 
              className="xl:hidden p-2 text-gray-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="xl:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl absolute w-full shadow-xl">
          <div className="p-4 space-y-2">
             {navItems.filter(item => !item.requiresAuth || user).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <NavIcon icon={item.icon} colorClass={item.color} />
                  <span className="font-medium text-gray-700">{item.label}</span>
                </Link>
              ))}
          </div>
        </div>
      )}
    </header>
  );
}
