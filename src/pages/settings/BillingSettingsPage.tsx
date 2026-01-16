

import { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Button } from '../../components/ui/Button';
import { CreditCard, Check, History, Gift } from 'lucide-react';
import { auPairService, UserSubscriptionStatus, RedemptionCode } from '../../services/auPairService';
import { useToast } from '../../components/ui/Toast';

export function BillingSettingsPage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [status, setStatus] = useState<UserSubscriptionStatus | null>(null);
  const [history, setHistory] = useState<RedemptionCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subStatus, redemptionHistory] = await Promise.all([
        auPairService.getUserSubscriptionStatus(),
        auPairService.getRedemptionHistory()
      ]);
      setStatus(subStatus);
      setHistory(redemptionHistory);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    try {
      const result = await auPairService.redeemCode(redeemCode);
      if (result.success) {
        showToast('success', result.message);
        setRedeemCode('');
        loadData(); // Refresh data
      } else {
        showToast('error', result.message);
      }
    } catch (error) {
      showToast('error', 'Redemption failed');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
     return <div className="p-8 text-center">Loading billing information...</div>;
  }

  return (
    <div className="max-w-3xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-gray-100 pb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <CreditCard className="text-gray-700" size={32} />
            {t('settings.billingPlans')}
        </h2>
        <p className="text-gray-500 mt-2 text-md">{t('settings.billing.desc')}</p>
      </div>

      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                  <div>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('settings.billing.currentPlan')}</h3>
                      <p className="text-3xl font-bold capitalize">{status?.subscriptionStatus === 'premium' ? t('settings.billing.premiumPlan') : t('settings.billing.freePlan')}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${status?.subscriptionStatus === 'premium' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/20'}`}>
                    {status?.subscriptionStatus === 'premium' ? t('settings.billing.premium') : t('settings.billing.active')}
                  </span>
              </div>

              <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                      <div className="p-1 bg-green-500/20 rounded-full text-green-400"><Check size={14} /></div>
                      <span className="text-gray-300">{t('settings.billing.features.basicProfile')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="p-1 bg-green-500/20 rounded-full text-green-400"><Check size={14} /></div>
                      <span className="text-gray-300">{status?.subscriptionStatus === 'premium' ? t('settings.billing.features.unlimitedMessages') : t('settings.billing.features.limitedMessages')}</span>
                  </div>
                  {status?.subscriptionStatus === 'premium' && (
                    <div className="flex items-center gap-3">
                        <div className="p-1 bg-green-500/20 rounded-full text-green-400"><Check size={14} /></div>
                        <span className="text-gray-300">{t('settings.billing.features.premiumSupport')}</span>
                    </div>
                  )}
              </div>

              {status?.subscriptionStatus !== 'premium' && (
                 <Button className="bg-white text-gray-900 hover:bg-gray-100 border-0 w-full md:w-auto">{t('settings.billing.upgradePlan')}</Button>
              )}
          </div>
      </div>
      
      {/* Redemption Code Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Gift size={20} className="text-purple-600" />
            {t('settings.billing.redeemCode')}
          </h3>
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder={t('settings.billing.redeemPlaceholder')}
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <Button 
               isLoading={redeeming}
               onClick={handleRedeem}
               disabled={!redeemCode.trim()}
            >
              {t('settings.billing.redeem')}
            </Button>
          </div>
      </div>
      
      <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <History size={20} className="text-gray-600" />
            {t('settings.billing.history')}
          </h3>
          {history.length > 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
               <table className="w-full text-left text-sm">
                 <thead className="bg-gray-50 text-gray-600">
                   <tr>
                     <th className="px-6 py-3 font-medium">{t('common.date')}</th>
                     <th className="px-6 py-3 font-medium">{t('common.code')}</th>
                     <th className="px-6 py-3 font-medium">{t('common.type')}</th>
                     <th className="px-6 py-3 font-medium">{t('common.status')}</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(item.used_at || item.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-900">{item.code}</td>
                        <td className="px-6 py-4 capitalize text-gray-600">{item.type.replace(/_/g, ' ')}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 capitalize">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-500">
              {t('settings.billing.noHistory')}
            </div>
          )}
      </div>
    </div>
  );
}
