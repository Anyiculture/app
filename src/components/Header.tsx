import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Globe, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useStripe } from '../hooks/useStripe';
import { SubscriptionStatus } from './SubscriptionStatus';

export function Header() {
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const { getCurrentPlan } = useStripe();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const currentPlan = getCurrentPlan();

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600">{t('common.brand')}</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {currentPlan && (
              <SubscriptionStatus 
                planName={currentPlan.name}
                isActive={currentPlan.isActive}
                className="hidden md:flex"
              />
            )}
            
            <button
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
              title={language === 'en' ? t('common.switchToChinese') : t('common.switchToEnglish')}
            >
              <Globe size={18} />
              <span className="font-semibold">{language === 'en' ? '中文' : 'EN'}</span>
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                >
                  <User size={18} />
                  <span>{user.email?.split('@')[0] || 'User'}</span>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      {t('settings.title') || 'Settings'}
                    </Link>
                    <button
                      onClick={async () => {
                        await signOut();
                        setIsProfileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('auth.signOut') || 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/signin"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  {t('auth.login') || 'Login'}
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {t('auth.signUp') || 'Sign Up'}
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <span className="text-sm font-bold">{language === 'en' ? '中' : 'EN'}</span>
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            {currentPlan && (
              <div className="px-3 py-2">
                <SubscriptionStatus 
                  planName={currentPlan.name}
                  isActive={currentPlan.isActive}
                />
              </div>
            )}
            
            <button
              onClick={() => {
                setLanguage(language === 'en' ? 'zh' : 'en');
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
            >
              <Globe size={20} />
              <span>{language === 'en' ? '切换到中文' : 'Switch to English'}</span>
            </button>

            {user ? (
              <>
                <Link
                  to="/settings"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('settings.title') || 'Settings'}
                </Link>
                <button
                  onClick={async () => {
                    await signOut();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  {t('auth.signOut') || 'Sign Out'}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('auth.login') || 'Login'}
                </Link>
                <Link
                  to="/signup"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('auth.signUp') || 'Sign Up'}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
