import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { eventsService, EventCategory } from '../services/eventsService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { ImageUpload } from '../components/ui/ImageUpload';
import { useToast } from '../components/ui/Toast';
import { Calendar, ArrowLeft } from 'lucide-react';

export function CreateEventPage() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    category: '',
    event_type: 'in_person',
    image_urls: [] as string[],
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await eventsService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/signin');
      return;
    }

    if (!formData.category || !formData.event_type) {
      showToast('error', t('events.create.requiredFields'));
      return;
    }

    try {
      setLoading(true);
      const eventDateTime = `${formData.event_date}T${formData.event_time}:00`;

      const event = await eventsService.createEvent({
        title: formData.title,
        description: formData.description,
        start_date: eventDateTime,
        location_address: formData.location, 
        location_city: 'Unknown', 
        category: formData.category,
        event_type: formData.event_type as any,
        image_urls: formData.image_urls,
      });
      
      showToast('success', t('events.create.success'));
      navigate(`/events/${event.id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      showToast('error', t('events.create.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImagesChange = (urls: string[]) => {
    setFormData(prev => ({ ...prev, image_urls: urls }));
  };

  if (!user) {
    navigate(`/signin?returnTo=${encodeURIComponent(window.location.pathname)}`);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('events.create.redirectSignIn')}</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          {t('events.create.backToEvents')}
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="text-blue-600" size={32} />
            <h1 className="text-2xl font-bold text-gray-900">{t('events.create.title')}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('events.create.eventTitle')} *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder={t('events.create.eventTitlePlaceholder')}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.create.category')} *
                </label>
                <Select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  required
                >
                  <option value="">{t('events.create.selectCategory')}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {language === 'zh' ? cat.name_zh : cat.name_en}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.create.eventType')} *
                </label>
                <Select
                  value={formData.event_type}
                  onChange={(e) => handleChange('event_type', e.target.value)}
                  required
                >
                  <option value="in_person">{t('events.create.inPerson')}</option>
                  <option value="online">{t('events.create.online')}</option>
                  <option value="hybrid">{t('events.create.hybrid')}</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('events.create.eventPhotos')}
              </label>
              <ImageUpload
                value={formData.image_urls}
                onChange={handleImagesChange}
                maxImages={5}
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-2">
                {t('events.create.photosHelp')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.create.eventDate')} *
                </label>
                <Input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => handleChange('event_date', e.target.value)}
                  min={today}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('events.create.eventTime')} *
                </label>
                <Input
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => handleChange('event_time', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('events.create.location')} *
              </label>
              <Input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder={t('events.create.locationPlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('events.create.description')} *
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('events.create.descriptionPlaceholder')}
                rows={6}
                required
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/events')}
                className="flex-1"
                disabled={loading}
              >
                {t('events.create.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                isLoading={loading}
                className="flex-1"
              >
                {loading ? t('events.create.creating') : t('events.create.createButton')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
