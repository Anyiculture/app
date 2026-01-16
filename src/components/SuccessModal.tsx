import { CheckCircle, X } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  ctaText,
  onCtaClick,
}: SuccessModalProps) {
  const { t } = useI18n();

  if (!isOpen) return null;

  const handleCtaClick = () => {
    if (onCtaClick) {
      onCtaClick();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
          <p className="text-gray-600 mb-6">{message}</p>

          <button
            onClick={handleCtaClick}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
          >
            {ctaText || t('common.ok')}
          </button>
        </div>
      </div>
    </div>
  );
}
