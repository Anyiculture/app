
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/adminService';
import { visaService, VisaApplication, VisaDocument } from '../services/visaService';
import { notificationService } from '../services/notificationService';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { FileText, CheckCircle, XCircle, Eye, Clock, AlertCircle, MessageSquare } from 'lucide-react';

type FilterStatus = 'all' | 'submitted' | 'in_review' | 'documents_requested' | 'approved' | 'rejected';

export function VisaAdminReviewPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<VisaApplication | null>(null);
  const [documents, setDocuments] = useState<VisaDocument[]>([]);
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadApplications();
    }
  }, [isAdmin, filterStatus]);

  useEffect(() => {
    if (selectedApp) {
      loadApplicationDetails(selectedApp.id);
    }
  }, [selectedApp]);

  const checkAdminStatus = async () => {
    try {
      const isAdmin = await adminService.checkIsAdmin();
      if (!isAdmin) {
        navigate('/dashboard');
        return;
      }
      setIsAdmin(true);
    } catch (err) {
      console.error('Failed to check admin status:', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      const filters = filterStatus !== 'all' ? { status: filterStatus as any } : undefined;
      const data = await visaService.getAllApplications(filters);
      setApplications(data);
    } catch (err) {
      console.error('Failed to load applications:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const loadApplicationDetails = async (applicationId: string) => {
    try {
      const [docs, history] = await Promise.all([
        visaService.getDocuments(applicationId),
        visaService.getReviewHistory(applicationId),
      ]);
      setDocuments(docs);
      setReviewHistory(history);
      setAdminNotes(selectedApp?.admin_notes || '');
    } catch (err) {
      console.error('Failed to load application details:', err);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedApp) return;

    try {
      setProcessing(true);
      await visaService.updateApplicationStatus(selectedApp.id, newStatus as any, adminNotes);

      await notificationService.createNotification(
        selectedApp.user_id,
        'visa_update',
        'Visa Application Status Update',
        `Your visa application status has been updated to: ${newStatus}`,
        `/visa/application/${selectedApp.id}/view`
      );

      await loadApplications();
      setSelectedApp(null);
      setAdminNotes('');
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update application status');
    } finally {
      setProcessing(false);
    }
  };

  const handleDocumentVerification = async (documentId: string, status: 'verified' | 'rejected', reason?: string) => {
    try {
      setProcessing(true);
      await visaService.verifyDocument(documentId, status, reason);

      if (selectedApp) {
        await notificationService.createNotification(
          selectedApp.user_id,
          'visa_update',
          'Document Verification Update',
          `A document in your visa application has been ${status}`,
          `/visa/application/${selectedApp.id}/view`
        );

        await loadApplicationDetails(selectedApp.id);
      }
    } catch (err) {
      console.error('Failed to verify document:', err);
      setError('Failed to verify document');
    } finally {
      setProcessing(false);
    }
  };

  const handleMessageApplicant = async () => {
    if (!selectedApp) return;
    
    try {
      setProcessing(true);
      let conversationId = selectedApp.conversation_id;

      if (!conversationId) {
        // Create new conversation if none exists
        const { data, error } = await supabase.rpc('create_new_conversation', {
           p_other_user_id: selectedApp.user_id,
           p_initial_message: t('admin.visa.initialMessage', {
             name: selectedApp.full_name || 'Applicant',
             type: selectedApp.visa_type
           })
        });

        if (error) throw error;
        conversationId = data;
      } else {
        await adminService.assignAdminToConversation(conversationId);
      }

      navigate(`/messages?conversation=${conversationId}`);
    } catch (err) {
      console.error('Failed to join conversation:', err);
      setError('Failed to open conversation');
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      in_review: 'bg-yellow-100 text-yellow-800',
      documents_requested: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.draft}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getVerificationBadge = (status: string) => {
    if (status === 'verified') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  if (loading && !isAdmin) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.visa.title')}</h1>
          <p className="text-gray-600 mt-1">{t('admin.visa.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.visa.filter_by_status')}
              </label>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              >
                <option value="all">{t('admin.visa.filter.all')}</option>
                <option value="submitted">{t('admin.visa.filter.submitted')}</option>
                <option value="in_review">{t('admin.visa.filter.inReview')}</option>
                <option value="documents_requested">{t('admin.visa.filter.documents_requested')}</option>
                <option value="approved">{t('admin.visa.filter.approved')}</option>
                <option value="rejected">{t('admin.visa.filter.rejected')}</option>
              </Select>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('admin.visa.applications_count', { count: applications.length })}
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="p-8">
                    <Loading />
                  </div>
                ) : applications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>{t('admin.visa.noApplications')}</p>
                  </div>
                ) : (
                  applications.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedApp?.id === app.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          {app.full_name || t('admin.visa.unnamed_application')}
                        </h3>
                        {getStatusBadge(app.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {t('admin.visa.columns.type')}: {app.visa_type.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('admin.visa.columns.submitted')}: {new Date(app.submitted_at || app.created_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedApp ? (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {t('admin.visa.details.title')}
                    </h2>
                    {getStatusBadge(selectedApp.status)}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="text-sm text-gray-600">{t('admin.visa.details.fullName')}</label>
                      <p className="font-medium">{selectedApp.full_name || t('common.na')}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">{t('admin.visa.details.nationality')}</label>
                      <p className="font-medium">{selectedApp.nationality_country || t('common.na')}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">{t('admin.visa.details.dateOfBirth')}</label>
                      <p className="font-medium">
                        {selectedApp.date_of_birth ? new Date(selectedApp.date_of_birth).toLocaleDateString() : t('common.na')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">{t('admin.visa.details.passportNumber')}</label>
                      <p className="font-medium">{selectedApp.passport_number || t('common.na')}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.visa.details.notes')}
                    </label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={4}
                      placeholder={t('admin.visa.details.notesPlaceholder')}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => setShowDetailsModal(true)}
                      variant="outline"
                      className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {t('admin.visa.dashboard.viewDetails')}
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate('in_review')}
                      disabled={processing}
                      variant="outline"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t('admin.visa.actions.acknowledge')}
                    </Button>
                    <Button
                      onClick={handleMessageApplicant}
                      disabled={processing}
                      className="bg-pink-600 hover:bg-pink-700 text-white"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {t('admin.visa.actions.message')}
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate('documents_requested')}
                      disabled={processing}
                      variant="outline"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {t('admin.visa.actions.requestDocs')}
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate('approved')}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t('admin.visa.actions.approve')}
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate('rejected')}
                      disabled={processing}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {t('admin.visa.actions.reject')}
                    </Button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('admin.visa.documents_count', { count: documents.length })}
                  </h3>
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{doc.file_name}</p>
                              <p className="text-sm text-gray-600">
                                {doc.document_type.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          {getVerificationBadge((doc as any).verification_status || 'pending')}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            {t('common.view')}
                          </Button>
                          {(doc as any).verification_status !== 'verified' && (
                            <Button
                              size="sm"
                              onClick={() => handleDocumentVerification(doc.id, 'verified')}
                              disabled={processing}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {t('common.verify')}
                            </Button>
                          )}
                          {(doc as any).verification_status !== 'rejected' && (
                            <Button
                              size="sm"
                              onClick={() => handleDocumentVerification(doc.id, 'rejected', 'Document does not meet requirements')}
                              disabled={processing}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {t('common.reject')}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {reviewHistory.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {t('admin.visa.reviewHistory')}
                    </h3>
                    <div className="space-y-3">
                      {reviewHistory.map((entry) => (
                        <div key={entry.id} className="border-l-4 border-blue-500 pl-4 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">
                              {entry.previous_status} → {entry.new_status}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(entry.created_at).toLocaleString()}
                            </span>
                          </div>
                          {entry.comment && (
                            <p className="text-sm text-gray-600">{entry.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('admin.visa.noSelection')}
                </h3>
                <p className="text-gray-600">
                  {t('admin.visa.selectToReview')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={t('admin.visa.details.title')}
      >
        {selectedApp && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.visa.details.fullName')}</label>
                <p className="text-gray-900">{selectedApp.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.visa.columns.type')}</label>
                <p className="text-gray-900">{selectedApp.visa_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.visa.details.nationality')}</label>
                <p className="text-gray-900">{selectedApp.nationality_country}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.visa.details.passportNumber')}</label>
                <p className="text-gray-900">{selectedApp.passport_number}</p>
              </div>
            </div>

            {selectedApp.purpose_data && (
              <div className="mt-4 border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">{t('admin.visa.details.data')}</h4>
                <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-auto max-h-60 whitespace-pre-wrap">
                  {JSON.stringify(selectedApp.purpose_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
