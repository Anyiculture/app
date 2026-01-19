import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService } from '../../services/adminService';
import { StartConversationButton } from './ui/StartConversationButton';
import { Button, Modal } from '../ui';
import { Search, Eye, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { EventDetailView } from '../../components/events/EventDetailView';

const SimpleCard = ({ children, className = "", noPadding = false }: { children: React.ReactNode, className?: string, noPadding?: boolean }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${noPadding ? '' : 'p-6'} ${className}`}>
    {children}
  </div>
);

export function EventsAdminPanel() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState('published');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, [page, filter]);

  const loadData = async () => {
    try {
      const { data, total } = await adminService.getEvents(itemsPerPage, (page - 1) * itemsPerPage, filter);
      setEvents(data);
      setTotal(total);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await adminService.updateEventStatus(id, status);
      loadData();
      if (selectedEvent?.id === id) setSelectedEvent(null);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('admin.actions.deleteConfirm') || 'Are you sure you want to delete this event?')) {
      try {
        await adminService.deleteEvent(id);
        loadData();
        if (selectedEvent?.id === id) setSelectedEvent(null);
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event');
      }
    }
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">{t('admin.events.management')}</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={t('common.searchPlaceholder')}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">{t('common.filter')}: All</option>
            <option value="published">{t('admin.events.status.published')}</option>
            <option value="draft">{t('admin.events.status.draft')}</option>
            <option value="cancelled">{t('admin.events.status.cancelled')}</option>
            <option value="completed">{t('admin.events.status.completed')}</option>
          </select>
        </div>
      </div>

      <SimpleCard noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">{t('admin.events.columns.title')}</th>
                <th className="px-6 py-3 font-medium hidden md:table-cell">{t('admin.events.columns.organizer')}</th>
                <th className="px-6 py-3 font-medium hidden lg:table-cell">{t('admin.events.columns.date')}</th>
                <th className="px-6 py-3 font-medium">Image</th>
                <th className="px-6 py-3 font-medium">{t('admin.events.columns.status')}</th>
                <th className="px-6 py-3 font-medium text-right">{t('admin.events.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {t('admin.events.noEvents')}
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{event.title}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                         <MapPin size={12} /> {event.location_name || event.city}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="text-gray-900">{event.organizer?.full_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{event.organizer?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 hidden lg:table-cell">
                      {event.start_time ? format(new Date(event.start_time), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4">
                        {event.image_urls?.[0] ? (
                            <img src={event.image_urls[0]} alt={event.title} className="w-12 h-12 rounded object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-gray-400">
                                <Eye size={16} />
                            </div>
                        )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        event.status === 'published' ? 'bg-green-100 text-green-700' :
                        event.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {t(`admin.events.status.${event.status}`) || event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <StartConversationButton 
                          userId={event.organizer_id} 
                          userName={event.organizer?.full_name || 'Organizer'} 
                          contextType="event" 
                          sourceContext={`Event: ${event.title}`}
                          size="sm"
                          variant="ghost"
                          className="text-blue-600"
                      />
                      <Button size="sm" variant="outline" onClick={() => setSelectedEvent(event)}>
                        <Eye size={14} className="mr-1" /> {t('admin.actions.view')}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {t('common.page')} {page} {t('common.of')} {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </SimpleCard>

      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={`Event: ${selectedEvent.title}`}
          maxWidth="4xl"
        >
          <div className="p-0">
             <EventDetailView 
               event={selectedEvent} 
               loading={false} 
               onBack={() => setSelectedEvent(null)}
               customActions={
                  <div className="flex flex-col gap-2">
                    <StartConversationButton 
                        userId={selectedEvent.organizer_id} 
                        userName={selectedEvent.organizer?.full_name || 'Organizer'} 
                        contextType="event" 
                        sourceContext={`Event: ${selectedEvent.title}`}
                        size="sm"
                        variant="outline"
                        className="w-full justify-center"
                        label={t('admin.actions.messageUser')}
                    />
                    {selectedEvent.status !== 'published' && (
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleStatusUpdate(selectedEvent.id, 'published')}
                      >
                        Publish
                      </Button>
                    )}
                    {selectedEvent.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                        onClick={() => handleStatusUpdate(selectedEvent.id, 'cancelled')}
                      >
                        Cancel Event
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(selectedEvent.id)}
                    >
                      {t('admin.actions.delete')}
                    </Button>
                  </div>
               }
             />
          </div>
        </Modal>
      )}
    </div>
  );
}
