import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { visaService, VisaApplication } from '../../services/visaService';
import { StartConversationButton } from './ui/StartConversationButton';
import { Button, Modal } from '../ui';
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const SimpleCard = ({ children, className = "", noPadding = false }: { children: React.ReactNode, className?: string, noPadding?: boolean }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${noPadding ? '' : 'p-6'} ${className}`}>
    {children}
  </div>
);

export function VisaAdminPanel() {
  const { t } = useTranslation();
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<VisaApplication | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await visaService.getAllApplications();
      setApplications(data);
    } catch (error) {
      console.error('Error loading visa applications:', error);
    }
  };

  const handleStatusUpdate = async (id: string, status: any) => {
    try {
      await visaService.updateApplicationStatus(id, status);
      loadData();
      if (selectedApp?.id === id) setSelectedApp(null);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
      if (window.confirm(t('admin.visa.confirmDelete') || 'Are you sure you want to delete this application?')) {
          try {
              await visaService.deleteApplication(id);
              loadData();
              if (selectedApp?.id === id) setSelectedApp(null);
          } catch (error) {
              console.error('Error deleting application:', error);
              alert('Failed to delete application');
          }
      }
  }

  const filteredApps = applications.filter(app => {
    const matchesSearch = (app.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (app.visa_type?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    // Filter status matches logic
    const matchesStatus = filter === 'all' 
      ? app.status !== 'draft' // Exclude drafts in 'all' view
      : app.status === filter;
      
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
  const paginatedApps = filteredApps.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Reset page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [filter, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">{t('admin.visa.management')}</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    placeholder={t('admin.visa.searchPlaceholder')}
                    className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
                <option value="all">{t('admin.visa.filter.all')}</option>
                <option value="submitted">{t('admin.visa.filter.submitted')}</option>
                <option value="in_review">{t('admin.visa.filter.inReview')}</option>
                <option value="documents_requested">{t('admin.visa.filter.documents_requested')}</option>
                <option value="approved">{t('admin.visa.filter.approved')}</option>
                <option value="rejected">{t('admin.visa.filter.rejected')}</option>
            </select>
        </div>
      </div>

      <SimpleCard noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">{t('admin.visa.columns.applicant')}</th>
                <th className="px-6 py-3 font-medium">{t('admin.visa.columns.type')}</th>
                <th className="px-6 py-3 font-medium">{t('admin.visa.columns.nationality')}</th>
                <th className="px-6 py-3 font-medium">{t('admin.visa.columns.status')}</th>
                <th className="px-6 py-3 font-medium">{t('admin.visa.columns.submitted')}</th>
                <th className="px-6 py-3 font-medium text-right">{t('admin.visa.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {t('admin.visa.noApplications')}
                  </td>
                </tr>
              ) : (
                paginatedApps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{app.full_name || t('common.unknown')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700 uppercase">
                        {app.visa_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {app.nationality_country || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        app.status === 'approved' ? 'bg-green-100 text-green-700' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {t(`admin.visa.status.${app.status}`) || app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {app.submitted_at ? format(new Date(app.submitted_at), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <StartConversationButton 
                          userId={app.user_id} 
                          userName={app.full_name || 'Applicant'} 
                          contextType="visa" 
                          sourceContext={`Visa Application: ${app.visa_type}`}
                          size="sm"
                          variant="ghost"
                          className="text-blue-600"
                      />
                      <Button size="sm" variant="outline" onClick={() => setSelectedApp(app)}>
                        <Eye size={14} className="mr-1" /> {t('admin.actions.view')}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
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

      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title={`${t('admin.visa.details.title')}: ${selectedApp.full_name}`}
        >
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Applicant Details */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-bold text-gray-900 border-b pb-2">Applicant Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">{t('admin.visa.columns.nationality')}</label>
                    <p className="font-medium">{selectedApp.nationality_country || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Passport Number</label>
                    <p className="font-medium">{selectedApp.passport_number || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Passport Expiry</label>
                    <p className="font-medium">{selectedApp.passport_expiry ? format(new Date(selectedApp.passport_expiry), 'MMM d, yyyy') : '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Date of Birth</label>
                    <p className="font-medium">{selectedApp.date_of_birth ? format(new Date(selectedApp.date_of_birth), 'MMM d, yyyy') : '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 uppercase font-bold">Current Residence</label>
                    <p className="font-medium">
                        {[selectedApp.current_city, selectedApp.current_province, selectedApp.current_country].filter(Boolean).join(', ') || '-'}
                    </p>
                  </div>
                </div>
            </div>

            {/* Application Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">{t('admin.visa.columns.type')}</label>
                <p className="font-medium uppercase">{selectedApp.visa_type.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">{t('admin.visa.columns.status')}</label>
                <p className="font-medium capitalize">{t(`admin.visa.status.${selectedApp.status}`) || selectedApp.status}</p>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
              <StartConversationButton 
                  userId={selectedApp.user_id} 
                  userName={selectedApp.full_name || 'Applicant'} 
                  contextType="visa" 
                  sourceContext={`Visa Application: ${selectedApp.visa_type}`}
                  size="sm"
                  variant="outline"
                  className="mr-auto"
                  label={t('admin.visa.actions.messageApplicant')}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate(selectedApp.id, 'in_review')}
                disabled={selectedApp.status === 'in_review'}
              >
                {t('admin.visa.actions.markInReview')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate(selectedApp.id, 'documents_requested')}
                disabled={selectedApp.status === 'documents_requested'}
              >
                {t('admin.visa.actions.requestDocs')}
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white ml-auto"
                onClick={() => handleStatusUpdate(selectedApp.id, 'approved')}
                disabled={selectedApp.status === 'approved'}
              >
                {t('admin.visa.actions.approve')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => handleStatusUpdate(selectedApp.id, 'rejected')}
                disabled={selectedApp.status === 'rejected'}
              >
                {t('admin.visa.actions.reject')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600"
                onClick={() => handleDelete(selectedApp.id)}
              >
                {t('admin.actions.delete')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
