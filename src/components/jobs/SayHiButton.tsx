import { useState } from 'react';
import { MessageCircle, CheckCircle } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { jobInterestService, GREETING_TEMPLATES } from '../../services/jobInterestService';
import { useNavigate } from 'react-router-dom';

interface SayHiButtonProps {
  jobId: string;
  hasInterest: boolean;
  onInterestExpressed: () => void;
  className?: string;
}

export function SayHiButton({
  jobId,
  hasInterest,
  onInterestExpressed,
  className = ''
}: SayHiButtonProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // If already interested, show status
  if (hasInterest) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-medium cursor-default border border-emerald-100 ${className}`}
      >
        <CheckCircle size={18} />
        {t('jobs.interested') || 'Interested'}
      </button>
    );
  }

  // If successful newly
  if (showSuccess) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-medium cursor-default border border-emerald-100 ${className}`}
      >
        <CheckCircle size={18} />
        {t('common.sent') || 'Sent!'}
      </button>
    );
  }

  const handleSayHi = async () => {
    try {
      setLoading(true);
      const message = selectedTemplate === 'custom' ? customMessage : GREETING_TEMPLATES.find(t => t.id === selectedTemplate)?.text || '';
      
      await jobInterestService.sayHi(jobId, message);
      
      setShowSuccess(true);
      onInterestExpressed();
      setIsOpen(false);
      
      // Reset success state after 3s
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error('Failed to say hi:', error);
      if (error.message?.includes('Not authenticated')) {
        navigate('/login', { state: { from: window.location.pathname } });
      } else if (error.message?.includes('already expressed interest')) {
        // If already interested, just show success/interested state
        setShowSuccess(true);
        onInterestExpressed();
        setIsOpen(false);
      } else {
        alert(error.message || t('common.failedToStartChat') || 'Failed to send greeting. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm active:scale-95 ${className}`}
      >
        <MessageCircle size={18} />
        {t('jobs.sayHi')}
      </button>

      {/* Greeting Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {t('jobs.sayHi')}
            </h3>
            
            <p className="text-gray-600 mb-4 text-sm">
              {t('jobs.sayHiPrompt')}
            </p>

            <div className="space-y-3 mb-6">
              {GREETING_TEMPLATES.map(template => (
                <div 
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                      : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900 mb-1">{template.label}</div>
                  {template.id !== 'custom' && (
                    <p className="text-xs text-gray-500 line-clamp-2">{template.text}</p>
                  )}
                </div>
              ))}

              {selectedTemplate === 'custom' && (
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={t('jobs.customMessagePlaceholder')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 h-24 text-sm mt-2"
                  autoFocus
                />
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSayHi}
                disabled={loading || !selectedTemplate || (selectedTemplate === 'custom' && !customMessage.trim())}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
              >
                {loading ? t('jobs.sending') : t('common.send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
