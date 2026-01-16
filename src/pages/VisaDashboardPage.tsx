import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { visaService, VisaApplication } from '../services/visaService';
import { FileText, Plus, Eye, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';

export function VisaDashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/visa');
      return;
    }
    loadApplications();
  }, [user]);

  const loadApplications = async () => {
    try {
      const data = await visaService.getApplications();
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm(t('common.deleteConfirm'))) return;
    
    try {
      await visaService.deleteApplication(id);
      setApplications(prev => prev.filter(app => app.id !== id));
    } catch (error) {
      console.error('Failed to delete application:', error);
      alert(t('visa.application.deleteAppError'));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="text-gray-500" size={20} />;
      case 'submitted':
      case 'in_review':
        return <AlertCircle className="text-blue-500" size={20} />;
      case 'documents_requested':
        return <FileText className="text-orange-500" size={20} />;
      case 'approved':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-gray-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'submitted':
      case 'in_review':
        return 'bg-blue-100 text-blue-700';
      case 'documents_requested':
        return 'bg-orange-100 text-orange-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const draftApplications = applications.filter(app => app.status === 'draft');
  const activeApplications = applications.filter(app => app.status !== 'draft');

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>{t('common.back')}</span>
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('visa.dashboard.title')}</h1>
          <p className="text-gray-600">{t('visa.dashboard.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => navigate('/visa/application/new')}
            className="bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Plus size={24} />
              </div>
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </div>
            <h3 className="text-lg font-semibold mb-1">{t('visa.dashboard.startNew')}</h3>
            <p className="text-sm opacity-90">{t('visa.dashboard.startNewDesc')}</p>
          </button>

          {draftApplications.length > 0 && (
            <button
              onClick={() => navigate(`/visa/application/${draftApplications[0].id}`)}
              className="bg-white border-2 border-orange-200 text-gray-900 rounded-xl shadow-sm hover:shadow-lg transition-all p-6 text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-orange-600" size={24} />
                </div>
                <ArrowRight className="text-orange-600 group-hover:translate-x-1 transition-transform" size={20} />
              </div>
              <h3 className="text-lg font-semibold mb-1">{t('visa.dashboard.continueDraft')}</h3>
              <p className="text-sm text-gray-600">{t('visa.dashboard.continueDraftDesc')}</p>
            </button>
          )}

          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Eye className="text-gray-600" size={24} />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-1">{t('visa.dashboard.trackApplications')}</h3>
            <p className="text-sm text-gray-600">{applications.length} {t('visa.dashboard.total')}</p>
          </div>
        </div>

        {activeApplications.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('visa.dashboard.activeApplications')}</h2>
            <div className="space-y-4">
              {activeApplications.map((application) => (
                <div
                  key={application.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/visa/application/${application.id}/view`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        {getStatusIcon(application.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {t(`visa.types.${application.visa_type}.title`)}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {t(`visa.status.${application.status}`)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {t('visa.dashboard.lastUpdated')}: {new Date(application.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        {t('visa.dashboard.viewDetails')}
                      </Button>
                      <button
                        onClick={(e) => handleDelete(e, application.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {draftApplications.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('visa.dashboard.drafts')}</h2>
            <div className="space-y-4">
              {draftApplications.map((application) => (
                <div
                  key={application.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/visa/application/${application.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        {getStatusIcon(application.status)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {t(`visa.types.${application.visa_type}.title`)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {t('visa.dashboard.started')}: {new Date(application.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="primary" size="sm">
                        {t('visa.dashboard.continue')}
                      </Button>
                      <button
                        onClick={(e) => handleDelete(e, application.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {applications.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FileText className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('visa.dashboard.noApplications')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('visa.dashboard.noApplicationsDesc')}
            </p>
            <Button onClick={() => navigate('/visa/application/new')}>
              {t('visa.dashboard.startFirst')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
