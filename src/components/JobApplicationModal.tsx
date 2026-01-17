import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Button } from './ui/Button';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  companyName?: string;
}

export function JobApplicationModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName
}: JobApplicationModalProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    cover_letter: '',
    resume_url: '',
    portfolio_url: '',
    additional_info: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    setError('');

    try {
      const { error: submitError } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          user_id: user.id,
          status: 'pending',
          cover_letter: formData.cover_letter || null,
          resume_url: formData.resume_url || null,
          portfolio_url: formData.portfolio_url || null,
          additional_info: formData.additional_info || null
        });

      if (submitError) throw submitError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          cover_letter: '',
          resume_url: '',
          portfolio_url: '',
          additional_info: ''
        });
      }, 2000);
    } catch (err: any) {
      console.error('Failed to submit application:', err);
      setError(err.message || t('common.failedToSubmitApplication'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t('applications.applicationSubmitted')}
          </h3>
          <p className="text-gray-600">
            {t('applications.applicationSubmittedDesc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('applications.applyForPosition')}</h2>
            <p className="text-gray-600 mt-1">
              {jobTitle} {companyName && `• ${companyName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('applications.coverLetter')} *
            </label>
            <textarea
              value={formData.cover_letter}
              onChange={(e) => setFormData(prev => ({ ...prev, cover_letter: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              rows={6}
              placeholder={t('applications.coverLetterPlaceholder')}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{t('applications.coverLetterHelperText')}</p>
          </div>

          {/* Resume URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('applications.resumeUrl')} *
            </label>
            <input
              type="url"
              value={formData.resume_url}
              onChange={(e) => setFormData(prev => ({ ...prev, resume_url: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder={t('applications.resumeUrlPlaceholder')}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{t('applications.resumeUrlHelperText')}</p>
          </div>

          {/* Portfolio URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('applications.portfolioUrl')} ({t('auth.optional')})
            </label>
            <input
              type="url"
              value={formData.portfolio_url}
              onChange={(e) => setFormData(prev => ({ ...prev, portfolio_url: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder={t('applications.portfolioUrlPlaceholder')}
            />
            <p className="text-xs text-gray-500 mt-1">{t('applications.portfolioUrlHelperText')}</p>
          </div>

          {/* Additional Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('applications.additionalInfo')} ({t('auth.optional')})
            </label>
            <textarea
              value={formData.additional_info}
              onChange={(e) => setFormData(prev => ({ ...prev, additional_info: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              rows={4}
              placeholder={t('applications.additionalInfoPlaceholder')}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? t('applications.submitting') : t('applications.submitApplication')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
