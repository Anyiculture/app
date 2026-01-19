import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { visaService, VisaApplication, VisaDocument, VisaApplicationHistory } from '../services/visaService';
import { VisaApplicationDetailView } from '../components/visa/VisaApplicationDetailView';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';

export function VisaApplicationDetailPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<VisaApplication | null>(null);
  const [documents, setDocuments] = useState<VisaDocument[]>([]);
  const [history, setHistory] = useState<VisaApplicationHistory[]>([]);

  useEffect(() => {
    if (!user || !id) {
      navigate('/visa');
      return;
    }
    loadApplication();
  }, [id, user]);

  const loadApplication = async () => {
    if (!id) return;

    try {
      const [appData, docsData, historyData] = await Promise.all([
        visaService.getApplication(id),
        visaService.getDocuments(id),
        visaService.getApplicationHistory(id)
      ]);

      if (appData) {
        setApplication(appData);
        setDocuments(docsData);
        setHistory(historyData);
      }
    } catch (error) {
      console.error('Failed to load application:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('visa.detail.notFound')}</h2>
          <Button onClick={() => navigate('/visa/dashboard')}>
            {t('visa.detail.backToDashboard')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VisaApplicationDetailView
        application={application}
        documents={documents}
        history={history}
        onBack={() => navigate('/visa/dashboard')}
        onNavigateToUpload={(appId) => navigate(`/visa/application/${appId}`)}
        onNavigateToMessages={() => navigate('/messaging')}
      />
    </div>
  );
}
