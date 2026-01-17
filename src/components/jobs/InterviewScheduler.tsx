import { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { X, Calendar, Video, MapPin, Phone, Building } from 'lucide-react';

import { interviewService, InterviewLocation } from '../../services/interviewService';

interface InterviewSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  jobId: string;
  intervieweeId: string;
  intervieweeName: string;
  onScheduled?: () => void;
}

const LOCATION_OPTIONS: { value: InterviewLocation; label: string; icon: any }[] = [
  { value: 'zoom', label: 'Zoom Video Call', icon: Video },
  { value: 'teams', label: 'Microsoft Teams', icon: Video },
  { value: 'phone', label: 'Phone Call', icon: Phone },
  { value: 'office', label: 'Office Visit', icon: Building },
  { value: 'other', label: 'Other', icon: MapPin }
];

export function InterviewScheduler({
  isOpen,
  onClose,
  applicationId,
  jobId,
  intervieweeId,
  intervieweeName,
  onScheduled
}: InterviewSchedulerProps) {

  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    scheduled_at: '',
    duration_minutes: 60,
    location: 'zoom' as InterviewLocation,
    meeting_url: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await (await import('../../lib/supabase')).supabase.auth.getUser();
      if (!user) throw new Error(t('common.notAuthenticated') || 'Not authenticated');

      await interviewService.scheduleInterview({
        applicationId: applicationId,
        jobId: jobId,
        intervieweeId: intervieweeId,
        scheduledAt: new Date(formData.scheduled_at).toISOString(),
        durationMinutes: formData.duration_minutes,
        location: formData.location,
        meetingUrl: formData.meeting_url || undefined,
        notes: formData.notes || undefined
      });

      onScheduled?.();
      onClose();
      
      // Reset form
      setFormData({
        scheduled_at: '',
        duration_minutes: 60,
        location: 'zoom',
        meeting_url: '',
        notes: ''
      });
    } catch (error: any) {
      console.error('Failed to schedule interview:', error);
      alert(error.message || t('jobs.interview.scheduleFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get minimum date/time (now + 1 hour)
  const minDateTime = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Calendar className="text-emerald-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('jobs.interview.scheduleInterview')}</h2>
              <p className="text-sm text-gray-600">{t('jobs.interview.withName', { name: intervieweeName })}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date & Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('jobs.interview.dateTimeLabel')} *
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              min={minDateTime}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('jobs.interview.durationLabel')} *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 45, 60, 90].map(duration => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => setFormData({ ...formData, duration_minutes: duration })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.duration_minutes === duration
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {duration} {t('jobs.interview.durationSuffix') || 'min'}
                </button>
              ))}
            </div>
          </div>

          {/* Location Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('jobs.interview.locationLabel')} *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {LOCATION_OPTIONS.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, location: option.value })}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.location === option.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium text-sm">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meeting URL (for virtual interviews) */}
          {(['zoom', 'teams', 'other'] as InterviewLocation[]).includes(formData.location) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('jobs.interview.meetingLinkLabel')} {formData.location !== 'other' && '*'}
              </label>
              <input
                type="url"
                value={formData.meeting_url}
                onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                placeholder={t('jobs.interview.meetingLinkPlaceholder')}
                required={formData.location !== 'other'}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('jobs.interview.notesLabel')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('jobs.interview.notesPlaceholder')}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? t('jobs.interview.scheduling') : t('jobs.interview.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
