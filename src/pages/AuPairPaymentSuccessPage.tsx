import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { BackgroundBlobs } from '../components/ui';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import { hostFamilySubscriptionService, type HostFamilySubscriptionState } from '../services/hostFamilySubscriptionService';

const formatDate = (value: string | null) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString();
};

export function AuPairPaymentSuccessPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loadingState, setLoadingState] = useState(true);
  const [state, setState] = useState<HostFamilySubscriptionState | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return;
      setLoadingState(true);
      try {
        const subscriptionState = await hostFamilySubscriptionService.getState(user.id);
        setState(subscriptionState);
      } catch (error) {
        console.error('Failed to load host family subscription state on success page:', error);
      } finally {
        setLoadingState(false);
      }
    };

    if (!authLoading && !user) {
      navigate('/signin?redirect=/au-pair/payment');
      return;
    }
    if (user) void run();
  }, [authLoading, user?.id, navigate]);

  if (authLoading || loadingState) return <Loading />;

  const isActive = state?.subscription_status === 'premium_active';

  return (
    <div className="min-h-screen bg-white font-sans relative overflow-hidden flex items-center justify-center px-6">
      <BackgroundBlobs />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-2xl">
        <GlassCard className="p-10 md:p-12 bg-white/85 border-white/70 shadow-2xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            {isActive ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <Clock className="h-8 w-8 text-blue-600" />
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">
            {isActive
              ? (t('payment.successApprovedTitle') || 'Premium activated')
              : (t('payment.successPendingTitle') || 'Payment submitted')}
          </h1>

          <p className="mt-4 text-base text-gray-600">
            {isActive
              ? (t('payment.successApprovedDesc') || `Your premium plan is active until ${formatDate(state?.expires_at || null)}.`)
              : (t('payment.successPendingDesc') || 'Payment submitted, awaiting admin approval. You remain on the Free Plan until approval.')}
          </p>

          {!isActive && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex items-center gap-2 justify-center">
              <AlertCircle size={16} />
              {t('payment.successPendingContactLocked') || 'Messaging/contact with au pairs stays locked until approval.'}
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('/account?section=billing')}>
              {t('payment.viewBillingStatus') || 'View billing status'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              {t('dashboard.backToDashboard') || 'Back to dashboard'}
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
