
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { educationService, EducationInterest } from '../services/educationService';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import {
  FileText, ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle,
  ExternalLink, Calendar, MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

export function EducationApplicationsPage() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [interests, setInterests] = useState<EducationInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    loadInterests();
  }, [user]);

  const loadInterests = async () => {
    try {
      setLoading(true);
      const data = await educationService.getUserInterests();
      setInterests(data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'waitlisted':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'documents_requested':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock size={18} />;
      case 'under_review':
        return <AlertCircle size={18} />;
      case 'approved':
        return <CheckCircle size={18} />;
      case 'rejected':
        return <XCircle size={18} />;
      case 'waitlisted':
        return <Clock size={18} />;
      case 'documents_requested':
        return <FileText size={18} />;
      default:
        return <Clock size={18} />;
    }
  };

  const filteredInterests = interests.filter(interest => {
    if (filter === 'all') return true;
    return interest.status === filter;
  });

  const stats = {
    total: interests.length,
    submitted: interests.filter(i => i.status === 'submitted').length,
    under_review: interests.filter(i => i.status === 'under_review').length,
    approved: interests.filter(i => i.status === 'approved').length,
    rejected: interests.filter(i => i.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50 to-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
        <button
          onClick={() => navigate('/education')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          {t('common.backTo')} {t('education.create.backToEducation')}
        </button>

        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{t('education.myApplications')}</h1>
          <p className="text-lg text-gray-600">{t('education.trackApplicationsDesc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-5 border-2 border-gray-200">
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
            <div className="text-sm text-gray-600">{t('education.totalApplications')}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 border-2 border-blue-200">
            <div className="text-3xl font-bold text-blue-600 mb-1">{stats.submitted}</div>
            <div className="text-sm text-gray-600">{t('education.status.submitted')}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 border-2 border-yellow-200">
            <div className="text-3xl font-bold text-yellow-600 mb-1">{stats.under_review}</div>
            <div className="text-sm text-gray-600">{t('education.status.under_review')}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 border-2 border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.approved}</div>
            <div className="text-sm text-gray-600">{t('education.status.approved')}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 border-2 border-red-200">
            <div className="text-3xl font-bold text-red-600 mb-1">{stats.rejected}</div>
            <div className="text-sm text-gray-600">{t('education.status.rejected')}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">{t('common.all')}:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('common.all')}
            </button>
            <button
              onClick={() => setFilter('submitted')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'submitted' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              {t('education.status.submitted')}
            </button>
            <button
              onClick={() => setFilter('under_review')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'under_review' ? 'bg-yellow-600 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
              }`}
            >
              {t('education.status.under_review')}
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'approved' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              {t('education.status.approved')}
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              {t('education.status.rejected')}
            </button>
          </div>
        </div>

        {filteredInterests.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <FileText className="mx-auto text-gray-400 mb-5" size={72} />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {filter === 'all' ? t('education.noApplications') : t('education.status.' + filter)}
            </h3>
            <p className="text-lg text-gray-600 mb-8">
              {filter === 'all'
                ? t('education.explorePrograms')
                : t('education.create.noProgramsDescription')}
            </p>
            {filter === 'all' && (
              <Link to="/education">
                <Button>{t('education.browsePrograms')}</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInterests.map((interest) => {
              const programTitle = language === 'zh' && interest.resource?.title_zh
                ? interest.resource?.title_zh
                : interest.resource?.title || t('education.program');

              return (
                <div
                  key={interest.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{programTitle}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(interest.status)}`}>
                          {getStatusIcon(interest.status)}
                          {t('education.status.' + interest.status)}
                        </span>
                      </div>

                      {interest.resource?.institution_name && (
                        <p className="text-sm text-gray-600 mb-2">
                          {interest.resource.institution_name}
                          {interest.resource?.institution_country && `, ${interest.resource?.institution_country}`}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          <span>{t('education.applied')}: {format(new Date(interest.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        {interest.updated_at !== interest.created_at && (
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>{t('education.updated')}: {format(new Date(interest.updated_at), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        {interest.documents && interest.documents.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <FileText size={14} />
                            <span>{t('education.docsSubmitted', { count: interest.documents.length })}</span>
                          </div>
                        )}
                      </div>

                      {interest.admin_notes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 text-blue-700 font-medium mb-1">
                            <MessageSquare size={14} />
                            <span className="text-xs">{t('education.adminNotes')}</span>
                          </div>
                          <p className="text-sm text-blue-800">{interest.admin_notes}</p>
                        </div>
                      )}
                    </div>

                    <Link to={`/education/${interest.resource_id}`}>
                      <Button variant="outline" size="sm" className="ml-4">
                        <ExternalLink size={16} />
                        {t('education.viewProgram')}
                      </Button>
                    </Link>
                  </div>

                  {interest.status === 'documents_requested' && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-orange-800 font-medium">{t('education.additionalDocsRequested')}</p>
                      <p className="text-sm text-orange-700 mt-1">
                        {t('education.checkNotes')}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
