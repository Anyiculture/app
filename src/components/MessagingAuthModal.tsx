import { useNavigate } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface MessagingAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MessagingAuthModal({ isOpen, onClose }: MessagingAuthModalProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4">
            <MessageSquare className="text-blue-600" size={28} />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t('messaging.requiresAuth.title')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('messaging.requiresAuth.description')}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              {t('messaging.requiresAuth.logIn')}
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
            >
              {t('messaging.requiresAuth.signUp')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
