import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService } from '../../services/adminService';
import { StartConversationButton } from './ui/StartConversationButton';
import { Button, Modal } from '../ui';
import { Eye, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';

const SimpleCard = ({ children, className = "", noPadding = false }: { children: React.ReactNode, className?: string, noPadding?: boolean }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${noPadding ? '' : 'p-6'} ${className}`}>
    {children}
  </div>
);

export function PaymentsAdminPanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'requests' | 'history'>('requests');
  const [data, setData] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab, page, filter]);

  const loadData = async () => {
    try {
      if (activeTab === 'requests') {
        const { data, total } = await adminService.getPaymentSubmissions(itemsPerPage, (page - 1) * itemsPerPage, filter);
        setData(data);
        setTotal(total);
      } else {
        const { data, total } = await adminService.getTransactions(itemsPerPage, (page - 1) * itemsPerPage);
        setData(data);
        setTotal(total);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!selectedSubmission) return;
    setProcessing(true);
    try {
      await adminService.updatePaymentSubmissionStatus(selectedSubmission.id, status);
      loadData();
      setSelectedSubmission(null);
      setProofModalOpen(false);
    } catch (error) {
      console.error('Error reviewing payment:', error);
      alert('Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t('admin.payments.management')}</h2>
        <div className="flex gap-4">
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => { setActiveTab('requests'); setPage(1); }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'requests' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    {t('admin.payments.tabs.requests')}
                </button>
                <button
                    onClick={() => { setActiveTab('history'); setPage(1); }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    {t('admin.payments.tabs.history')}
                </button>
            </div>
            {activeTab === 'requests' && (
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                    <option value="all">{t('common.filter')}: All</option>
                    <option value="pending">{t('admin.payments.status.pending')}</option>
                    <option value="approved">{t('admin.payments.status.approved')}</option>
                    <option value="rejected">{t('admin.payments.status.rejected')}</option>
                </select>
            )}
        </div>
      </div>

      <SimpleCard noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">{t('admin.payments.columns.user')}</th>
                <th className="px-6 py-3 font-medium hidden md:table-cell">{t('admin.payments.columns.plan')}</th>
                <th className="px-6 py-3 font-medium">{t('admin.payments.columns.amount')}</th>
                <th className="px-6 py-3 font-medium">{t('admin.payments.columns.status')}</th>
                <th className="px-6 py-3 font-medium hidden lg:table-cell">{t('admin.payments.columns.date')}</th>
                <th className="px-6 py-3 font-medium text-right">{t('admin.payments.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {activeTab === 'requests' ? t('admin.payments.noRequests') : t('admin.payments.noTransactions')}
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.user?.full_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{item.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="capitalize">{item.plan_type?.replace(/_/g, ' ') || item.method}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.amount ? `¥${item.amount}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        (item.status === 'approved' || item.status === 'confirmed') ? 'bg-green-100 text-green-700' :
                        (item.status === 'rejected' || item.status === 'failed') ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {t(`admin.payments.status.${item.status}`) || item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 hidden lg:table-cell">
                      {format(new Date(item.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                        {activeTab === 'requests' && item.image_url && (
                            <Button size="sm" variant="outline" onClick={() => { setSelectedSubmission(item); setProofModalOpen(true); }}>
                                <Eye size={14} className="mr-1" /> {t('admin.payments.actions.viewProof')}
                            </Button>
                        )}
                        <StartConversationButton 
                            userId={item.user_id} 
                            userName={item.user?.full_name || 'User'} 
                            contextType="payment" 
                            sourceContext={`Payment: ${item.plan_type}`}
                            size="sm"
                            variant="ghost"
                            className="text-blue-600"
                        />
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

      {/* Proof Modal */}
      {selectedSubmission && (
        <Modal
          isOpen={proofModalOpen}
          onClose={() => { setProofModalOpen(false); setSelectedSubmission(null); }}
          title={t('admin.payments.actions.viewProof')}
        >
          <div className="p-6 space-y-6">
            <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center min-h-[200px]">
                {selectedSubmission.image_url ? (
                    <img src={selectedSubmission.image_url} alt="Payment Proof" className="max-w-full max-h-[500px] object-contain" />
                ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                        <ImageIcon size={48} />
                        <span className="mt-2">No Image</span>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">User</label>
                    <p className="font-medium">{selectedSubmission.user?.full_name}</p>
                </div>
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Plan</label>
                    <p className="font-medium capitalize">{selectedSubmission.plan_type?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Amount</label>
                    <p className="font-medium">¥{selectedSubmission.amount || '0.00'}</p>
                </div>
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Date</label>
                    <p className="font-medium">{format(new Date(selectedSubmission.created_at), 'PP p')}</p>
                </div>
            </div>

            {selectedSubmission.status === 'pending' && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button
                        variant="outline"
                        onClick={() => handleReview('rejected')}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        disabled={processing}
                    >
                        {processing ? t('common.processing') : t('admin.payments.actions.reject')}
                    </Button>
                    <Button
                        onClick={() => handleReview('approved')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={processing}
                    >
                        {processing ? t('common.processing') : t('admin.payments.actions.approve')}
                    </Button>
                </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
