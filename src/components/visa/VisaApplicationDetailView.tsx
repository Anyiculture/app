
import { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { VisaApplication, VisaDocument, VisaApplicationHistory } from '../../services/visaService';
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, AlertCircle, MessageSquare, Download } from 'lucide-react';
import { Button } from '../ui/Button';

interface VisaApplicationDetailViewProps {
  application: VisaApplication;
  documents: VisaDocument[];
  history: VisaApplicationHistory[];
  onBack: () => void;
  onNavigateToUpload?: (id: string) => void;
  onNavigateToMessages?: () => void;
}

export function VisaApplicationDetailView({
  application,
  documents,
  history,
  onBack,
  onNavigateToUpload,
  onNavigateToMessages
}: VisaApplicationDetailViewProps) {
  const { t } = useI18n();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="text-gray-500" size={24} />;
      case 'submitted':
      case 'in_review': return <AlertCircle className="text-blue-500" size={24} />;
      case 'documents_requested': return <FileText className="text-orange-500" size={24} />;
      case 'approved': return <CheckCircle className="text-green-500" size={24} />;
      case 'rejected': return <XCircle className="text-red-500" size={24} />;
      default: return <Clock className="text-gray-500" size={24} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'submitted':
      case 'in_review': return 'bg-blue-100 text-blue-700';
      case 'documents_requested': return 'bg-orange-100 text-orange-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-gray-100 min-h-full">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          <span>{t('common.back')}</span>
        </button>

        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1">
                {t(`visa.types.${application.visa_type}.title`)}
              </h1>
              <p className="text-sm text-gray-600">
                {t('visa.detail.applicationId')}: {application.id.substring(0, 8)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon(application.status)}
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                {t(`visa.status.${application.status}`)}
              </span>
            </div>
          </div>

          {application.status === 'documents_requested' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-orange-900 mb-1">
                    {t('visa.detail.documentsRequested')}
                  </h3>
                  <p className="text-sm text-orange-800 mb-3">
                    {t('visa.detail.documentsRequestedDesc')}
                  </p>
                  {onNavigateToUpload && (
                    <Button
                      size="sm"
                      onClick={() => onNavigateToUpload(application.id)}
                    >
                      {t('visa.detail.uploadDocuments')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {application.status === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">
                    {t('visa.detail.approved')}
                  </h3>
                  <p className="text-sm text-green-800">
                    {application.decision_notes || t('visa.detail.approvedDesc')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {application.status === 'rejected' && application.decision_notes && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    {t('visa.detail.rejected')}
                  </h3>
                  <p className="text-sm text-red-800">{application.decision_notes}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">{t('visa.detail.submitted')}</h3>
              <p className="text-gray-900">
                {application.submitted_at
                  ? new Date(application.submitted_at).toLocaleString()
                  : t('visa.detail.notSubmitted')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">{t('visa.detail.lastUpdated')}</h3>
              <p className="text-gray-900">{new Date(application.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('visa.detail.personalInfo')}</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">{t('visa.detail.fullName')}</h3>
                  <p className="text-gray-900">{application.full_name || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">{t('visa.detail.nationality')}</h3>
                  <p className="text-gray-900">{application.nationality_country || '-'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">{t('visa.detail.passportNumber')}</h3>
                    <p className="text-gray-900">{application.passport_number || '-'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">{t('visa.detail.passportExpiry')}</h3>
                    <p className="text-gray-900">
                      {application.passport_expiry
                        ? new Date(application.passport_expiry).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">{t('visa.detail.currentResidence')}</h3>
                  <p className="text-gray-900">
                    {[application.current_city, application.current_province, application.current_country]
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('visa.detail.purposeDetails')}</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {application.purpose_data?.purpose_description || '-'}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('visa.detail.documents')}</h2>
              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{t(`visa.documents.${doc.document_type}`)}</p>
                          <p className="text-sm text-gray-500">{doc.file_name}</p>
                        </div>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Download size={20} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">{t('visa.detail.noDocuments')}</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {application.conversation_id && onNavigateToMessages && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('visa.detail.messages')}</h2>
                <p className="text-sm text-gray-600 mb-4">
                  {t('visa.detail.messagesDesc')}
                </p>
                <Button
                  variant="outline"
                  onClick={onNavigateToMessages}
                  className="w-full"
                >
                  <MessageSquare size={20} className="mr-2" />
                  {t('visa.detail.openMessages')}
                </Button>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('visa.detail.timeline')}</h2>
              <div className="space-y-4">
                {history.map((entry, index) => (
                  <div key={entry.id} className="relative">
                    {index < history.length - 1 && (
                      <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200" />
                    )}
                    <div className="flex gap-3">
                      <div className="w-4 h-4 rounded-full bg-blue-600 mt-1 relative z-10" />
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-gray-900">
                          {t(`visa.status.${entry.new_status}`)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                        {entry.notes && (
                          <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
