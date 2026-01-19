import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { adminService } from '../services/adminService';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      
      // Check for admin access
      try {
        const isAdmin = await adminService.checkIsAdmin();
        if (isAdmin) {
          navigate('/admin');
          return;
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }

      const returnTo = searchParams.get('returnTo');
      navigate(returnTo || '/dashboard');
    } catch (err: any) {
      setError(err.message || t('auth.signInError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Decoration Side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 to-blue-900/90 mix-blend-multiply z-10" />
        <img 
          src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt="Cultural Exchange"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="relative z-20 flex flex-col justify-between h-full p-12 text-white">
          <div className="text-2xl font-bold tracking-tight">AnyiCulture</div>
          <div>
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Connect with families & <br />au pairs worldwide.
            </h1>
            <p className="text-lg text-gray-200 max-w-md">
              Join our trusted community and start your cultural exchange journey today.
            </p>
          </div>
          <div className="text-sm text-gray-400">
            © 2026 AnyiCulture. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-600 transition-colors border border-gray-200"
            >
              {language === 'en' ? 'EN' : '中'}
            </button>
          </div>
          <div className="mb-8">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8"
            >
              <ArrowLeft size={16} />
              {t('common.back')}
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('auth.signIn')}</h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('auth.noAccount')}{' '}
              <Link to="/signup" className="font-medium text-purple-600 hover:text-purple-500">
                {t('auth.signUp')}
              </Link>
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                {t('auth.email')}
              </label>
              <div className="border border-gray-300 rounded-lg h-10 flex items-center px-3 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-colors">
                <Mail className="w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.enterEmail')}
                  required
                  className="ml-2 flex-1 h-full border-none outline-none text-sm bg-transparent"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')}
              </label>
              <div className="border border-gray-300 rounded-lg h-10 flex items-center px-3 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-colors">
                <Lock className="w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.enterPassword')}
                  required
                  className="ml-2 flex-1 h-full border-none outline-none text-sm bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="remember" className="text-gray-700 cursor-pointer select-none">
                  {t('auth.rememberMe')}
                </label>
              </div>
              <Link to="/forgot-password" className="text-purple-600 hover:text-purple-500 font-medium hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? t('common.loading') : t('auth.signIn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
