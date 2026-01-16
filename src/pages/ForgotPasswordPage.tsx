import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { AuthLayout } from '../components/AuthLayout';
import { supabase } from '../lib/supabase';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui';

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
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
          <Link
            to="/signin"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4"
          >
            <ArrowLeft size={16} />
            {t('common.back')}
          </Link>

          <div className="flex flex-col gap-3 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{t('auth.forgotPassword')}</h2>
            <p className="text-sm text-gray-600 mb-2">{t('auth.resetPasswordDescription')}</p>

            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    {t('auth.email')}
                  </label>
                  <div className="border border-gray-300 rounded-lg h-10 flex items-center px-3 focus-within:border-blue-500">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.enterEmail')}
                      required
                      className="ml-2 flex-1 h-full border-none outline-none text-sm"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  isLoading={loading}
                  className="w-full"
                >
                  {t('auth.sendResetLink')}
                </Button>
              </form>
            ) : (
              <div className="text-sm text-green-600 bg-green-50 px-3 py-3 rounded-lg flex items-start gap-2">
                <div className="mt-0.5">
                   <CheckCircle size={16} />
                </div>
                <div>
                  <p className="font-medium mb-1">{t('auth.resetLinkSent')}</p>
                  <p>{t('auth.checkEmailForReset')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
