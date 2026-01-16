import { useState, useEffect } from 'react';
import { Modal } from '../components/ui/Modal';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, ShoppingBag, DollarSign, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { analyticsService } from '../services/analyticsService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useI18n } from '../contexts/I18nContext'; // Verified import
import localizationUtils from '../utils/localization';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  status: 'active' | 'sold' | 'inactive';
  created_at: string;
  images?: string[];
  views_count?: number;
  favorites_count?: number;
  location_city?: string;
}

export default function MyListingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'sold'>('all');

  useEffect(() => {
    loadListings();
    analyticsService.trackPageView('/marketplace/my-listings', 'My Listings Dashboard');
  }, [user]);

  const loadListings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Failed to load listings:', error);
      analyticsService.trackError(error as Error, { context: 'my_listings' });
    } finally {
      setLoading(false);
    }
  };

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<null | { type: 'sold' | 'unsold' | 'delete', listing: Listing }> (null);

  const handleStatusChange = async (listingId: string, newStatus: string) => {
    setActionLoading(listingId + '-' + newStatus);
    try {
      await supabase
        .from('marketplace_items')
        .update({ status: newStatus })
        .eq('id', listingId);

      analyticsService.trackEvent('listing_status_changed', 'marketplace_management', {
        listing_id: listingId,
        new_status: newStatus,
      });

      loadListings();
    } catch (error) {
      console.error('Failed to update listing:', error);
      alert(t('marketplaceEdit.updateError'));
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  const handleDelete = async (listingId: string) => {
    setActionLoading(listingId + '-delete');
    try {
      await supabase.from('marketplace_items').delete().eq('id', listingId);
      analyticsService.trackEvent('listing_deleted', 'marketplace_management', { listing_id: listingId });
      loadListings();
    } catch (error) {
      console.error('Failed to delete listing:', error);
      alert(t('marketplaceEdit.updateError'));
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' 
      ? true 
      : listing.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      sold: 'bg-blue-100 text-blue-800',
      inactive: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/marketplace')} className="mb-4 pl-0 hover:bg-transparent hover:text-blue-600">
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('myListings.backToMarketplace')}
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('myListings.title')}</h1>
              <p className="text-gray-600 mt-1">{t('myListings.subtitle')}</p>
            </div>
            <Button onClick={() => navigate('/marketplace/post')}>
              <Plus className="w-5 h-5 mr-2" />
              {t('myListings.postItem')}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filterStatus === 'active' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('myListings.active')}
            </button>
            <button
              onClick={() => setFilterStatus('sold')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filterStatus === 'sold' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('myListings.sold')}
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filterStatus === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('myListings.allListings')}
            </button>
          </div>
          <Input
            type="text"
            placeholder={t('myListings.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredListings.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('myListings.noListings')}</h3>
              <p className="text-gray-600 mb-6">{t('myListings.startPosting')}</p>
              <Button onClick={() => navigate('/marketplace/post')}>
                <Plus className="w-5 h-5 mr-2" />
                {t('myListings.postFirstItem')}
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('myListings.item')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('myListings.stats')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('myListings.price')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('myListings.category')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('myListings.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('myListings.posted')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('myListings.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                          {listing.images && listing.images.length > 0 ? (
                            <img 
                              src={listing.images[0]} 
                              alt={listing.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ShoppingBag size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{listing.title}</div>
                          <div className="text-sm text-gray-500">{listing.condition}</div>
                          {listing.location_city && (
                            <div className="text-xs text-gray-400 mt-0.5">{listing.location_city}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex flex-col gap-1">
                         <span className="text-xs text-gray-500" title={t('marketplace.views')}>
                           👁️ {listing.views_count || 0}
                         </span>
                         <span className="text-xs text-gray-500" title={t('marketplace.favorites')}>
                           ❤️ {listing.favorites_count || 0}
                         </span>
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {localizationUtils.formatCurrency(listing.price, listing.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {listing.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(listing.status)}`}>
                        {listing.status === 'active' ? t('myListings.active') : listing.status === 'sold' ? t('myListings.sold') : listing.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {localizationUtils.formatRelativeTime(listing.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/marketplace/${listing.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title={t('myListings.view')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/marketplace/edit/${listing.id}`)}
                          className="text-green-600 hover:text-green-900"
                          title={t('myListings.edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmModal({ type: 'delete', listing })}
                          className="text-red-600 hover:text-red-900"
                          title={t('myListings.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {listing.status === 'active' && (
                          <button
                            onClick={() => setConfirmModal({ type: 'sold', listing })}
                            className="text-yellow-600 hover:text-yellow-900"
                            title={t('myListings.markSold')}
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        {listing.status === 'sold' && (
                          <button
                            onClick={() => setConfirmModal({ type: 'unsold', listing })}
                            className="text-green-600 hover:text-green-900"
                            title={t('myListings.markActive')}
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.type === 'sold' ? t('myListings.markSoldTitle') : confirmModal?.type === 'unsold' ? t('myListings.markActiveTitle') : t('myListings.deleteTitle')}
      >
        {confirmModal?.type === 'sold' && (
          <div>
            <p>{t('myListings.markSoldConfirm')}</p>
            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="outline" onClick={() => setConfirmModal(null)}>{t('myListings.cancel')}</Button>
              <Button className="bg-blue-600 text-white" isLoading={actionLoading === (confirmModal?.listing.id + '-sold')} onClick={() => handleStatusChange(confirmModal.listing.id, 'sold')}>{t('myListings.markSold')}</Button>
            </div>
          </div>
        )}
        {confirmModal?.type === 'unsold' && (
          <div>
            <p>{t('myListings.markActiveConfirm')}</p>
            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="outline" onClick={() => setConfirmModal(null)}>{t('myListings.cancel')}</Button>
              <Button className="bg-blue-600 text-white" isLoading={actionLoading === (confirmModal?.listing.id + '-active')} onClick={() => handleStatusChange(confirmModal.listing.id, 'active')}>{t('myListings.markActive')}</Button>
            </div>
          </div>
        )}
        {confirmModal?.type === 'delete' && (
          <div>
            <p>{t('myListings.deleteConfirm')}</p>
            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="outline" onClick={() => setConfirmModal(null)}>{t('myListings.cancel')}</Button>
              <Button className="bg-red-600 text-white" isLoading={actionLoading === (confirmModal?.listing.id + '-delete')} onClick={() => handleDelete(confirmModal.listing.id)}>{t('myListings.delete')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
