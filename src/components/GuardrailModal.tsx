import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface GuardrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export function GuardrailModal({ isOpen, onClose, feature }: GuardrailModalProps) {
  const { t } = useI18n();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSignUp = () => {
    navigate('/signup');
  };

  const handleSignIn = () => {
    navigate('/signin');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {t('guardrail.title')}
          </h2>
          <p className="text-gray-600 mb-6">
            {feature ? t('guardrail.bodyWithFeature', { feature }) : t('guardrail.body')}
          </p>

          <div className="space-y-3">
            <button
              onClick={handleSignUp}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
            >
              {t('guardrail.signUp')}
            </button>
            <button
              onClick={handleSignIn}
              className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold"
            >
              {t('guardrail.signIn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
