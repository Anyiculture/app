import { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Event } from '../../services/eventsService';
import { Button } from '../ui/Button';
import { Loading } from '../ui/Loading';
import { Calendar, MapPin, Users, Clock, ArrowLeft, User, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { TranslateWrapper } from '../ui';

interface EventDetailViewProps {
  event: Event | null;
  loading: boolean;
  currentUser?: any;
  isRegistered?: boolean;
  registering?: boolean;
  onRegister?: () => void;
  onContactOrganizer?: () => void;
  onBack?: () => void;
  customActions?: React.ReactNode;
}

export function EventDetailView({
  event,
  loading,
  currentUser,
  isRegistered,
  registering,
  onRegister,
  onContactOrganizer,
  onBack,
  customActions
}: EventDetailViewProps) {
  const { t, language } = useI18n();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loading />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Calendar className="mx-auto text-gray-400 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('common.notFound', { item: t('nav.events') })}</h2>
          <p className="text-gray-600 mb-6">{t('common.notExist', { item: t('nav.events') })}</p>
          {onBack && (
            <Button onClick={onBack}>{t('common.backToEvents')}</Button>
          )}
        </div>
      </div>
    );
  }

  const isPast = new Date(event.start_date || '') < new Date();
  const organizerName = event.organizer?.profiles?.full_name || event.organizer?.email || 'Unknown';

  return (
    <div className="w-full">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          {t('common.backTo')} {t('nav.events')}
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className={`h-64 sm:h-80 bg-gradient-to-br flex items-center justify-center overflow-hidden ${
                isPast ? 'from-gray-100 to-gray-200' : 'from-blue-100 to-blue-200'
              }`}>
                {event.image_urls && event.image_urls.length > 0 ? (
                  <img
                    src={event.image_urls[selectedImageIndex]}
                    alt={event.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Calendar className={isPast ? 'text-gray-600' : 'text-blue-600'} size={128} />
                )}
              </div>
              {event.image_urls && event.image_urls.length > 1 && (
                <div className="p-4 bg-gray-50 overflow-x-auto">
                  <div className="flex gap-2">
                    {event.image_urls.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index
                            ? 'border-blue-600 scale-105'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`${event.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Event Details */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{event.title}</h1>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={20} />
                  <span>{format(new Date(event.start_date || ''), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={20} />
                  <span>{format(new Date(event.start_date || ''), 'h:mm a')}</span>
                </div>
                {event.location_city && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={20} />
                    <span>{event.location_city}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Users size={20} />
                  <span>{event.attendee_count || 0} {t('events.detail.registered')}</span>
                </div>
              </div>

              {isPast && (
                <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                  <p className="text-gray-700 font-medium">{t('events.detail.eventPastMessage')}</p>
                </div>
              )}

              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('events.detail.aboutEvent')}</h2>
                <TranslateWrapper 
                  text={event.description || t('events.detail.noDescription')}
                  dbTranslation={language === 'zh' ? event.description_zh : null}
                  as="p"
                  className="text-gray-700 whitespace-pre-wrap"
                />
              </div>
            </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
            <div className="border-b pb-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('events.detail.organizer')}</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  {event.organizer?.profiles?.avatar_url ? (
                    <img
                      src={event.organizer.profiles.avatar_url}
                      alt={organizerName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="text-blue-600" size={24} />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{organizerName}</p>
                  <p className="text-sm text-gray-600">{t('events.detail.eventOrganizer')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {customActions ? customActions : (
                <>
                  {!isPast && (
                    currentUser && currentUser.id !== event.organizer_id ? (
                      <Button
                        className="w-full"
                        onClick={onRegister}
                        disabled={registering}
                        variant={isRegistered ? 'outline' : undefined}
                      >
                        {registering ? t('common.processing') : isRegistered ? t('events.detail.unregister') : t('events.detail.registerForEvent')}
                      </Button>
                    ) : !currentUser ? (
                      <Button
                        className="w-full"
                        onClick={onRegister}
                      >
                        {t('events.detail.signInToRegister')}
                      </Button>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-600 text-sm">{t('events.detail.youAreOrganizer')}</p>
                      </div>
                    )
                  )}
                  {currentUser && currentUser.id !== event.organizer_id && event.organizer_id && (
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={onContactOrganizer}
                    >
                      <MessageCircle size={18} />
                      {t('events.detail.contactOrganizer')}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
