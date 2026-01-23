import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Lock, KeyRound } from 'lucide-react';
import { Button } from '../../ui/Button';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../ui/Toast';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    // Admin backdoor for emergency access (Requested "for now")
    if (pin === '1111') {
      onUnlock();
      setLoading(false);
      return;
    }

    const storedPin = user?.user_metadata?.admin_pin;

    if (pin === storedPin) {
      onUnlock();
    } else {
      setError(t('admin.lockScreen.error.invalid'));
      setPin('');
    }
    setLoading(false);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setLoading(true);
    setError('');

    try {
      // 1. Verify password by signing in again (credential check)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: password
      });

      if (signInError) throw new Error('Incorrect password');

      // 2. Clear the PIN
      const { error: updateError } = await supabase.auth.updateUser({
        data: { admin_pin: null }
      });

      if (updateError) throw updateError;
      
      showToast('success', 'PIN removed. Please set a new one in Settings.');
      onUnlock(); // Unlock since PIN is gone
      
    } catch (err: any) {
      setError(err.message || 'Failed to verify password');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setResetSent(true);
      showToast('success', 'Reset link sent to your email');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center animate-in fade-in zoom-in duration-300">
        
        {!isResetting ? (
          <>
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="text-purple-600" size={32} />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('admin.lockScreen.title')}
            </h2>
            <p className="text-gray-500 mb-8">
              {t('admin.lockScreen.subtitle')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full text-center text-3xl tracking-[1em] font-mono py-3 border-b-2 border-gray-300 focus:border-purple-600 focus:outline-none bg-transparent transition-colors"
                  placeholder="••••"
                  maxLength={4}
                  pattern="\d{4}"
                  inputMode="numeric"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm font-medium animate-pulse">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                isLoading={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-all hover:scale-[1.02]"
              >
                {t('admin.common.unlock')}
              </Button>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => { setIsResetting(true); setError(''); }}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  Forgot PIN? (Use Password)
                </button>
              </div>
            </form>
          </>
        ) : !resetSent ? (
          <>
             <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <KeyRound className="text-blue-600" size={32} />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Reset Security Options
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Choose how you want to recover access.
            </p>

            <div className="space-y-6">
               {/* Option 1: Use Password */}
               <div className="bg-gray-50 p-4 rounded-lg">
                 <h3 className="text-sm font-medium text-gray-700 mb-2">Use Password to Remove PIN</h3>
                 <form onSubmit={handleResetSubmit} className="space-y-3">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter Account Password"
                    />
                    <Button
                      type="submit"
                      disabled={!password || loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm"
                    >
                      Verify Password & Unlock
                    </Button>
                 </form>
               </div>

               <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or if you forgot everything</span>
                  </div>
                </div>

                {/* Option 2: Send Email */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Send Reset Email</h3>
                   <form onSubmit={handleSendResetLink} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter Your Email"
                    />
                    <Button
                      type="submit"
                      disabled={!email || loading}
                      className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-md text-sm"
                    >
                      Send Password Reset Link
                    </Button>
                 </form>
                </div>

                <button
                  type="button"
                  onClick={() => setIsResetting(false)}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors w-full"
                >
                  Cancel
                </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <KeyRound className="text-green-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-sm text-gray-600 mb-6">
              We've sent a password reset link to <strong>{email}</strong>.
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Click the link in the email to set a new password, then log in to reset your PIN.
            </p>
            <Button
              onClick={() => { setIsResetting(false); setResetSent(false); }}
              className="w-full"
            >
              Return to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
