import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { eventsService, Event } from '../services/eventsService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Plus, Search, Calendar, MapPin, Users, Edit2, Trash2, ExternalLink } from 'lucide-react';

export default function MyEventsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadMyEvents() {
      if (!user) return;
      try {
        const data = await eventsService.getMyEvents(user.id);
        setEvents(data);
      } catch (error) {
        console.error('Failed to load my events:', error);
      } finally {
        setLoading(false);
      }
    }
    loadMyEvents();
  }, [user]);

  const confirmDelete = (eventId: string) => {
    setEventToDelete(eventId);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    
    try {
      setDeleting(true);
      await eventsService.deleteEvent(eventToDelete);
      setEvents(events.filter(e => e.id !== eventToDelete));
      showToast('success', 'Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('error', t('myEvents.deleteError'));
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setEventToDelete(null);
    }
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('myEvents.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('myEvents.title')}</h1>
            <p className="text-gray-500">{t('myEvents.subtitle')}</p>
          </div>
          <Button onClick={() => navigate('/events/create')}>
            <Plus size={20} className="mr-2" />
            {t('myEvents.createEvent')}
          </Button>
        </div>

        {events.length > 0 ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder={t('myEvents.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {filteredEvents.map(event => (
                <div key={event.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                  <div className="aspect-video relative bg-gray-100">
                    <img
                      src={event.image_urls?.[0] || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80'}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-700`}>
                        {event.event_type === 'in_person' ? t('events.create.inPerson') : 
                         event.event_type === 'online' ? t('events.create.online') : t('events.create.hybrid')}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 sm:p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg text-gray-900 line-clamp-1">{event.title}</h3>
                        <p className="text-sm text-gray-500">{event.start_date ? new Date(event.start_date).toLocaleDateString() : t('common.dateNotSet')}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin size={16} className="mr-2" />
                        <span className="truncate">{event.location_address}</span>
                      </div>
                      <div className="flex items-center text-gray-600 text-sm">
                        <Users size={16} className="mr-2" />
                        <span>{event.attendee_count || 0} {t('myEvents.attendees')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 pt-2 sm:pt-4 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/events/${event.id}/edit`)}
                      >
                        <Edit2 size={16} className="mr-2" />
                        {t('myEvents.edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => confirmDelete(event.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        <ExternalLink size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('myEvents.noEvents')}</h3>
            <p className="text-gray-500 mb-6">{t('myEvents.startPosting')}</p>
            <Button onClick={() => navigate('/events/create')}>
              <Plus size={20} className="mr-2" />
              {t('myEvents.createFirstEvent')}
            </Button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t('common.delete')}
        message={t('myEvents.deleteConfirm')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
}
