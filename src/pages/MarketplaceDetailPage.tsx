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
  ShoppingBag, MapPin, Tag, Calendar, ArrowLeft, MessageCircle,
  User, Heart, Eye, Phone, Flag, CheckCircle, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useToast } from '../components/ui/Toast';
import { TranslateWrapper } from '../components/ui/TranslateWrapper';

export function MarketplaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { language, t } = useI18n();
  const navigate = useNavigate();
  const dateLocale = language === 'zh' ? zhCN : enUS;
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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

  const sellerName = item.seller?.profiles?.full_name || item.seller?.email || t('marketplace.sellerUnknown');
  const isOwner = user?.id === item.user_id;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          {t('marketplaceDetail.backToMarketplace')}
        </button>

        {item.status === 'sold' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center gap-3">
            <CheckCircle className="text-yellow-600" size={20} />
            <div>
              <h3 className="font-semibold text-yellow-900 text-sm">{t('marketplaceDetail.itemSold')}</h3>
              <p className="text-xs text-yellow-700">{t('marketplaceDetail.listingNotAvailable')}</p>
            </div>
          </div>
        )}

        {/* Safety Tips Banner */}
        {!isOwner && item.status === 'active' && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 rounded-full p-1.5 flex-shrink-0">
                <Flag className="text-white" size={16} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 mb-1.5 text-base">{t('marketplaceDetail.safetyTips.title')}</h3>
                <ul className="space-y-1 text-xs text-blue-800">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>{t('marketplaceDetail.safetyTips.meetPublic')}</strong> - {t('marketplaceDetail.safetyTips.meetPublicDesc')}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>{t('marketplaceDetail.safetyTips.inspectBefore')}</strong> - {t('marketplaceDetail.safetyTips.inspectBeforeDesc')}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>{t('marketplaceDetail.safetyTips.securePayment')}</strong> - {t('marketplaceDetail.safetyTips.securePaymentDesc')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4 border border-gray-100">
              <div className="relative h-64 sm:h-80 bg-gray-50 flex items-center justify-center overflow-hidden">
                {item.images && item.images.length > 0 ? (
                  <img
                    src={item.images[selectedImageIndex]}
                    alt={item.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ShoppingBag className="text-gray-300" size={64} />
                )}

                <div className="absolute top-3 right-3 flex gap-2">
                  {user && (
                    <button
                      onClick={handleToggleFavorite}
                      className="bg-white/90 rounded-full p-2 shadow-sm hover:scale-110 transition-transform"
                    >
                      <Heart
                        size={20}
                        className={isFavorited ? 'text-red-500 fill-red-500' : 'text-gray-400'}
                      />
                    </button>
                  )}
                </div>
              </div>

              {item.images && item.images.length > 1 && (
                <div className="p-3 bg-white border-t border-gray-100 overflow-x-auto">
                  <div className="flex gap-2">
                    {item.images.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border transition-all ${
                          selectedImageIndex === index
                            ? 'border-blue-600 ring-1 ring-blue-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`${item.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {language === 'zh' && item.title_zh ? item.title_zh : item.title}
              </h1>

              <div className="flex items-center gap-4 mb-5 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Eye size={14} />
                  <span>{item.views_count} {t('marketplaceDetail.views')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart size={14} />
                  <span>{item.favorites_count} {t('marketplaceDetail.favorites')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{t('marketplaceDetail.posted')} {format(new Date(item.created_at), 'MMM d, yyyy', { locale: dateLocale })}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                  <Tag size={14} />
                  <span>{item.category}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium">
                  <MapPin size={14} />
                  <span>
                    {item.location_city}{item.location_area && `, ${item.location_area}`}
                  </span>
                </div>
                <div className="px-2.5 py-1 bg-green-50 text-green-700 rounded-md text-sm font-medium capitalize">
                  {item.condition.replace('_', ' ')}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('marketplaceDetail.description')}</h2>
                <TranslateWrapper 
                  text={item.description || t('marketplaceDetail.noDescription')}
                  dbTranslation={language === 'zh' ? item.description_zh : null}
                  as="p"
                  className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm"
                />
              </div>

              {/* Product Specifications */}
              <div className="border-t border-gray-100 pt-5 mt-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Tag size={18} />
                  {t('marketplaceDetail.specifications')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {item.brand && (
                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-md">
                      <div className="font-medium text-gray-600 min-w-[90px]">{t('marketplaceDetail.specs.brand')}:</div>
                      <div className="text-gray-900">{item.brand}</div>
                    </div>
                  )}
                  {item.model && (
                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-md">
                      <div className="font-medium text-gray-600 min-w-[90px]">{t('marketplaceDetail.specs.model')}:</div>
                      <div className="text-gray-900">{item.model}</div>
                    </div>
                  )}
                  {item.color && (
                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-md">
                      <div className="font-medium text-gray-600 min-w-[90px]">{t('marketplaceDetail.specs.color')}:</div>
                      <div className="text-gray-900">{item.color}</div>
                    </div>
                  )}
                  {item.size && (
                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-md">
                      <div className="font-medium text-gray-600 min-w-[90px]">{t('marketplaceDetail.specs.size')}:</div>
                      <div className="text-gray-900">{item.size}</div>
                    </div>
                  )}
                  {item.dimensions && (
                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-md">
                      <div className="font-medium text-gray-600 min-w-[90px]">{t('marketplaceDetail.specs.dimensions')}:</div>
                      <div className="text-gray-900">{item.dimensions}</div>
                    </div>
                  )}
                  {item.weight && (
                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-md">
                      <div className="font-medium text-gray-600 min-w-[90px]">{t('marketplaceDetail.specs.weight')}:</div>
                      <div className="text-gray-900">{item.weight}</div>
                    </div>
                  )}
                  {item.material && (
                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-md">
                      <div className="font-medium text-gray-600 min-w-[90px]">{t('marketplaceDetail.specs.material')}:</div>
                      <div className="text-gray-900">{item.material}</div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-md">
                    <div className="font-medium text-gray-600 min-w-[90px]">{t('marketplaceDetail.specs.condition')}:</div>
                    <div className="text-gray-900 capitalize">{item.condition.replace('_', ' ')}</div>
                  </div>
                  {item.quantity_available && item.quantity_available > 1 && (
                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-md">
                      <div className="font-medium text-gray-600 min-w-[90px]">{t('marketplaceDetail.specs.available')}:</div>
                      <div className="text-gray-900">{item.quantity_available} {item.quantity_available === 1 ? t('marketplaceDetail.item') : t('marketplaceDetail.items')}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location & Meetup Information */}
              <div className="border-t border-gray-100 pt-5 mt-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin size={18} />
                  {t('marketplaceDetail.locationMeetup')}
                </h2>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <MapPin className="text-blue-600 mt-0.5" size={18} />
                    <div>
                      <div className="font-medium text-blue-900 mb-0.5 text-sm">
                        {item.location_province && `${item.location_province} > `}
                        {item.location_city}
                        {item.location_area && ` > ${item.location_area}`}
                      </div>
                      {item.meetup_location && (
                        <div className="text-xs text-blue-700 mt-1">
                          <span className="font-semibold">{t('marketplaceDetail.preferredMeetup')}:</span> {item.meetup_location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {item.subcategory && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{t('marketplaceDetail.subcategory')}:</span> {item.subcategory}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-5 sticky top-6 border border-gray-100">
              <div className="mb-5">
                <p className="text-xs text-gray-500 mb-1 uppercase font-medium tracking-wide">{t('marketplaceDetail.price')}</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-3xl font-bold text-blue-600">
                    ${item.price.toLocaleString()}
                  </p>
                  <span className="text-sm text-gray-500 font-medium">{item.currency}</span>
                </div>
                {item.negotiable && (
                  <p className="text-xs text-green-600 mt-1 font-medium">{t('marketplaceDetail.negotiable')}</p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-5 mb-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">{t('marketplaceDetail.sellerInfo')}</h3>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    {item.seller?.profiles?.avatar_url ? (
                      <img
                        src={item.seller.profiles.avatar_url}
                        alt={sellerName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="text-blue-600" size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <p className="font-semibold text-gray-900 text-sm">{sellerName}</p>
                      {/* Verification Badges */}
                      {item.seller?.profiles?.email_verified && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] font-medium border border-green-100">
                          <CheckCircle size={10} />
                          {t('marketplaceDetail.email')}
                        </span>
                      )}
                    </div>
                    
                    {/* Account Age */}
                    {item.seller?.created_at && (
                      <p className="text-[10px] text-gray-500 mb-1.5">
                        <Clock size={10} className="inline mr-1" />
                        {t('marketplaceDetail.memberSince')} {format(new Date(item.seller.created_at), 'MMM yyyy', { locale: dateLocale })}
                      </p>
                    )}

                    {/* Contact Info */}
                    {item.seller?.profiles?.phone && (
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <Phone size={12} />
                        {item.seller.profiles.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-2 rounded-md">
                   <p className="flex items-center gap-1.5">
                      <MessageCircle size={12} className="text-gray-400"/>
                      <span>
                        <span className="font-medium">{t('marketplaceDetail.contactMethod')}:</span>{' '}
                        {item.contact_method === 'in_app' && t('marketplaceDetail.contactOptions.in_app')}
                        {item.contact_method === 'phone' && t('marketplaceDetail.contactOptions.phone')}
                        {item.contact_method === 'wechat' && t('marketplaceDetail.contactOptions.wechat')}
                      </span>
                   </p>
                </div>

                {/* Payment Safety Guide */}
                <div className="mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-md">
                  <h4 className="text-xs font-bold text-amber-800 mb-1.5 flex items-center gap-1">
                    <Flag size={12} />
                    {t('marketplaceDetail.paymentTips.title')}
                  </h4>
                  <ul className="text-[10px] text-amber-800 space-y-1 leading-tight">
                    <li className="flex items-start gap-1">
                      <CheckCircle size={10} className="mt-0.5 flex-shrink-0" />
                      <span>{t('marketplaceDetail.paymentTips.cashLocal')}</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <Flag size={10} className="text-red-600 mt-0.5 flex-shrink-0" />
                      <span>{t('marketplaceDetail.paymentTips.avoidWire')}</span>
                    </li>
                  </ul>
                </div>
              </div>

              {isOwner ? (
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
              )}

              {item.expires_at && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-center gap-1.5">
                   <Clock size={12} />
                  <span>
                    {t('marketplaceDetail.expires')} {format(new Date(item.expires_at), 'MMM d, yyyy', { locale: dateLocale })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
