import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Shield } from 'lucide-react';
import { Button, Loading } from '../components/ui';

export function ResetAdminPinPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Verify session exists (from magic link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If no session, redirect to login or show error
        setError(t('auth.invalidResetLink'));
        setTimeout(() => navigate('/signin'), 3000);
      }
      setCheckingSession(false);
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (pin.length < 4) {
      setError(t('admin.lockScreen.error.length'));
      setLoading(false);
      return;
    }

    if (pin !== confirmPin) {
      setError(t('admin.lockScreen.error.match'));
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: { admin_pin: pin }
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        navigate('/admin');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update PIN');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="text-vibrant-purple" size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          {t('admin.lockScreen.resetTitle')}
        </h2>
        <p className="text-gray-600 mb-8 text-center">
          {t('admin.lockScreen.resetDesc')}
        </p>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700">
                 {t('admin.lockScreen.newPin')}
               </label>
               <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-2xl tracking-widest"
                placeholder="••••"
                required
              />
            </div>

            <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700">
                 {t('admin.lockScreen.confirmPin')}
               </label>
               <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-2xl tracking-widest"
                placeholder="••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              isLoading={loading}
              className="w-full h-12 text-lg bg-vibrant-purple hover:bg-vibrant-pink"
            >
              {t('admin.common.confirm')}
            </Button>
          </form>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('admin.common.success')}</h3>
            <p className="text-sm text-gray-600 mb-6">Redirecting to Admin Portal...</p>
          </div>
        )}
      </div>
    </div>
  );
}

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
