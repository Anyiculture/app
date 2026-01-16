import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { Shield, MessageSquare, Eye, Sparkles, Upload, CheckCircle, XCircle, Smartphone } from "lucide-react";
import { auPairService } from "../services/auPairService";
import { GlassCard } from "../components/ui/GlassCard";
import { BackgroundBlobs } from '../components/ui';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Loading } from '../components/ui/Loading';

export function AuPairPaymentPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      // Redirect to login if not authenticated, passing the current path to return to after login
      navigate('/signin?redirect=/au-pair/payment');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return <Loading />;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        setError('Please upload a JPG or PNG image.');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUploadProof = async () => {
    if (!selectedFile) {
      setError('Please select a payment proof image.');
      return;
    }

    setLoading(true);
    try {
      await auPairService.submitPaymentProof(selectedFile, 100); // Amount 100 as per UI
      setShowUploadModal(false);
      navigate('/au-pair/payment/success');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload proof. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Eye,
      title: t('auPair.payment.viewFullProfiles'),
      description: t('auPair.payment.viewFullProfilesDesc')
    },
    {
      icon: MessageSquare,
      title: t('auPair.payment.unlimitedMessages'),
      description: t('auPair.payment.unlimitedMessagesDesc')
    },
    {
      icon: Shield,
      title: t('auPair.payment.verifiedProfiles'),
      description: t('auPair.payment.verifiedProfilesDesc')
    },
    {
      icon: Sparkles,
      title: t('auPair.payment.prioritySupport'),
      description: t('auPair.payment.prioritySupportDesc')
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans relative overflow-hidden">
      <BackgroundBlobs />
      
      <div className="max-w-4xl mx-auto px-6 py-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 uppercase tracking-tight leading-tight">
            {t('auPair.payment.title')}
          </h1>
          <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto">
            {t('auPair.payment.subtitle')}
          </p>
        </motion.div>

        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 -z-10 animate-pulse" />
            <GlassCard className="p-8 md:p-12 bg-white/80 border-green-200/50 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
              
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                  <Smartphone size={14} />
                  {t('auPair.payment.weChatPayOnly')}
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-2">
                  ¥100 <span className="text-lg text-gray-400 font-bold">/ {t('auPair.payment.month')}</span>
                </h3>
                <p className="text-sm text-gray-500 font-medium">{t('auPair.payment.scanToSubscribe')}</p>
              </div>

              <div className="bg-white p-4 rounded-3xl shadow-lg border border-gray-100 mb-8 transform hover:scale-105 transition-transform duration-300">
                 {/* Replace with actual QR Code */}
                 <div className="w-80 h-auto bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Smartphone className="w-16 h-16 text-green-500 opacity-20" />
                    </div>
                    {/* Placeholder for QR Code */}
                    <img 
                        src="/wechat-payment-qr.jpg" 
                        alt="WeChat Pay QR Code" 
                        className="w-full h-full object-contain relative z-10"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('border-2', 'border-red-400', 'border-dashed', 'h-64');
                          const msg = document.getElementById('qr-missing-msg');
                          if (msg) msg.style.display = 'flex';
                        }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ display: 'none' }} id="qr-missing-msg">
                       <p className="text-xs text-red-500 font-bold px-4 text-center">
                         Image missing.<br/>
                         Save "wechat-payment-qr.jpg"<br/>
                         to /public folder
                       </p>
                    </div>
                 </div>
                 <p className="mt-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Scan with WeChat</p>
              </div>

              <div className="space-y-4 w-full">
                <div className="text-left bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-gray-900 text-sm mb-2">{t('auPair.payment.instructionsTitle')}</h4>
                    <ol className="text-xs text-gray-600 space-y-1.5 list-decimal pl-4">
                        <li>{t('auPair.payment.instruction1')}</li>
                        <li>{t('auPair.payment.instruction2')}</li>
                        <li>{t('auPair.payment.instruction3')}</li>
                        <li>{t('auPair.payment.instruction4')}</li>
                        <li>{t('auPair.payment.instruction5')}</li>
                        <li>{t('auPair.payment.instruction6')}</li>
                    </ol>
                </div>

                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  {t('auPair.payment.iHavePaid')}
                </Button>
              </div>

            </GlassCard>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-center h-full">
                <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center mb-4 mx-auto text-pink-600">
                  <feature.icon size={20} />
                </div>
                <h4 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">{feature.title}</h4>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={t('auPair.payment.uploadProofTitle')}
      >
        <div className="space-y-6">
            <p className="text-sm text-gray-600">
                {t('auPair.payment.uploadProofDesc')}
            </p>

            <div 
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}`}
                onClick={() => fileInputRef.current?.click()}
            >
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileChange}
                />
                
                {selectedFile ? (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
                        <p className="text-sm font-bold text-green-700">{selectedFile.name}</p>
                        <p className="text-xs text-green-600 mt-1">{t('auPair.payment.clickToChange')}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-700">{t('auPair.payment.clickToUpload')}</p>
                        <p className="text-xs text-gray-400 mt-1">{t('auPair.payment.formats')}</p>
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                    <XCircle size={16} />
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowUploadModal(false)}>{t('common.cancel')}</Button>
                <Button 
                    onClick={handleUploadProof} 
                    disabled={!selectedFile || loading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    {loading ? t('common.uploading') : t('auPair.payment.submitProof')}
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
}
