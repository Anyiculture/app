import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { AuthLayout } from '../components/AuthLayout';
import { supabase } from '../lib/supabase';
import { Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui';

export function ResetPasswordPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if we have a session (handled by Supabase auto-login from link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If no session, maybe the link is invalid or expired
        setError(t('auth.invalidResetLink'));
      }
    };
    checkSession();
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        navigate('/signin');
      }, 3000);
    } catch (err: any) {
      setError(err.message || t('auth.resetPasswordError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{t('auth.resetPassword')}</h2>
            <p className="text-sm text-gray-600 mb-6">{t('auth.resetPasswordEnterNew')}</p>

            {error && !success ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('auth.invalidResetLinkTitle', { defaultValue: 'Invalid Link' })}</h3>
                <p className="text-sm text-gray-600 mb-6">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/forgot-password')}
                  className="w-full"
                >
                  {t('auth.requestNewLink', { defaultValue: 'Request New Link' })}
                </Button>
              </div>
            ) : !success ? (
              <>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      {t('auth.newPassword')}
                    </label>
                    <div className="border border-gray-300 rounded-lg h-10 flex items-center px-3 focus-within:border-blue-500">
                      <Lock className="w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('auth.enterNewPassword')}
                        required
                        className="ml-2 flex-1 h-full border-none outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      {t('auth.confirmPassword')}
                    </label>
                    <div className="border border-gray-300 rounded-lg h-10 flex items-center px-3 focus-within:border-blue-500">
                      <Lock className="w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('auth.confirmNewPassword')}
                        required
                        className="ml-2 flex-1 h-full border-none outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  isLoading={loading}
                  className="mt-6 w-full"
                >
                  {t('auth.updatePassword')}
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('auth.passwordUpdated')}</h3>
                <p className="text-sm text-gray-600 mb-6">{t('auth.redirectingToLogin')}</p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/signin')}
                  className="w-full"
                >
                  {t('auth.signIn')}
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}

// Helper component for success icon (not imported from lucide in the main block)
function CheckCircle({ className, size }: { className?: string; size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
