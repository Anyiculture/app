import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { auPairService } from '../services/auPairService';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import { CheckCircle, XCircle, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function SubscriptionManagementPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const status = await auPairService.getUserSubscriptionStatus();
      setSubscription(status);
    } catch (err) {
      console.error('Failed to load subscription:', err);
      setError(t('subscription.errors.load'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setProcessing(true);
      await auPairService.cancelSubscription();
      await loadSubscription();
      setShowCancelDialog(false);
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      setError(t('subscription.errors.cancel'));
    } finally {
      setProcessing(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/au-pair/payment');
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('subscription.title')}
          </h1>
          <p className="text-gray-600">
            {t('subscription.subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {t('subscription.currentPlan')}
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    subscription?.subscriptionStatus === 'premium'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {subscription?.subscriptionStatus === 'premium' ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {t('subscription.premium')}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-1" />
                      {t('subscription.free')}
                    </>
                  )}
                </span>
              </div>
            </div>

            {subscription?.subscriptionStatus === 'premium' && (
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                disabled={processing}
              >
                {t('subscription.cancelSubscription')}
              </Button>
            )}
            {subscription?.subscriptionStatus === 'free' && (
              <Button onClick={handleUpgrade}>{t('subscription.upgradeToPremium')}</Button>
            )}
          </div>

          {subscription?.subscriptionStatus === 'premium' && subscription?.subscription && (
            <div className="grid md:grid-cols-2 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">{t('subscription.billingCycle')}</p>
                  <p className="font-medium text-gray-900">
                    {subscription.subscription.billing_cycle === 'monthly'
                      ? t('subscription.monthly')
                      : t('subscription.annual')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">{t('subscription.nextBillingDate')}</p>
                  <p className="font-medium text-gray-900">
                    {subscription.subscription.end_date
                      ? new Date(subscription.subscription.end_date).toLocaleDateString()
                      : t('common.na')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('subscription.freePlan')}
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  {t('subscription.plans.free.features.profile')}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  {t('subscription.plans.free.features.browsing')}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{t('subscription.plans.free.features.matching')}</p>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-500">{t('subscription.plans.free.features.messaging')}</p>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-500">
                  {t('subscription.plans.free.features.algorithm')}
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-4">{t('subscription.free')}</div>
            {subscription?.subscriptionStatus === 'free' && (
              <p className="text-sm text-gray-600">{t('subscription.currentPlanLabel')}</p>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-md p-6 border-2 border-blue-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('subscription.premiumPlan')}
              </h3>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                {t('subscription.popular')}
              </span>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  {t('subscription.plans.premium.features.customization')}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  {t('subscription.plans.premium.features.browsing')}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  {t('subscription.plans.premium.features.algorithm')}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{t('subscription.plans.premium.features.messaging')}</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  {t('subscription.plans.premium.features.scheduling')}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  {t('subscription.plans.premium.features.contract')}
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {t('subscription.plans.premium.price.month')}
            </div>
            <p className="text-sm text-gray-600 mb-4">{t('subscription.plans.premium.price.year')}</p>
            {subscription?.subscriptionStatus !== 'premium' && (
              <Button onClick={handleUpgrade} className="w-full">
                {t('subscription.upgradeNow')}
              </Button>
            )}
            {subscription?.subscriptionStatus === 'premium' && (
              <p className="text-sm text-gray-600 text-center">{t('subscription.currentPlanLabel')}</p>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/au-pair/dashboard')}
          >
            {t('dashboard.backToDashboard')}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelSubscription}
        title={t('subscription.cancelDialog.title')}
        message={t('subscription.cancelDialog.message')}
        confirmText={t('subscription.cancelDialog.confirm')}
        cancelText={t('subscription.cancelDialog.cancel')}
        variant="danger"
      />
    </div>
  );
}
