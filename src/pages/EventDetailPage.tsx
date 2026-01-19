import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { eventsService, Event } from '../services/eventsService';
import { messagingService } from '../services/messagingService';

import { Loading } from '../components/ui/Loading';

import { EventDetailView } from '../components/events/EventDetailView';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

  const loadEvent = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await eventsService.getEventById(id);
      setEvent(data);

      if (user && data) {
        setIsRegistered(!!(data as any).is_registered);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (!id) return;

    try {
      setRegistering(true);
      if (isRegistered) {
        await eventsService.unregisterFromEvent(id);
        setIsRegistered(false);
      } else {
        await eventsService.registerForEvent(id, {
          attendee_name: user?.user_metadata?.full_name || user?.email || 'Unknown',
          attendee_email: user?.email || ''
        });
        setIsRegistered(true);
      }
      await loadEvent();
    } catch (error) {
      console.error('Error updating registration:', error);
      alert(t('events.detail.failedToUpdateRegistration'));
    } finally {
      setRegistering(false);
    }
  };

  const handleContactOrganizer = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (!event?.organizer_id) {
      alert(t('events.detail.unableToContactOrganizer'));
      return;
    }

    try {
      const conversationId = await messagingService.getOrCreateConversation(
        event.organizer_id,
        'event',
        event.id,
        event.title
      );
      navigate(`/messages?conversation=${conversationId}`);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      alert(t('events.detail.failedToStartConversation'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <EventDetailView
          event={event}
          loading={loading}
          currentUser={user}
          isRegistered={isRegistered}
          registering={registering}
          onRegister={handleRegister}
          onContactOrganizer={handleContactOrganizer}
          onBack={() => navigate('/events')}
        />
      </div>
    </div>
  );
}