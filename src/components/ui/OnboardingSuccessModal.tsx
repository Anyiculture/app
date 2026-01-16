import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { Button } from './Button';

interface OnboardingSuccessModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  redirectPath?: string;
  autoRedirectSeconds?: number;
  onClose?: () => void;
}

export function OnboardingSuccessModal({
  isOpen,
  title,
  message,
  redirectPath = '/dashboard',
  autoRedirectSeconds = 3,
  onClose
}: OnboardingSuccessModalProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(autoRedirectSeconds);

  const finalTitle = title || t('common.onboarding.complete');
  const finalMessage = message || t('common.onboarding.successMessage');

  useEffect(() => {
    if (!isOpen) return;

    setCountdown(autoRedirectSeconds);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Call onClose before navigating to ensure state updates happen first
          onClose?.();
          setTimeout(() => {
             navigate(redirectPath);
             // Force reload if path is same to trigger re-checks
             if (window.location.pathname === redirectPath) {
                window.location.reload();
             }
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, autoRedirectSeconds, redirectPath, navigate, onClose]);

  const handleGoToDashboard = () => {
    onClose?.();
    setTimeout(() => {
       navigate(redirectPath);
       if (window.location.pathname === redirectPath) {
          window.location.reload();
       }
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-300">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full mb-6 animate-in zoom-in duration-500">
            <CheckCircle className="text-green-600" size={48} />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {finalTitle}
          </h2>

          <p className="text-lg text-gray-600 mb-6">
            {finalMessage}
          </p>

          <div className="text-sm text-gray-500 mb-6">
            {t('common.onboarding.redirectingIn', { count: countdown })}
          </div>

          <Button
            onClick={handleGoToDashboard}
            className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:shadow-lg"
            size="lg"
          >
            {t('common.onboarding.goToDashboardNow')}
          </Button>
        </div>
      </div>
    </div>
  );
}
