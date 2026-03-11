import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, Lock, Smartphone, Upload, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { BackgroundBlobs } from '../components/ui';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Loading } from '../components/ui/Loading';
import { hostFamilySubscriptionService, type HostFamilySubscriptionState } from '../services/hostFamilySubscriptionService';

type UploadMode = 'submit' | 'renew' | 'resubmit';

const formatDate = (value: string | null) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString();
};

export function AuPairPaymentPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loadingState, setLoadingState] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionState, setSubscriptionState] = useState<HostFamilySubscriptionState | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>('submit');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadState = async () => {
    if (!user?.id) return;
    setLoadingState(true);
    try {
      const state = await hostFamilySubscriptionService.getState(user.id);
      setSubscriptionState(state);

      if (state.role !== 'host_family') {
        setError(t('payment.hostFamilyOnly') || 'Only Host Family accounts can access this payment page.');
        navigate('/account?section=billing', { replace: true });
      } else {
        setError(null);
      }
    } catch (err: any) {
      console.error('Failed to load host family subscription state:', err);
      setError(err?.message || 'Failed to load subscription status.');
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin?redirect=/au-pair/payment');
      return;
    }
    if (user) {
      void loadState();
    }
  }, [authLoading, user?.id, navigate]);

  if (authLoading || loadingState) {
    return <Loading />;
  }

  if (!user) {
    return <Loading />;
  }

  const isHostFamily = subscriptionState?.role === 'host_family';
  const currentStatus = subscriptionState?.subscription_status || 'free';
  const blockedStateFromRoute = searchParams.get('state');

  const canSubmitPayment =
    isHostFamily &&
    (currentStatus === 'free' || currentStatus === 'premium_expired' || currentStatus === 'rejected');

  const openUploadModal = (mode: UploadMode) => {
    setUploadMode(mode);
    setSelectedFile(null);
    setError(null);
    setShowUploadModal(true);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setError('Please upload a JPG or PNG image.');
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  const submitProof = async () => {
    if (!selectedFile) {
      setError('Please select a payment proof image.');
      return;
    }

    setUploading(true);
    try {
      await hostFamilySubscriptionService.submitPaymentProof(selectedFile);
      setShowUploadModal(false);
      navigate('/au-pair/payment/success');
    } catch (err: any) {
      console.error('Failed to submit host family payment proof:', err);
      setError(err?.message || 'Failed to submit payment proof.');
    } finally {
      setUploading(false);
    }
  };

  const statusPanel = () => {
    if (!isHostFamily) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {t('payment.hostFamilyOnly') || 'Only Host Family accounts can access this payment page.'}
        </div>
      );
    }

    if (currentStatus === 'premium_active') {
      return (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 text-green-700" />
            <div>
              <p className="text-sm font-semibold text-green-800">
                {t('payment.active') || 'Premium Plan is active'}
              </p>
              <p className="mt-1 text-sm text-green-700">
                {(t('payment.activeUntil') || 'You already have an active premium subscription until {{date}}.')
                  .replace('{{date}}', formatDate(subscriptionState?.expires_at || null))}
              </p>
              <p className="mt-1 text-xs text-green-700">
                {t('payment.noDuplicateWhileActive') || 'You already have an active subscription and cannot pay again yet.'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (currentStatus === 'pending_approval') {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {t('payment.pendingApproval') || 'Payment submitted, awaiting admin approval'}
              </p>
              <p className="mt-1 text-sm text-amber-700">
                {t('payment.pendingApprovalDescription') || 'You remain on the Free Plan until approval. Duplicate submissions are blocked.'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (currentStatus === 'premium_expired') {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 text-red-700" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {t('payment.expired') || 'Subscription expired, you are now on the Free Plan'}
              </p>
              <p className="mt-1 text-sm text-red-700">
                {t('payment.expiredDescription') || 'Renew to continue contacting au pairs.'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (currentStatus === 'rejected') {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 text-red-700" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {t('payment.rejected') || 'Payment rejected'}
              </p>
              <p className="mt-1 text-sm text-red-700">
                {subscriptionState?.rejection_reason || (t('payment.rejectedDescription') || 'Your payment proof was rejected. Please submit a new proof.')}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-blue-700" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              {t('payment.freePlan') || 'Free Plan'}
            </p>
            <p className="mt-1 text-sm text-blue-700">
              {t('payment.freeDescription') || 'Submit payment proof to activate Premium Plan and contact au pairs.'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans relative overflow-hidden">
      <BackgroundBlobs />
      <div className="max-w-4xl mx-auto px-6 py-16 relative z-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">
            {t('payment.hostFamilyPremiumTitle') || 'Host Family Premium'}
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            {t('payment.hostFamilyPremiumSubtitle') || 'Premium communication access for Host Families only.'}
          </p>
        </motion.div>

        <div className="max-w-xl mx-auto">
          <GlassCard className="p-8 md:p-10 bg-white/85 border-green-200/60 shadow-xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide">
                <Smartphone size={14} />
                {t('payment.wechatOnly') || 'WeChat Pay'}
              </div>
              <p className="mt-5 text-4xl font-black text-gray-900">
                100 CNY <span className="text-lg text-gray-500 font-semibold">/ month</span>
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {t('payment.unlockContact') || 'Unlock communication with au pairs after admin approval.'}
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <img
                src="/wechat-payment-qr.jpg"
                alt="WeChat payment QR"
                className="mx-auto w-full max-w-[280px] rounded-xl bg-white p-2"
              />
              <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('payment.scanAndUpload') || 'Scan, pay, then upload your proof'}
              </p>
            </div>

            <div className="mt-6">{statusPanel()}</div>

            {blockedStateFromRoute && blockedStateFromRoute !== currentStatus && (
              <p className="mt-3 text-xs text-amber-700">
                {t('payment.accessRechecked') || 'Access state was rechecked with backend data.'}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {canSubmitPayment && (
                <Button
                  onClick={() =>
                    openUploadModal(
                      currentStatus === 'rejected'
                        ? 'resubmit'
                        : currentStatus === 'premium_expired'
                          ? 'renew'
                          : 'submit'
                    )
                  }
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Upload size={16} className="mr-2" />
                  {currentStatus === 'premium_expired'
                    ? (t('payment.renewNow') || 'Renew now')
                    : currentStatus === 'rejected'
                      ? (t('payment.resubmitProof') || 'Resubmit proof')
                      : (t('payment.submitProof') || 'Submit payment proof')}
                </Button>
              )}

              <Button variant="outline" onClick={() => navigate('/account?section=billing')}>
                {t('payment.backToBilling') || 'Back to account billing'}
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>

      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={t('payment.uploadProofTitle') || 'Upload Payment Proof'}
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-600">
            {uploadMode === 'renew'
              ? (t('payment.uploadRenewalProofDesc') || 'Upload your renewal payment proof (100 CNY monthly).')
              : uploadMode === 'resubmit'
                ? (t('payment.uploadResubmitProofDesc') || 'Upload a clearer proof image to resubmit your payment.')
                : (t('payment.uploadSubmitProofDesc') || 'Upload your payment proof to submit for admin approval.')}
          </p>

          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
              selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png, image/jpeg, image/jpg"
              onChange={onFileChange}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center">
                <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
                <p className="text-sm font-semibold text-green-700">{selectedFile.name}</p>
                <p className="text-xs text-green-600 mt-1">{t('payment.clickToChange') || 'Click to change image'}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-700">{t('payment.clickToUpload') || 'Click to upload proof'}</p>
                <p className="text-xs text-gray-400 mt-1">{t('payment.formats') || 'JPG, JPEG, PNG'}</p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-lg text-sm">
              <XCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowUploadModal(false)}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={submitProof}
              disabled={!selectedFile || uploading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {uploading ? (t('common.upload.uploading') || 'Uploading...') : (t('payment.submitProof') || 'Submit payment proof')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
