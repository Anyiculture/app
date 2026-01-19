import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { marketplaceService, MarketplaceItem } from '../services/marketplaceService';
import { messagingService } from '../services/messagingService';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';
import {
  ShoppingBag, CheckCircle, Flag, MessageCircle
} from 'lucide-react';

import { useToast } from '../components/ui/Toast';
import { MarketplaceDetailView } from '../components/marketplace/MarketplaceDetailView';

export function MarketplaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [isFavorited, setIsFavorited] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<null | { type: 'sold' | 'unsold' | 'delete' }> (null);
  const { showToast } = useToast();
  const viewedRef = useRef<string | null>(null);

  useEffect(() => {
    if (id) {
      loadItem();
      // Only increment views if we haven't viewed this item yet
      if (viewedRef.current !== id) {
        incrementViews();
        viewedRef.current = id;
      }
    }
  }, [id]);

  const incrementViews = async () => {
    if (!id) return;
    try {
      await marketplaceService.incrementViews(id);
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const loadItem = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await marketplaceService.getItemById(id);
      setItem(data);
      setIsFavorited(data?.is_favorited || false);
    } catch (error) {
      console.error('Error loading item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (!item?.user_id) {
      alert(t('marketplaceDetail.alert.unableToContact'));
      return;
    }

    try {
      const conversationId = await messagingService.getOrCreateConversation(
        item.user_id,
        'marketplace',
        item.id,
        item.title
      );
      navigate(`/messages?conversation=${conversationId}`);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      alert(t('marketplaceDetail.alert.failStartConversation'));
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (!id) return;

    try {
      const newFavoritedState = await marketplaceService.toggleFavorite(id);
      setIsFavorited(newFavoritedState);
      if (item) {
        setItem({
          ...item,
          favorites_count: newFavoritedState ? item.favorites_count + 1 : item.favorites_count - 1
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleMarkAsSold = async () => {
    if (!id || !item) return;
    setActionLoading('sold');

    try {
      setActionLoading('sold');
      await marketplaceService.markAsSold(id);
      setItem({ ...item, status: 'sold' });
      showToast('success', t('marketplaceDetail.toast.soldSuccess'));
    } catch (error) {
      console.error('Error marking as sold:', error);
      showToast('error', t('marketplaceDetail.toast.soldError'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnmarkAsSold = async () => {
    if (!id || !item) return;
    setActionLoading('unsold');

    try {
      await marketplaceService.updateItem(id, { status: 'active' });
      setItem({ ...item, status: 'active' });
      showToast('success', t('marketplaceDetail.toast.activeSuccess'));
    } catch (error) {
      console.error('Error marking as active:', error);
      showToast('error', t('marketplaceDetail.toast.activeError'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setActionLoading('delete');

    try {
      setActionLoading('delete');
      await marketplaceService.deleteItem(id);
      showToast('success', t('marketplaceDetail.toast.deleteSuccess'));
      navigate('/marketplace');
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast('error', t('marketplaceDetail.toast.deleteError'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReport = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (!id) return;

    const reasons = [
      t('marketplaceDetail.report.reasons.scam'),
      t('marketplaceDetail.report.reasons.inappropriate'),
      t('marketplaceDetail.report.reasons.fake'),
      t('marketplaceDetail.report.reasons.counterfeit'),
      t('marketplaceDetail.report.reasons.prohibited'),
      t('marketplaceDetail.report.reasons.misleading'),
      t('marketplaceDetail.report.reasons.other')
    ];

    const reason = prompt(`${t('marketplaceDetail.report.promptTitle')}\n\n${t('marketplaceDetail.report.promptSelect')}\n${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}`);
    
    if (!reason) return;
    
    const reasonIndex = parseInt(reason) - 1;
    if (reasonIndex < 0 || reasonIndex >= reasons.length) {
      showToast('error', t('marketplaceDetail.report.invalidSelection'));
      return;
    }

    const selectedReason = reasons[reasonIndex];
    const description = prompt(t('marketplaceDetail.report.detailsPrompt'));

    try {
      await marketplaceService.reportItem(id, selectedReason, description || undefined);
      showToast('success', t('marketplaceDetail.report.thankYou'));
    } catch (error) {
      console.error('Error reporting item:', error);
      showToast('error', t('marketplaceDetail.report.fail'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="mx-auto text-gray-400 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('marketplaceDetail.itemNotFound')}</h2>
          <p className="text-gray-600 mb-6">{t('marketplaceDetail.itemRemoved')}</p>
          <Link to="/marketplace">
            <Button>{t('marketplaceDetail.backToMarketplace')}</Button>
          </Link>
        </div>
      </div>
    );
  }


  const isOwner = user?.id === item.user_id;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <MarketplaceDetailView
          item={item}
          loading={loading}
          onBack={() => navigate('/marketplace')}
          onToggleFavorite={handleToggleFavorite}
          isFavorited={isFavorited}
          currentUserId={user?.id}
          actionSlot={
            isOwner ? (
                <div className="space-y-2">
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-2 text-center">
                    <p className="text-xs text-blue-800 font-medium">{t('marketplaceDetail.isOwner')}</p>
                  </div>
                  {item.status === 'active' && (
                    <Button
                      className="w-full h-9 text-sm"
                      onClick={() => setConfirmModal({ type: 'sold' })}
                      variant="outline"
                      isLoading={actionLoading === 'sold'}
                    >
                      <CheckCircle size={16} />
                      {t('marketplaceDetail.markAsSold')}
                    </Button>
                  )}
                  {item.status === 'sold' && (
                    <Button
                      className="w-full h-9 text-sm"
                      onClick={() => setConfirmModal({ type: 'unsold' })}
                      variant="outline"
                      isLoading={actionLoading === 'unsold'}
                    >
                      <CheckCircle size={16} />
                      {t('marketplaceDetail.markAsActive')}
                    </Button>
                  )}
                   <Modal
                    isOpen={!!confirmModal}
                    onClose={() => setConfirmModal(null)}
                    title={confirmModal?.type === 'sold' ? t('marketplaceDetail.modal.markSoldTitle') : confirmModal?.type === 'unsold' ? t('marketplaceDetail.modal.markActiveTitle') : t('marketplaceDetail.modal.deleteTitle')}
                  >
                    {confirmModal?.type === 'sold' && (
                       <div>
                        <p className="text-sm">{t('marketplaceDetail.modal.markSoldConfirm')}</p>
                        <div className="flex gap-3 mt-5 justify-end">
                          <Button variant="outline" size="sm" onClick={() => setConfirmModal(null)}>{t('marketplaceDetail.modal.cancel')}</Button>
                          <Button className="bg-blue-600 text-white" size="sm" isLoading={actionLoading === 'sold'} onClick={handleMarkAsSold}>{t('marketplaceDetail.markAsSold')}</Button>
                        </div>
                      </div>
                    )}
                    {confirmModal?.type === 'unsold' && (
                       <div>
                        <p className="text-sm">{t('marketplaceDetail.modal.markActiveConfirm')}</p>
                        <div className="flex gap-3 mt-5 justify-end">
                          <Button variant="outline" size="sm" onClick={() => setConfirmModal(null)}>{t('marketplaceDetail.modal.cancel')}</Button>
                          <Button className="bg-blue-600 text-white" size="sm" isLoading={actionLoading === 'unsold'} onClick={handleUnmarkAsSold}>{t('marketplaceDetail.markAsActive')}</Button>
                        </div>
                      </div>
                    )}
                    {confirmModal?.type === 'delete' && (
                       <div>
                        <p className="text-sm">{t('marketplaceDetail.modal.deleteConfirm')}</p>
                        <div className="flex gap-3 mt-5 justify-end">
                          <Button variant="outline" size="sm" onClick={() => setConfirmModal(null)}>{t('marketplaceDetail.modal.cancel')}</Button>
                          <Button className="bg-red-600 text-white" size="sm" isLoading={actionLoading === 'delete'} onClick={handleDelete}>{t('marketplaceDetail.modal.delete')}</Button>
                        </div>
                      </div>
                    )}
                  </Modal>
                  <Button
                     variant="outline"
                      className="w-full h-9 text-sm"
                      onClick={() => navigate(`/marketplace/${id}/edit`)}
                      disabled={actionLoading !== null}
                    >
                      {t('marketplaceDetail.editListing')}
                    </Button>
                   <Button
                      className="w-full h-9 text-sm bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => setConfirmModal({ type: 'delete' })}
                      isLoading={actionLoading === 'delete'}
                    >
                      {t('marketplaceDetail.deleteListing')}
                    </Button>
                 </div>
              ) : item.status === 'active' ? (
                <div className="grid grid-cols-1 gap-2">
                  {user ? (
                    <>
                       <Button
                        className="w-full h-10 shadow-sm"
                        onClick={handleContact}
                      >
                        <MessageCircle size={18} />
                        {t('marketplaceDetail.contactSeller')}
                      </Button>
                       <div className="text-center text-[10px] text-gray-400 mb-1">
                        {t('marketplaceDetail.messagesSecure')}
                      </div>
                      <Button
                        className="w-full border bg-white text-red-600 hover:bg-red-50 border-red-200 h-9 text-sm"
                        onClick={handleReport}
                        variant="ghost"
                      >
                        <Flag size={14} />
                        {t('marketplace.reportListing')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                         className="w-full h-10"
                        onClick={() => navigate('/signin')}
                      >
                        {t('marketplaceDetail.signInToContact')}
                      </Button>
                      <Button
                        className="w-full border bg-white text-red-600 hover:bg-red-50 border-red-100 h-9 text-sm"
                        onClick={handleReport}
                        variant="ghost"
                      >
                        <Flag size={14} />
                        {t('marketplace.reportListing')}
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-yellow-800">{t('marketplaceDetail.listingNotAvailable')}</p>
                </div>
              )
          }
        />
      </div>
    </div>
  );
}
