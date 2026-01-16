import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Home,
  Users,
  Briefcase,
  Heart,
  Calendar,
  ShoppingBag,
  Plane,
  Crown,
  MessageCircle,
  Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { messagingService } from '../services/messagingService';
import { NotificationCenter } from './NotificationCenter';
import { GlobalSearch } from './GlobalSearch';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const conversations = await messagingService.getConversations();
      const total = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
      setUnreadCount(total);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const navItems = [
    { name: t('nav.home'), path: '/', icon: Home },
    { name: t('nav.community'), path: '/community', icon: Users },
    { name: t('nav.jobs'), path: '/jobs', icon: Briefcase },
    { name: t('nav.visa'), path: '/visa', icon: Plane },
    { name: t('nav.events'), path: '/events', icon: Calendar },
    { name: t('nav.messaging'), path: '/messages', icon: MessageCircle, badge: unreadCount },
    { name: t('nav.subscription'), path: '/subscription', icon: Crown },
    { name: t('nav.lifestyle'), path: '/lifestyle', icon: Heart },
    { name: t('nav.marketplace'), path: '/marketplace', icon: ShoppingBag }
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <span className="text-2xl font-display font-bold bg-gradient-to-r from-vibrant-purple to-vibrant-pink bg-clip-text text-transparent">
                AnYiculture
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                    location.pathname === item.path
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <GlobalSearch />
            {user && <NotificationCenter />}
            <button
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
              title={language === 'en' ? 'Switch to Chinese' : '切换到英文'}
            >
              <Globe size={18} />
              <span className="font-semibold">{language === 'en' ? '中文' : 'EN'}</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setLanguage(language === 'en' ? 'zh' : 'en');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
            >
              <Globe size={20} />
              <span>{language === 'en' ? '切换到中文' : 'Switch to English'}</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;