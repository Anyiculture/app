import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { educationService, EducationResource } from '../services/educationService';
import { startConversationAndNavigate } from '../utils/conversationHelpers';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';
import { EducationInterestForm } from '../components/EducationInterestForm';

import { EducationDetailView } from '../components/education/EducationDetailView';
import {
  GraduationCap, ArrowLeft
} from 'lucide-react';

export function EducationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [program, setProgram] = useState<EducationResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasInterest, setHasInterest] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadProgram();
      if (id) {
        educationService.incrementViews(id);
      }
    }
  }, [id]);

  const loadProgram = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await educationService.getProgramById(id);
      setProgram(data);
      setHasInterest(data?.has_submitted_interest || false);
    } catch (error) {
      console.error('Error loading program:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInterestSuccess = () => {
    setHasInterest(true);
    setShowInterestModal(false);
    alert(`${t('education.detail.applicationSubmitted')}! ${t('education.detail.trackApplication')}`);
  };

  const handleToggleFavorite = async () => {
    if (!user || !id) {
      navigate('/signin');
      return;
    }

    try {
      const isFavorited = await educationService.toggleFavorite(id);
      if (program) {
        setProgram({ ...program, is_favorited: isFavorited });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleContact = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (!program || !program.creator_id) {
      alert(t('common.unableToContact', { item: t('common.organizer') }));
      return;
    }

    try {
      await startConversationAndNavigate(
        {
          recipientId: program.creator_id,
          recipientName: creatorName,
          contextType: 'education',
          contextId: program.id,
          itemTitle: title,
          initialMessage: `Hi, I'm interested in ${title}`,
        },
        navigate
      );
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert(t('common.failedToStartConversation'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="mx-auto text-gray-400 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('common.notFound', { item: t('nav.education') })}</h2>
          <p className="text-gray-600 mb-6">{t('common.notExist', { item: t('nav.education') })}</p>
          <Link to="/education">
            <Button>{t('education.create.backToEducation')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const creatorName = program.creator?.profiles?.full_name || program.creator?.email || t('common.unknown');
  const title = language === 'zh' && program.title_zh ? program.title_zh : program.title;


  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/education')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            {t('education.create.backToEducation')}
          </button>
        </div>

        <EducationDetailView 
          program={program}
          isOwner={user?.id === program.creator_id}
          isFavorited={program.is_favorited || false}
          hasInterest={hasInterest}
          onToggleFavorite={handleToggleFavorite}
          onContact={handleContact}
          onApply={() => setShowInterestModal(true)}
          onEdit={() => navigate(`/education/${program.id}/edit`)}
          onViewApplications={() => navigate('/education/applications')}
          isAuthenticated={!!user}
          onSignIn={() => navigate('/signin')}
        />
      </div>

      <Modal
        isOpen={showInterestModal}
        onClose={() => setShowInterestModal(false)}
        title={t('education.detail.applyToProgram')}
      >
        {id && (
          <EducationInterestForm
            resourceId={id}
            onSuccess={handleInterestSuccess}
            onCancel={() => setShowInterestModal(false)}
          />
        )}
      </Modal>
    </div>
  );
}