import { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Button } from '../../components/ui/Button';
import { CreditCard, Check } from 'lucide-react';
import { auPairService, UserSubscriptionStatus } from '../../services/auPairService';

export function BillingSettingsPage() {
  const { t } = useI18n();
  const [status, setStatus] = useState<UserSubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const subStatus = await auPairService.getUserSubscriptionStatus();
      setStatus(subStatus);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
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
                 <Button className="bg-white text-gray-900 hover:bg-gray-100 border-0 w-full md:w-auto">
                    <CreditCard size={16} className="mr-2" />
                    {t('settings.billing.upgradePlan')}
                 </Button>
              )}
          </div>
      </div>
    </div>
  );
}
