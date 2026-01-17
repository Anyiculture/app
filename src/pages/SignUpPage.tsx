import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft } from 'lucide-react';

export function SignUpPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (!agreeTerms) {
      setError(t('auth.mustAgreeToTerms'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, formData.firstName, formData.lastName);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message || t('auth.signUpError'));
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
              Start your adventure <br />with AnyiCulture.
            </h1>
            <p className="text-lg text-gray-200 max-w-md">
              Create an account to discover families and au pairs from around the globe.
            </p>
          </div>
          <div className="text-sm text-gray-400">
            © 2026 AnyiCulture. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex-1 flex flex-col justify-start pt-12 sm:pt-20 lg:justify-center lg:pt-0 px-4 sm:px-6 lg:px-20 xl:px-24">
        {/* Mobile Header Text */}
        <div className="lg:hidden text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl shadow-lg shadow-blue-100 overflow-hidden">
            <img 
              src="/anyi_global_logo.png" 
              alt="AnyiCulture" 
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight font-display">AnyiCulture</h1>
          <p className="text-base text-gray-600 mt-2 font-medium">Start your adventure today</p>
        </div>

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
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('auth.signUp')}</h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('auth.haveAccount')}{' '}
              <Link to="/signin" className="font-medium text-purple-600 hover:text-purple-500">
                {t('auth.signIn')}
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  {t('auth.firstName')} *
                </label>
                <div className="border border-gray-300 rounded-lg h-10 flex items-center px-3 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-colors">
                  <User className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder={t('auth.firstNamePlaceholder')}
                    required
                    className="ml-2 flex-1 h-full border-none outline-none text-sm bg-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  {t('auth.lastName')} *
                </label>
                <div className="border border-gray-300 rounded-lg h-10 flex items-center px-3 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-colors">
                  <User className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder={t('auth.lastNamePlaceholder')}
                    required
                    className="ml-2 flex-1 h-full border-none outline-none text-sm bg-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                {t('auth.email')} *
              </label>
              <div className="border border-gray-300 rounded-lg h-10 flex items-center px-3 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-colors">
                <Mail className="w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder={t('auth.enterEmail')}
                  required
                  className="ml-2 flex-1 h-full border-none outline-none text-sm bg-transparent"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')} *
              </label>
              <div className="border border-gray-300 rounded-lg h-10 flex items-center px-3 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-colors">
                <Lock className="w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder={t('auth.enterPassword')}
                  required
                  minLength={6}
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
              <p className="text-xs text-gray-500 mt-1">{t('auth.passwordRequirement')}</p>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                {t('auth.confirmPassword')} *
              </label>
              <div className="border border-gray-300 rounded-lg h-10 flex items-center px-3 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-colors">
                <Lock className="w-4 h-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  required
                  minLength={6}
                  className="ml-2 flex-1 h-full border-none outline-none text-sm bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 accent-purple-600"
              />
              <label htmlFor="terms" className="text-gray-700 cursor-pointer">
                {t('auth.agreeToTerms')}{' '}
                <Link to="/terms" className="text-purple-600 hover:underline">
                  {t('auth.termsOfService')}
                </Link>
                {' '}{t('auth.and')}{' '}
                <Link to="/privacy" className="text-purple-600 hover:underline">
                  {t('auth.privacyPolicy')}
                </Link>
              </label>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                {t('auth.accountCreated')}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? t('common.loading') : t('auth.signUp')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
