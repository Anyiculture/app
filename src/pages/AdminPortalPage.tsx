import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { adminService, AdminStats } from '../services/adminService';
import { educationService } from '../services/educationService';
import { jobsService, Job } from '../services/jobsService';
import { marketplaceService, MarketplaceItem } from '../services/marketplaceService';
import { eventsService, Event } from '../services/eventsService';
import { visaService } from '../services/visaService';
import { 
  Button, 
  Loading, 
  ConfirmDialog, 
  GlassCard,
  BackgroundBlobs
} from '../components/ui';
import {
  Users, Briefcase, GraduationCap, Calendar,
  AlertCircle, Clock, Activity, BarChart3,
  Star, Eye, Trash2, Search, Download, Mail, MessageSquare, Plus, Copy, FileText,
  ArrowLeft, UserCheck, LogOut, Lock, ShoppingBag, TrendingUp, MapPin, CheckCircle,
  Zap, Shield, Globe, Sparkles, Rocket, CreditCard, Phone, X, ExternalLink
} from 'lucide-react';
import { VisaApplicationDetailView } from '../components/visa/VisaApplicationDetailView';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export function AdminPortalPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'education' | 'jobs' | 'marketplace' | 'events' | 'users' | 'analytics' | 'activity' | 'messages' | 'payments' | 'visa' | 'au-pair' | 'settings'>('overview');
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    const isUnlocked = sessionStorage.getItem('admin_unlocked');
    if (isUnlocked === 'true') {
      setIsLocked(false);
    }
    
    // Check for tab query parameter
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'settings') {
      setActiveTab('settings');
    }
  }, []);

  const handleUnlock = () => {
    setIsLocked(false);
    sessionStorage.setItem('admin_unlocked', 'true');
  };

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    try {
      setLoading(true);
      const hasAccess = await adminService.checkIsAdmin();
      
      if (!hasAccess) {
        console.warn('User does not have admin access, redirecting...');
        navigate('/dashboard');
        return;
      }

      console.log('Admin access granted, fetching dashboard stats...');
      const statsData = await adminService.getAdminStats();
      console.log('Stats received in component:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error in AdminPortal access check:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (isLocked) {
    return <LockScreen user={user} onUnlock={handleUnlock} />;
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-50/30 overflow-hidden relative">
      <BackgroundBlobs className="opacity-40" />
      
      <div className="max-w-[100rem] mx-auto p-3 lg:p-8 space-y-4 lg:space-y-8 relative z-10">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 bg-white/40 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-white/60 shadow-xl shadow-purple-500/5"
        >
          <div className="flex items-center gap-5">
            <div className="bg-gradient-to-tr from-vibrant-purple to-vibrant-pink p-3.5 rounded-2xl shadow-lg shadow-vibrant-purple/20 rotate-3">
              <Shield className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-gray-900 font-display">
                {t('admin.portal')}
                <span className="text-vibrant-purple ml-2">.</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-gray-500 text-sm font-medium tracking-wide uppercase">{t('admin.manageContent')}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="gap-2 rounded-full px-4 sm:px-6 py-2 border-gray-200 bg-white/50 hover:bg-white text-gray-600 hover:text-gray-900 transition-all font-bold shadow-sm text-[10px] sm:text-sm"
              >
                <LogOut size={14} className="sm:w-4 sm:h-4" />
                {t('admin.switchToUserView')}
              </Button>
            <Button 
                variant="outline" 
                onClick={() => setActiveTab('settings')}
                className={`gap-2 rounded-full px-4 sm:px-6 py-2 border-gray-200 bg-white/50 hover:bg-white transition-all font-bold shadow-sm text-[10px] sm:text-sm ${activeTab === 'settings' ? 'text-vibrant-purple border-vibrant-purple/30' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <Shield size={14} className="sm:w-4 sm:h-4" />
                {t('admin.settings.title')}
              </Button>
            {activeTab !== 'overview' && (
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('overview')} 
                className="gap-2 rounded-full px-6 border-gray-200 bg-white/50 hover:bg-white text-vibrant-purple hover:text-vibrant-purple hover:border-vibrant-purple/30 font-bold transition-all shadow-sm"
              >
                <ArrowLeft size={16} />
                {t('admin.backToOverview')}
              </Button>
            )}
            <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-gray-200/50">
              <div className="text-right">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t('admin.welcomeBack')}</p>
                <p className="text-sm font-extrabold text-gray-900">{user?.user_metadata?.full_name || 'Administrator'}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  <Users size={20} className="text-gray-600" />
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {activeTab === 'overview' && (
          <div className="space-y-10">
            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <StatCard
                icon={<Users size={20} className="sm:w-6 sm:h-6" />}
                title={t('admin.totalUsers')}
                value={stats.totalUsers}
                gradient="from-blue-600 to-cyan-500"
                delay={0.1}
              />
              <StatCard
                icon={<Briefcase size={20} className="sm:w-6 sm:h-6" />}
                title={t('admin.totalJobs')}
                value={stats.totalJobs}
                gradient="from-green-600 to-emerald-500"
                delay={0.2}
              />
              <StatCard
                icon={<GraduationCap size={20} className="sm:w-6 sm:h-6" />}
                title={t('admin.educationPrograms')}
                value={stats.totalEducationPrograms}
                gradient="from-indigo-600 to-blue-500"
                delay={0.3}
              />
              <StatCard
                icon={<Calendar size={20} className="sm:w-6 sm:h-6" />}
                title={t('admin.totalEvents')}
                value={stats.totalEvents}
                gradient="from-purple-600 to-pink-500"
                delay={0.4}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <StatCard
                icon={<Clock size={20} className="sm:w-6 sm:h-6" />}
                title={t('admin.pendingJobApplications')}
                value={stats.pendingJobApplications}
                gradient="from-amber-500 to-orange-400"
                badge={t('admin.needsReview')}
                delay={0.5}
              />
              <StatCard
                icon={<FileText size={20} className="sm:w-6 sm:h-6" />}
                title={t('admin.pendingVisaApplications')}
                value={stats.pendingVisaApplications}
                gradient="from-rose-500 to-pink-400"
                badge={t('admin.needsReview')}
                delay={0.6}
              />
              <StatCard
                icon={<AlertCircle size={20} className="sm:w-6 sm:h-6" />}
                title={t('admin.pendingEducationInterests')}
                value={stats.pendingEducationInterests}
                gradient="from-orange-600 to-red-500"
                badge={t('admin.needsReview')}
                delay={0.7}
              />
              <StatCard
                icon={<Activity size={20} className="sm:w-6 sm:h-6" />}
                title={t('admin.activeConversations')}
                value={stats.activeConversations}
                gradient="from-sky-600 to-indigo-500"
                delay={0.8}
              />
            </div>

            {/* NEW HIGH-END QUICK ACTION BAR */}
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.9 }}
               className="bg-white/60 backdrop-blur-2xl rounded-2xl sm:rounded-[3rem] p-4 sm:p-8 border border-white shadow-2xl shadow-purple-500/10"
            >
               <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-8">
                  <div className="p-1.5 sm:p-2 bg-vibrant-purple/10 rounded-full">
                     <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-vibrant-purple" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-black text-gray-900 uppercase tracking-tight">{t('admin.quickActions')}</h2>
                    <p className="text-[10px] sm:text-sm text-gray-500 font-medium">{t('admin.dashboard.quickActionsSubtitle')}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
                  <ModernQuickAction
                     icon={<GraduationCap size={20} className="sm:w-[28px] sm:h-[28px]" />}
                     label={t('admin.educationManagement')}
                     onClick={() => setActiveTab('education')}
                     color="indigo"
                  />
                  <ModernQuickAction
                     icon={<Briefcase size={20} className="sm:w-[28px] sm:h-[28px]" />}
                     label={t('admin.jobsManagement')}
                     onClick={() => setActiveTab('jobs')}
                     color="emerald"
                  />
                  <ModernQuickAction
                     icon={<Users size={20} className="sm:w-[28px] sm:h-[28px]" />}
                     label={t('admin.userManagement')}
                     onClick={() => setActiveTab('users')}
                     color="blue"
                  />
                  <ModernQuickAction
                     icon={<FileText size={20} className="sm:w-[28px] sm:h-[28px]" />}
                     label={t('admin.visaManagement')}
                     onClick={() => setActiveTab('visa')}
                     color="rose"
                  />
                  <ModernQuickAction
                     icon={<UserCheck size={20} className="sm:w-[28px] sm:h-[28px]" />}
                     label={t('admin.auPairManagement')}
                     onClick={() => setActiveTab('au-pair')}
                     color="purple"
                  />
                   <ModernQuickAction
                     icon={<Globe size={20} className="sm:w-[28px] sm:h-[28px]" />}
                     label={t('admin.marketplace.moderation')}
                     onClick={() => setActiveTab('marketplace')}
                     color="orange"
                  />
               </div>
            </motion.div>

            {/* ANALYTICS PREVIEW SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                   <LiveNotifications />
                   
                   <GlassCard className="p-8 h-[400px] flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                           <div className="p-3 bg-blue-50 rounded-2xl">
                              <TrendingUp className="text-blue-600 w-6 h-6" />
                           </div>
                           <h3 className="text-xl font-bold text-gray-900">{t('admin.dashboard.growthOverview')}</h3>
                         </div>
                         <select className="bg-gray-50 border-0 rounded-full px-4 py-2 text-sm font-bold text-gray-600 ring-1 ring-gray-200">
                            <option>{t('admin.dashboard.filter.last30Days')}</option>
                            <option>{t('admin.dashboard.filter.last6Months')}</option>
                         </select>
                      </div>
                      <div className="flex-1 w-full px-6 flex items-end justify-between gap-2 h-32 my-6">
                        {[
                          { label: 'Users', value: stats.totalUsers, color: 'bg-indigo-500' },
                          { label: 'Jobs', value: stats.totalJobs, color: 'bg-emerald-500' },
                          { label: 'Market', value: stats.totalMarketplaceItems, color: 'bg-orange-500' },
                          { label: 'Events', value: stats.totalEvents, color: 'bg-blue-500' },
                        ].map((item, i) => {
                          const max = Math.max(stats.totalUsers, stats.totalJobs, stats.totalMarketplaceItems, stats.totalEvents) * 1.2 || 1;
                          const height = Math.max((item.value / max) * 100, 10);
                          
                          return (
                            <div key={i} className="flex flex-col items-center gap-2 group w-full">
                              <div className="w-full bg-gray-100 rounded-t-lg relative h-32 overflow-hidden flex items-end group-hover:bg-gray-50 transition-colors">
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: `${height}%` }}
                                  transition={{ duration: 1, delay: i * 0.1 }}
                                  className={`w-full ${item.color} opacity-80 group-hover:opacity-100 transition-opacity rounded-t-lg mx-auto max-w-[40px]`}
                                />
                              </div>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-8 pt-6 border-t border-gray-100/50">
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-sm font-bold text-gray-600">Active Users</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-vibrant-purple" />
                            <span className="text-sm font-bold text-gray-600">Interactions</span>
                         </div>
                      </div>
                   </GlassCard>
                </div>

                <div className="space-y-6">
                    <button 
                      onClick={() => setActiveTab('analytics')}
                      className="w-full group bg-gradient-to-r from-vibrant-purple to-vibrant-pink p-[2px] rounded-3xl shadow-xl shadow-vibrant-purple/20 transition-transform active:scale-95"
                    >
                      <div className="bg-white/90 backdrop-blur-xl rounded-[calc(1.5rem-2px)] p-6 h-full flex flex-col items-start text-left group-hover:bg-white/80 transition-colors">
                        <BarChart3 size={40} className="text-vibrant-purple mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">{t('admin.analytics.title')}</h3>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed">{t('admin.dashboard.analyticsSubtitle')}</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveTab('activity')}
                      className="w-full group bg-white/60 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-left"
                    >
                        <div className="flex items-center gap-4 mb-4">
                           <div className="p-2 bg-gray-100 rounded-full group-hover:bg-vibrant-purple/10 transition-colors">
                            <Activity size={24} className="text-gray-600 group-hover:text-vibrant-purple transition-colors" />
                           </div>
                           <h3 className="font-bold text-gray-900 uppercase tracking-tighter">{t('admin.dashboard.systemHealth')}</h3>
                        </div>
                        <div className="space-y-3">
                           <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                              <span>{t('admin.dashboard.database')}</span>
                              <span className="text-green-500">{t('admin.dashboard.optimal')}</span>
                           </div>
                           <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "95%" }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="bg-green-500 h-full" 
                              />
                           </div>
                           <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                              <span>{t('admin.dashboard.apiLatency')}</span>
                              <span className="text-blue-500">24ms</span>
                           </div>
                        </div>
                    </button>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'education' && <EducationAdminPanel />}
        {activeTab === 'jobs' && <JobsAdminPanel />}
        {activeTab === 'marketplace' && <MarketplaceAdminPanel />}
        {activeTab === 'events' && <EventsAdminPanel />}
        {activeTab === 'users' && <UsersAdminPanel />}
        {activeTab === 'messages' && <MessagesAdminPanel />}
        {activeTab === 'visa' && <VisaAdminPanel />}
        {activeTab === 'au-pair' && <AuPairAdminPanel />}
        {activeTab === 'payments' && <PaymentsAdminPanel />}
        {activeTab === 'analytics' && <AnalyticsPanel />}
        {activeTab === 'activity' && <ActivityLogPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, gradient, badge, delay }: {
  icon: React.ReactNode;
  title: string;
  value: number;
  gradient: string;
  badge?: string;
  delay: number;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="group relative bg-white/40 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] p-3 sm:p-6 border border-white/60 shadow-lg hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-[0.03] blur-3xl -mr-10 -mt-10 group-hover:opacity-[0.1] transition-opacity`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-tr ${gradient} text-white shadow-lg shadow-current/20 group-hover:scale-110 transition-transform duration-500`}>
            {icon}
          </div>
          {badge && (
            <motion.span 
              animate={{ opacity: [1, 0.5, 1] }} 
              transition={{ duration: 2, repeat: Infinity }}
              className="px-3 py-1 bg-gradient-to-r from-red-500/10 to-pink-500/10 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-500/20"
            >
              {badge}
            </motion.span>
          )}
        </div>
        <div>
          <div className="text-xl sm:text-4xl font-black text-gray-900 mb-1 tracking-tighter">
             {(value ?? 0).toLocaleString()}
          </div>
          <div className="text-[8px] sm:text-sm font-bold text-gray-400 uppercase tracking-widest">{title}</div>
        </div>
      </div>
    </motion.div>
  );
}

function ModernQuickAction({ icon, label, onClick, color }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}) {
  const colors = {
    indigo: 'from-indigo-100 to-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-500/5',
    emerald: 'from-emerald-100 to-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/5',
    blue: 'from-blue-100 to-blue-50 text-blue-600 border-blue-100 shadow-blue-500/5',
    rose: 'from-rose-100 to-rose-50 text-rose-600 border-rose-100 shadow-rose-500/5',
    purple: 'from-purple-100 to-purple-50 text-purple-600 border-purple-100 shadow-purple-500/5',
    orange: 'from-orange-100 to-orange-50 text-orange-600 border-orange-100 shadow-orange-500/5',
  };

  const selectedColor = colors[color as keyof typeof colors] || colors.blue;

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center p-3 sm:p-6 bg-gradient-to-b ${selectedColor} rounded-2xl sm:rounded-[2.5rem] border-2 shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95`}
    >
      <div className="mb-4 group-hover:scale-125 transition-transform duration-500">
        {icon}
      </div>
      <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-tighter text-center leading-tight">
        {label}
      </span>
      <div className="absolute inset-0 rounded-[2.5rem] bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
    </button>
  );
}

function LiveNotifications() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to new education interest submissions for real-time updates
    const channel = supabase
      .channel('education_interests_changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'education_interests' 
      }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await educationService.getLatestInterests(5);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading live notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (notif: any) => {
    const text = `Contact: ${notif.full_name}\nEmail: ${notif.email}\nPhone: ${notif.phone || 'N/A'}`;
    navigator.clipboard.writeText(text);
    alert(t('admin.contactCopied'));
  };

  if (!loading && notifications.length === 0) return null;

  return (
    <div className="bg-white/60 backdrop-blur-2xl rounded-[3rem] p-8 border border-white shadow-2xl shadow-pink-500/5">
       <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
             <div className="p-2 bg-vibrant-pink/10 rounded-full">
                <Sparkles className="w-6 h-6 text-vibrant-pink" />
             </div>
             <div>
               <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t('admin.dashboard.liveInquiries')}</h2>
               <p className="text-sm text-gray-500 font-medium tracking-tight">{t('admin.dashboard.liveInquiriesSubtitle')}</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-vibrant-pink animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-vibrant-pink">{t('admin.dashboard.liveFeed')}</span>
          </div>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notifications.map((notif, idx) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/80 backdrop-blur-md p-5 rounded-[2rem] border border-white/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col h-full"
            >
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-vibrant-purple to-vibrant-pink flex items-center justify-center text-white font-black text-lg shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                     {notif.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-black text-gray-900 leading-tight truncate uppercase tracking-tight">{notif.full_name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                       {notif.resource?.title || 'Education Program'}
                    </p>
                  </div>
               </div>
               
               <div className="mt-auto flex items-center gap-2">
                  <a 
                    href={`mailto:${notif.email}`} 
                    className="flex-1 py-2.5 bg-gray-50 hover:bg-vibrant-purple hover:text-white rounded-xl text-gray-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  >
                    <Mail size={12} />
                    {t('admin.email')}
                  </a>
                  {notif.phone && (
                    <a 
                      href={`tel:${notif.phone}`} 
                      className="flex-1 py-2.5 bg-gray-50 hover:bg-emerald-600 hover:text-white rounded-xl text-gray-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                      <Phone size={12} />
                      {t('admin.actions.call')}
                    </a>
                  )}
                  <button 
                    onClick={() => handleCopy(notif)}
                    className="p-2.5 bg-gray-50 hover:bg-gray-900 hover:text-white rounded-xl text-gray-400 transition-all"
                  >
                    <Copy size={14} />
                  </button>
               </div>
            </motion.div>
          ))}
       </div>
    </div>
  );
}

function EducationAdminPanel() {
  const { t } = useTranslation();
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadInterests();
  }, [filter]);

  const loadInterests = async () => {
    try {
      setLoading(true);
      const data = await educationService.getAllInterests({
        status: filter !== 'all' ? filter : undefined
      });
      setInterests(data);
    } catch (error) {
      console.error('Error loading interests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (interestId: string, status: string) => {
    try {
      await educationService.updateInterestStatus(interestId, status);
      await adminService.logActivity('update_education_interest_status', 'education_interests', interestId, { status });
      loadInterests();
      alert(t('admin.statusUpdated'));
    } catch (error) {
      console.error('Error updating status:', error);
      alert(t('admin.updateFailed'));
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex items-center justify-between bg-white/40 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-white/60 shadow-lg">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">{t('admin.education.applications')}</h2>
          <p className="text-[10px] sm:text-sm text-gray-500 font-medium">{t('admin.dashboard.educationSubtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.education.filter.all')}</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 sm:px-6 py-1.5 sm:py-2.5 bg-white border-0 rounded-full text-[10px] sm:text-sm font-bold text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-vibrant-purple transition-all cursor-pointer shadow-sm"
          >
            <option value="all">{t('admin.education.filter.all')}</option>
            <option value="submitted">{t('admin.education.filter.submitted')}</option>
            <option value="under_review">{t('admin.education.filter.underReview')}</option>
            <option value="approved">{t('admin.education.filter.approved')}</option>
            <option value="rejected">{t('admin.education.filter.rejected')}</option>
          </select>
        </div>
      </div>

      {interests.length === 0 ? (
        <GlassCard className="text-center py-20">
          <GraduationCap className="mx-auto text-gray-200 mb-4" size={80} />
          <p className="text-gray-400 font-bold uppercase tracking-widest">{t('admin.education.noApplications')}</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {interests.map((interest, idx) => (
            <motion.div
              key={interest.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GlassCard className="p-4 sm:p-8 hover:shadow-2xl hover:shadow-purple-500/5 transition-all group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                      <UserCheck size={24} className="sm:w-9 sm:h-9" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
                        {interest.full_name || interest.user?.profiles?.full_name || 'Anonymous User'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 sm:mt-2">
                        <span className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm font-bold text-gray-500 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-full ring-1 ring-gray-100">
                           <Mail size={12} className="sm:w-3.5 sm:h-3.5 text-vibrant-purple" />
                           {interest.email || interest.user?.email}
                        </span>
                        {interest.phone && (
                          <span className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm font-bold text-gray-500 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-full ring-1 ring-gray-100">
                             <Phone size={12} className="sm:w-3.5 sm:h-3.5 text-vibrant-pink" />
                             {interest.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm font-bold text-gray-500 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-full ring-1 ring-gray-100">
                           <GraduationCap size={12} className="sm:w-3.5 sm:h-3.5 text-blue-500" />
                           {interest.resource?.title || 'Unknown Program'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <button
                      onClick={() => {
                        const info = `Name: ${interest.full_name}\nEmail: ${interest.email}\nPhone: ${interest.phone || 'N/A'}`;
                        navigator.clipboard.writeText(info);
                        alert(t('admin.contactCopied'));
                      }}
                      className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-vibrant-purple hover:border-vibrant-purple/30 transition-all shadow-sm"
                    >
                      <Copy size={12} />
                      {t('admin.actions.copyContact')}
                    </button>
                    <div className="flex flex-col items-end">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        interest.status === 'submitted' ? 'bg-blue-500 text-white' :
                        interest.status === 'under_review' ? 'bg-amber-500 text-white' :
                        interest.status === 'approved' ? 'bg-emerald-500 text-white' :
                        'bg-rose-500 text-white'
                      }`}>
                        {interest.status.replace('_', ' ')}
                      </span>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                         {new Date(interest.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
              </div>

              {interest.motivation && (
                 <div className="mt-8 p-6 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                   <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <Sparkles size={14} className="text-vibrant-purple" />
                     {t('admin.education.studentMotivation')}
                   </p>
                  <p className="text-gray-700 font-medium leading-relaxed italic">"{interest.motivation}"</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100/50">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full px-4 sm:px-8 text-[9px] sm:text-xs font-black uppercase tracking-widest border-amber-200 text-amber-600 hover:bg-amber-50"
                  onClick={() => handleStatusUpdate(interest.id, 'under_review')}
                >
                  {t('admin.education.markReview')}
                </Button>
                <Button
                  size="sm"
                  className="rounded-full px-4 sm:px-8 text-[9px] sm:text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                  onClick={() => handleStatusUpdate(interest.id, 'approved')}
                >
                   {t('admin.education.approve')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full px-4 sm:px-8 text-[9px] sm:text-xs font-black uppercase tracking-widest border-rose-200 text-rose-600 hover:bg-rose-50"
                  onClick={() => handleStatusUpdate(interest.id, 'rejected')}
                >
                   {t('admin.education.reject')}
                </Button>
              </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function JobsAdminPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, [filter]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await jobsService.getJobs(1, 100, {
        status: filter !== 'all' && filter !== 'featured' ? filter : undefined
      });
      // jobsService.getJobs returns { jobs: Job[], total: number, ... }
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = async (jobId: string, featured: boolean) => {
    try {
      await jobsService.updateJob(jobId, { featured: !featured });
      await adminService.logActivity(featured ? 'unfeature_job' : 'feature_job', 'jobs', jobId);
      loadJobs();
    } catch (error) {
      console.error('Error toggling feature:', error);
      alert(t('admin.jobUpdateFailed'));
    }
  };

  const handleStatusToggle = async (jobId: string, status: string) => {
    try {
      const newStatus = status === 'active' ? 'inactive' : 'active';
      await jobsService.updateJob(jobId, { status: newStatus });
      await adminService.logActivity('update_job_status', 'jobs', jobId, { status: newStatus });
      loadJobs();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(t('admin.jobStatusFailed'));
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      await jobsService.deleteJob(jobId);
      await adminService.logActivity('delete_job', 'jobs', jobId);
      loadJobs();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting job:', error);
      alert(t('admin.jobDeleteFailed'));
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location_city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'featured') {
      return matchesSearch && job.featured;
    }
    return matchesSearch;
  });

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 bg-white/40 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-white/60 shadow-lg">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-gray-900 uppercase tracking-tight">{t('admin.jobs.management')}</h2>
          <p className="text-[10px] sm:text-sm text-gray-500 font-medium">Control and moderate professional job listings</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-vibrant-purple transition-colors" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('admin.jobs.search')}
              className="pl-12 pr-6 py-2.5 bg-white/60 focus:bg-white border-0 rounded-full text-sm font-bold text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-vibrant-purple transition-all w-full lg:w-64"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 sm:px-6 py-1.5 sm:py-2.5 bg-white border-0 rounded-full text-[10px] sm:text-sm font-bold text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-vibrant-purple transition-all cursor-pointer"
          >
            <option value="all">{t('admin.jobs.filter.all')}</option>
            <option value="active">{t('admin.jobs.filter.active')}</option>
            <option value="inactive">{t('admin.jobs.filter.inactive')}</option>
            <option value="featured">{t('admin.jobs.filter.featured')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <GlassCard className="p-3 sm:p-6 bg-gradient-to-br from-white/40 to-blue-50/20">
          <div className="text-xl sm:text-3xl font-black text-gray-900 tracking-tighter">{jobs.length}</div>
          <div className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('admin.jobs.stats.total')}</div>
        </GlassCard>
        <GlassCard className="p-6 bg-gradient-to-br from-white/40 to-emerald-50/20">
          <div className="text-3xl font-black text-emerald-600 tracking-tighter">{jobs.filter(j => j.status === 'active').length}</div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('admin.jobs.stats.active')}</div>
        </GlassCard>
        <GlassCard className="p-6 bg-gradient-to-br from-white/40 to-amber-50/20">
          <div className="text-3xl font-black text-amber-500 tracking-tighter">{jobs.filter(j => j.featured).length}</div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('admin.jobs.stats.featured')}</div>
        </GlassCard>
      </div>

      {filteredJobs.length === 0 ? (
        <GlassCard className="text-center py-20">
          <Briefcase className="mx-auto text-gray-200 mb-4" size={80} />
          <p className="text-gray-400 font-bold uppercase tracking-widest">{t('admin.common.noResults')}</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredJobs.map((job, idx) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GlassCard className="p-4 sm:p-8 hover:shadow-2xl hover:shadow-purple-500/5 transition-all group overflow-visible">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                      <h3 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight group-hover:text-vibrant-purple transition-colors">{job.title}</h3>
                      {job.featured && (
                        <div className="bg-amber-100 text-amber-600 p-1.5 rounded-full shadow-sm animate-pulse">
                          <Star size={14} className="fill-current" />
                        </div>
                      )}
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                        job.status === 'active' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-gray-200 text-gray-400 bg-gray-50'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 font-medium leading-relaxed mb-6 max-w-3xl">{job.description?.substring(0, 150)}...</p>
                    
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm font-bold text-gray-500 bg-gray-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl ring-1 ring-gray-100">
                        <Briefcase size={14} className="sm:w-4 sm:h-4 text-blue-500" />
                        {job.job_type}
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm font-bold text-gray-500 bg-gray-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl ring-1 ring-gray-100">
                        <MapPin size={14} className="sm:w-4 sm:h-4 text-rose-500" />
                        {job.location_city}, {job.location_country}
                      </div>
                      <div className="flex items-center gap-3 sm:gap-6 ml-auto">
                        <div className="text-center">
                          <p className="text-sm sm:text-lg font-black text-gray-900 leading-none">{job.views_count || 0}</p>
                          <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Views</p>
                        </div>
                        <div className="h-6 sm:h-8 w-[1px] bg-gray-200" />
                        <div className="text-center">
                          <p className="text-sm sm:text-lg font-black text-gray-900 leading-none">{job.applications_count || 0}</p>
                          <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Apps</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100/50">
                  <Button
                    size="sm"
                    variant={job.featured ? 'outline' : 'primary'}
                    className={`rounded-full px-4 sm:px-8 text-[9px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                      job.featured 
                        ? 'border-amber-200 text-amber-600 hover:bg-amber-50' 
                        : 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20'
                    }`}
                    onClick={() => handleFeatureToggle(job.id, job.featured)}
                  >
                    <Star size={12} className={`mr-1 sm:mr-2 ${job.featured ? 'fill-current' : ''}`} />
                    {job.featured ? t('admin.common.unfeature') : t('admin.common.feature')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full px-4 sm:px-8 text-[9px] sm:text-xs font-black uppercase tracking-widest border-gray-200 hover:bg-gray-50"
                    onClick={() => handleStatusToggle(job.id, job.status)}
                  >
                    {job.status === 'active' ? t('admin.common.deactivate') : t('admin.common.activate')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full px-4 sm:px-8 text-[9px] sm:text-xs font-black uppercase tracking-widest border-gray-200 hover:bg-gray-50"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <Eye size={12} className="mr-1 sm:mr-2" />
                    {t('admin.common.view')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteConfirm(job.id)}
                    className="ml-auto rounded-full px-4 sm:px-8 text-[9px] sm:text-xs font-black uppercase tracking-widest border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={12} className="mr-1 sm:mr-2" />
                    {t('admin.common.delete')}
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          isOpen={!!deleteConfirm}
          title="Delete Job"
          message="Are you sure you want to delete this job? This action cannot be undone."
          onConfirm={() => handleDelete(deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

function MarketplaceAdminPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'sold' | 'flagged'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, [filter]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await marketplaceService.getItems({
        status: filter !== 'all' && filter !== 'flagged' ? filter : undefined
      });
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await marketplaceService.deleteItem(itemId);
      await adminService.logActivity('delete_marketplace_item', 'marketplace_items', itemId);
      loadItems();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert(t('admin.itemDeleteFailed'));
    }
  };

  const filteredItems = items.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location_city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-lg">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t('admin.marketplace.moderation')}</h2>
          <p className="text-sm text-gray-500 font-medium">{t('admin.dashboard.marketplaceSubtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-vibrant-purple transition-colors" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('admin.marketplace.search')}
              className="pl-12 pr-6 py-2.5 bg-white/60 focus:bg-white border-0 rounded-full text-sm font-bold text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-vibrant-purple transition-all w-full lg:w-64"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-6 py-2.5 bg-white border-0 rounded-full text-sm font-bold text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-vibrant-purple transition-all cursor-pointer"
          >
            <option value="all">{t('admin.marketplace.filter.all')}</option>
            <option value="active">{t('admin.marketplace.filter.active')}</option>
            <option value="sold">{t('admin.marketplace.filter.sold')}</option>
            <option value="flagged">{t('admin.marketplace.filter.flagged')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 bg-gradient-to-br from-white/40 to-blue-50/20">
          <div className="text-3xl font-black text-gray-900 tracking-tighter">{items.length}</div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('admin.marketplace.stats.total')}</div>
        </GlassCard>
        <GlassCard className="p-6 bg-gradient-to-br from-white/40 to-emerald-50/20">
          <div className="text-3xl font-black text-emerald-600 tracking-tighter">{items.filter(i => i.status === 'active').length}</div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('admin.marketplace.stats.active')}</div>
        </GlassCard>
        <GlassCard className="p-6 bg-gradient-to-br from-white/40 to-blue-50/20">
          <div className="text-3xl font-black text-blue-600 tracking-tighter">{items.filter(i => i.status === 'sold').length}</div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('admin.marketplace.stats.sold')}</div>
        </GlassCard>
      </div>

      {filteredItems.length === 0 ? (
        <GlassCard className="text-center py-20">
          <ShoppingBag className="mx-auto text-gray-200 mb-4" size={80} />
          <p className="text-gray-400 font-bold uppercase tracking-widest">{t('admin.common.noResults')}</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GlassCard className="p-6 hover:shadow-2xl hover:shadow-purple-500/5 transition-all group overflow-hidden">
                <div className="flex gap-6">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-inner">
                    {item.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingBag size={32} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                       <div>
                          <h3 className="text-lg font-black text-gray-900 tracking-tight group-hover:text-vibrant-purple transition-colors">{item.title}</h3>
                          <p className="text-xl font-black text-vibrant-purple tracking-tighter mt-1">
                            ${item.price} {item.negotiable && <span className="text-[10px] uppercase text-gray-400 font-black tracking-widest ml-1">(OBO)</span>}
                          </p>
                       </div>
                       <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        item.status === 'active' ? 'bg-emerald-500 text-white' :
                        item.status === 'sold' ? 'bg-blue-500 text-white' :
                        'bg-gray-400 text-white'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                       <span className="px-3 py-1 bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-widest rounded-lg border border-gray-100 flex items-center gap-1.5">
                          <MapPin size={12} className="text-rose-500" />
                          {item.location_city}
                       </span>
                       <span className="px-3 py-1 bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-widest rounded-lg border border-gray-100 flex items-center gap-1.5">
                          <Zap size={12} className="text-amber-500" />
                          {item.condition}
                       </span>
                       <span className="px-3 py-1 bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-widest rounded-lg border border-gray-100">
                          {item.category}
                       </span>
                    </div>

                    <div className="flex items-center gap-2 mt-6">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl px-4 text-[10px] font-black uppercase tracking-widest border-gray-200 hover:bg-gray-50"
                        onClick={() => navigate(`/marketplace/${item.id}`)}
                      >
                        <Eye size={14} className="mr-2" />
                        {t('admin.common.view')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteConfirm(item.id)}
                        className="rounded-xl px-4 text-[10px] font-black uppercase tracking-widest border-rose-100 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={14} className="mr-2" />
                        {t('admin.common.delete')}
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          isOpen={!!deleteConfirm}
          title="Delete Item"
          message="Are you sure you want to delete this marketplace item? This action is permanent."
          onConfirm={() => handleDelete(deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

function EventsAdminPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, [filter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventsService.getEvents({
        status: filter === 'all' ? undefined : filter === 'upcoming' ? 'published' : undefined
      });
      
      const now = new Date();
      let filtered = data;
      if (filter === 'upcoming') {
        filtered = data.filter(e => new Date(e.start_date || '') > now);
      } else if (filter === 'past') {
        filtered = data.filter(e => new Date(e.start_date || '') <= now);
      }
      setEvents(filtered);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = async (eventId: string, featured: boolean) => {
    try {
      await eventsService.updateEvent(eventId, { is_featured: !featured });
      await adminService.logActivity(featured ? 'unfeature_event' : 'feature_event', 'events', eventId);
      loadEvents();
    } catch (error) {
      console.error('Error toggling feature:', error);
      alert(t('admin.eventUpdateFailed'));
    }
  };

  const handleDelete = async (eventId: string) => {
    try {
      await eventsService.deleteEvent(eventId);
      await adminService.logActivity('delete_event', 'events', eventId);
      loadEvents();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(t('admin.eventDeleteFailed'));
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-lg">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t('admin.events.management')}</h2>
          <p className="text-sm text-gray-500 font-medium">{t('admin.dashboard.eventsSubtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.common.filter')}</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-6 py-2.5 bg-white border-0 rounded-full text-sm font-bold text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-vibrant-purple transition-all cursor-pointer shadow-sm"
          >
            <option value="all">{t('admin.events.all')}</option>
            <option value="upcoming">{t('admin.events.upcoming')}</option>
            <option value="past">{t('admin.events.past')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 bg-gradient-to-br from-white/40 to-blue-50/20">
          <div className="text-3xl font-black text-gray-900 tracking-tighter">{events.length}</div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('admin.events.all')}</div>
        </GlassCard>
        <GlassCard className="p-6 bg-gradient-to-br from-white/40 to-emerald-50/20">
          <div className="text-3xl font-black text-emerald-600 tracking-tighter">
            {events.filter(e => new Date(e.start_date || '') > new Date()).length}
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('admin.events.upcoming')}</div>
        </GlassCard>
        <GlassCard className="p-6 bg-gradient-to-br from-white/40 to-amber-50/20">
          <div className="text-3xl font-black text-amber-500 tracking-tighter">{events.filter(e => e.is_featured).length}</div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('admin.events.featured')}</div>
        </GlassCard>
      </div>

      {events.length === 0 ? (
        <GlassCard className="text-center py-20">
          <Calendar className="mx-auto text-gray-200 mb-4" size={80} />
          <p className="text-gray-400 font-bold uppercase tracking-widest">{t('admin.common.noResults')}</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {events.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GlassCard className="p-8 hover:shadow-2xl hover:shadow-purple-500/5 transition-all group overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="w-full lg:w-48 h-48 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-inner relative">
                    {event.image_urls?.[0] ? (
                      <img
                        src={event.image_urls[0]}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Calendar size={48} />
                      </div>
                    )}
                    {event.is_featured && (
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md p-2 rounded-xl text-amber-500 shadow-xl border border-amber-100 animate-bounce-subtle">
                        <Star size={20} className="fill-current" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-vibrant-purple transition-colors">{event.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                           <span className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                              <Calendar size={14} className="text-vibrant-purple" />
                              {event.start_date ? new Date(event.start_date).toLocaleDateString() : '-'}
                           </span>
                           <span className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                              <MapPin size={14} className="text-blue-500" />
                              {event.location_city}
                           </span>
                           <span className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                              <Users size={14} className="text-emerald-500" />
                              {event.attendee_count || 0} {t('admin.events.rsvps')}
                           </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 font-medium leading-relaxed mb-8 max-w-3xl italic">
                      "{event.description?.substring(0, 180)}..."
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        size="lg"
                        variant={event.is_featured ? 'outline' : 'primary'}
                        className={`rounded-full px-8 text-[10px] font-black uppercase tracking-widest transition-all ${
                          event.is_featured 
                            ? 'border-amber-200 text-amber-600 hover:bg-amber-50' 
                            : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                        }`}
                        onClick={() => handleFeatureToggle(event.id, !!event.is_featured)}
                      >
                        <Star size={16} className={`mr-2 ${event.is_featured ? 'fill-current' : ''}`} />
                        {event.is_featured ? t('admin.common.unfeature') : t('admin.common.feature')}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-full px-8 text-[10px] font-black uppercase tracking-widest border-gray-200 hover:bg-gray-50"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        <Eye size={18} className="mr-2" />
                        {t('admin.common.view')}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setDeleteConfirm(event.id)}
                        className="rounded-full px-8 text-[10px] font-black uppercase tracking-widest border-rose-100 text-rose-600 hover:bg-rose-50 ml-auto"
                      >
                        <Trash2 size={18} className="mr-2" />
                        {t('admin.common.delete')}
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          isOpen={!!deleteConfirm}
          title="Delete Event"
          message="Are you sure you want to permanently delete this event? This cannot be undone."
          onConfirm={() => handleDelete(deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

function UsersAdminPanel() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    variant: 'danger' | 'warning' | 'info';
    confirmText: string;
  } | null>(null);

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { users: data, total: count } = await adminService.getAllUsers(50, page * 50);
      setUsers(data);
      setTotal(count);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadUsers();
      return;
    }
    try {
      setLoading(true);
      const data = await adminService.searchUsers(searchTerm);
      setUsers(data);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleUserAction = (userId: string, action: string, userName: string) => {
    const actionConfig = {
      ban: {
        title: t('admin.users.confirm.banTitle'),
        message: t('admin.users.confirm.banMessage', { userName }),
        variant: 'warning' as const,
        confirmText: t('admin.users.ban')
      },
      unban: {
        title: t('admin.users.confirm.unbanTitle'),
        message: t('admin.users.confirm.unbanMessage', { userName }),
        variant: 'info' as const,
        confirmText: t('admin.users.unban')
      },
      delete: {
        title: t('admin.users.confirm.deleteTitle'),
        message: t('admin.users.confirm.deleteMessage', { userName }),
        variant: 'danger' as const,
        confirmText: t('admin.common.delete')
      }
    };

    const config = actionConfig[action as keyof typeof actionConfig];
    if (!config) return;

    const performAction = async () => {
      // Additional confirmation for delete
      if (action === 'delete') {
        const confirmation = prompt(`Type "DELETE" to confirm permanent deletion of ${userName}'s account:`);
        if (confirmation !== 'DELETE') {
          alert(t('admin.deletionCancelled'));
          return;
        }
      }

      try {
        setActionLoading(`${action}-${userId}`);

        if (action === 'ban') {
          await adminService.updateUserStatus(userId, true);
        } else if (action === 'unban') {
          await adminService.updateUserStatus(userId, false);
        } else if (action === 'delete') {
          await adminService.deleteUser(userId);
        }

        // Log the action (already handled in the service methods above)
        alert(`${action.charAt(0).toUpperCase() + action.slice(1)} action completed successfully`);
        await loadUsers();
      } catch (error) {
        console.error(`Error ${action}ing user:`, error);
        alert(`Failed to ${action} user`);
      } finally {
        setActionLoading(null);
      }
    };

    setConfirmDialog({
      isOpen: true,
      title: config.title,
      message: config.message,
      action: performAction,
      variant: config.variant,
      confirmText: config.confirmText
    });
  };

  if (loading) return <Loading />;

  return (

    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-lg">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t('admin.users.title')}</h2>
          <p className="text-sm text-gray-500 font-medium">{t('admin.dashboard.userManagementSubtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-white/60 backdrop-blur-md rounded-full ring-1 ring-gray-200 p-1 group-focus-within:ring-2 group-focus-within:ring-vibrant-purple transition-all">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('admin.users.searchPlaceholder')}
              className="pl-6 pr-4 py-1.5 bg-transparent border-0 text-sm font-bold text-gray-700 focus:outline-none w-full lg:w-64"
            />
            <Button size="sm" onClick={handleSearch} className="rounded-full px-6 bg-vibrant-purple hover:bg-vibrant-pink text-white shadow-lg shadow-purple-500/20 transition-all">
              <Search size={16} className="mr-2" />
              {t('common.search')}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 bg-gradient-to-br from-white/40 to-blue-50/20">
          <div className="text-3xl font-black text-gray-900 tracking-tighter">{total}</div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('admin.users.totalUsers')}</div>
        </GlassCard>
        <GlassCard className="p-6 bg-gradient-to-br from-white/40 to-emerald-50/20">
          <div className="text-3xl font-black text-emerald-600 tracking-tighter">{users.filter(u => !u.is_banned).length}</div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('admin.users.activeUsers')}</div>
        </GlassCard>
        <GlassCard className="p-6 bg-gradient-to-br from-white/40 to-rose-50/20">
          <div className="text-3xl font-black text-rose-500 tracking-tighter">{users.filter(u => u.is_banned).length}</div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('admin.users.bannedUsers')}</div>
        </GlassCard>
      </div>

      {users.length === 0 ? (
        <GlassCard className="text-center py-20">
          <Users className="mx-auto text-gray-200 mb-4" size={80} />
          <p className="text-gray-400 font-bold uppercase tracking-widest">{t('admin.common.noResults')}</p>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden border-white/40">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === users.length && users.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded-lg border-gray-300 text-vibrant-purple focus:ring-vibrant-purple h-5 w-5 transition-all cursor-pointer"
                    />
                  </th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.users.columns.user')}</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.users.columns.email')}</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.users.columns.joined')}</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.users.columns.status')}</th>
                  <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.users.columns.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user, idx) => (
                  <motion.tr 
                    key={user.id} 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="group hover:bg-white/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                        className="rounded-lg border-gray-300 text-vibrant-purple focus:ring-vibrant-purple h-5 w-5 transition-all cursor-pointer"
                      />
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-md shadow-purple-500/5" />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 border-2 border-white shadow-md">
                              <Users size={22} />
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${user.is_banned ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        </div>
                        <div>
                          <div className="font-black text-gray-900 tracking-tight group-hover:text-vibrant-purple transition-colors">{user.full_name || 'Anonymous User'}</div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{user.role || 'Platform User'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-gray-600">{user.user?.email || 'N/A'}</td>
                    <td className="px-8 py-5 text-sm font-bold text-gray-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                     <td className="px-8 py-5">
                       <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                         user.is_banned ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                       }`}>
                         {user.is_banned ? t('admin.users.status.banned') : t('admin.users.status.active')}
                       </span>
                     </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction(user.id, user.is_banned ? 'unban' : 'ban', user.full_name || user.user?.email || 'User')}
                          disabled={actionLoading === `ban-${user.id}` || actionLoading === `unban-${user.id}`}
                          className={`rounded-xl px-4 text-[10px] font-black uppercase tracking-widest border-2 ${
                            user.is_banned ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                           {actionLoading === `ban-${user.id}` || actionLoading === `unban-${user.id}` ? (
                             <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                           ) : (
                             user.is_banned ? t('admin.users.unban') : t('admin.users.ban')
                           )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction(user.id, 'delete', user.full_name || user.user?.email || 'User')}
                          disabled={actionLoading === `delete-${user.id}`}
                          className="rounded-xl p-2.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          {actionLoading === `delete-${user.id}` ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="rounded-full px-8 text-[10px] font-black uppercase tracking-widest bg-white/60 backdrop-blur-sm border-white/60 hover:bg-white transition-all disabled:opacity-50"
        >
          {t('common.previous')}
        </Button>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white/40 backdrop-blur-sm px-6 py-2 rounded-full border border-white/60">
           {t('admin.users.page')} {page + 1} / {Math.ceil(total / 50)}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage(page + 1)}
          disabled={(page + 1) * 50 >= total}
          className="rounded-full px-8 text-[10px] font-black uppercase tracking-widest bg-white/60 backdrop-blur-sm border-white/60 hover:bg-white transition-all disabled:opacity-50"
        >
           {t('common.next')}
        </Button>
      </div>

      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.action}
          onClose={() => setConfirmDialog(null)}
          variant={confirmDialog.variant}
          confirmText={confirmDialog.confirmText}
        />
      )}
    </div>
  );
}

function AnalyticsPanel() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      console.log('Loading analytics stats...');
      const data = await adminService.getAdminStats();
      console.log('Analytics stats loaded:', data);
      setStats(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (!stats) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
       <div className="bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-lg mb-8">
         <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t('admin.analytics.title')}</h2>
         <p className="text-sm text-gray-500 font-medium">{t('admin.dashboard.analyticsDescription')}</p>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-8 bg-gradient-to-br from-indigo-600 to-vibrant-purple text-white border-0 shadow-2xl shadow-indigo-500/20 group">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
              <Users size={32} />
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
              <TrendingUp size={14} />
              +12%
            </div>
          </div>
          <div className="text-4xl font-black mb-1 tracking-tighter">{stats.totalUsers.toLocaleString()}</div>
          <div className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">{t('admin.totalUsers')}</div>
        </GlassCard>

        <GlassCard className="p-8 bg-gradient-to-br from-emerald-600 to-teal-500 text-white border-0 shadow-2xl shadow-emerald-500/20 group">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
              <Briefcase size={32} />
            </div>
             <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
              <TrendingUp size={14} />
              +5%
            </div>
          </div>
          <div className="text-4xl font-black mb-1 tracking-tighter">{stats.totalJobs.toLocaleString()}</div>
          <div className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">{t('admin.totalJobs')}</div>
        </GlassCard>

        <GlassCard className="p-8 bg-gradient-to-br from-orange-500 to-rose-500 text-white border-0 shadow-2xl shadow-orange-500/20 group">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
              <ShoppingBag size={32} />
            </div>
             <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
              <TrendingUp size={14} />
              +8%
            </div>
          </div>
          <div className="text-4xl font-black mb-1 tracking-tighter">{stats.totalMarketplaceItems.toLocaleString()}</div>
          <div className="text-[10px] font-black text-orange-100 uppercase tracking-widest">{t('admin.marketplaceItems')}</div>
        </GlassCard>

        <GlassCard className="p-8 bg-gradient-to-br from-blue-600 to-vibrant-purple text-white border-0 shadow-2xl shadow-blue-500/20 group">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
              <Calendar size={32} />
            </div>
             <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
              <TrendingUp size={14} />
              +15%
            </div>
          </div>
          <div className="text-4xl font-black mb-1 tracking-tighter">{stats.totalEvents.toLocaleString()}</div>
          <div className="text-[10px] font-black text-blue-100 uppercase tracking-widest">{t('admin.totalEvents')}</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t('admin.analytics.pendingReviews')}</h3>
             <Zap className="text-amber-500" size={24} />
          </div>
          <div className="space-y-6">
            <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between group hover:shadow-lg transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                  <Briefcase size={24} />
                </div>
                 <div>
                   <div className="font-black text-gray-900 tracking-tight">{t('admin.pendingJobApplications')}</div>
                   <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.dashboard.awaitingAssessment')}</div>
                 </div>
              </div>
              <span className="text-3xl font-black text-emerald-600 tracking-tighter">{stats.pendingJobApplications}</span>
            </div>

            <div className="p-6 bg-vibrant-purple/5 rounded-2xl border border-purple-100 flex items-center justify-between group hover:shadow-lg transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-vibrant-purple/10 rounded-xl text-vibrant-purple">
                  <GraduationCap size={24} />
                </div>
                 <div>
                   <div className="font-black text-gray-900 tracking-tight">{t('admin.pendingEducationInterests')}</div>
                   <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.dashboard.needsVerification')}</div>
                 </div>
              </div>
              <span className="text-3xl font-black text-vibrant-purple tracking-tighter">{stats.pendingEducationInterests}</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-8">
           <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t('admin.analytics.platformActivity')}</h3>
             <Activity className="text-blue-500" size={24} />
          </div>
          <div className="space-y-6">
            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                  <MessageSquare size={24} />
                </div>
                 <div>
                   <div className="font-black text-gray-900 tracking-tight">{t('admin.activeConversations')}</div>
                   <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.dashboard.liveChatInteractions')}</div>
                 </div>
              </div>
              <span className="text-3xl font-black text-blue-600 tracking-tighter">{stats.activeConversations}</span>
            </div>

             <div className="p-6 bg-teal-50/50 rounded-2xl border border-teal-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-100 rounded-xl text-teal-600">
                  <GraduationCap size={24} />
                </div>
                 <div>
                   <div className="font-black text-gray-900 tracking-tight">{t('admin.educationPrograms')}</div>
                   <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.dashboard.activeLearningModules')}</div>
                 </div>
              </div>
              <span className="text-3xl font-black text-teal-600 tracking-tighter">{stats.totalEducationPrograms}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-8 bg-gradient-to-tr from-white/40 to-blue-50/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-white rounded-[1.5rem] shadow-xl shadow-blue-500/10 text-blue-600">
              <Download size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t('admin.analytics.exportData')}</h3>
              <p className="text-sm text-gray-500 font-medium">{t('admin.analytics.exportDesc')}</p>
            </div>
          </div>
          <Button 
            className="rounded-full px-10 py-4 font-black uppercase tracking-widest bg-vibrant-purple hover:bg-vibrant-pink text-white shadow-2xl shadow-purple-500/20 transition-all text-xs"
            disabled
          >
            <Download size={18} className="mr-3" />
            {t('admin.analytics.exportCsv')}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}


function VisaAdminPanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [_updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [documents, setDocuments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    if (selectedApplication) {
      loadDocuments(selectedApplication.id);
      loadHistory(selectedApplication.id);
    } else {
      setDocuments([]);
      setHistory([]);
    }
  }, [selectedApplication]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await visaService.getAllApplications();
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading visa applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (appId: string) => {
    try {
      setDocsLoading(true);
      const docs = await visaService.getDocuments(appId);
      setDocuments(docs || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setDocsLoading(false);
    }
  };

  const loadHistory = async (appId: string) => {
    try {
      const hist = await visaService.getApplicationHistory(appId);
      setHistory(hist || []);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500 text-white';
      case 'rejected': return 'bg-rose-500 text-white';
      case 'in_review':
      case 'under_review':
      case 'documents_requested': return 'bg-amber-500 text-white';
      case 'submitted': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string, notes?: string) => {
    const statusLabel = t(`admin.visa.status.${newStatus}`, { defaultValue: newStatus.replace('_', ' ') });
    const confirmMessage = newStatus === 'in_review' 
      ? t('admin.visa.actions.acknowledge') 
      : t('admin.visa.confirmStatus', { status: statusLabel });
    
    if (!confirm(confirmMessage)) return;

    try {
      setUpdating(applicationId);
      
      const { error } = await supabase
        .from('visa_applications')
        .update({
          status: newStatus,
          admin_notes: notes || '',
          reviewed_by: user?.id || 'admin',
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      await adminService.logActivity(
        'visa_status_updated',
        'visa_applications',
        applicationId,
        { new_status: newStatus, notes }
      );

      await loadApplications();
      alert(t('common.success'));
    } catch (error) {
      console.error('Error updating status:', error);
      alert(t('common.error'));
    } finally {
      setUpdating(null);
    }
  };

  const handleInitiateConversation = async (application: any) => {
     try {
       if (application.conversation_id) {
         window.location.href = `/messages?conversation=${application.conversation_id}`;
         return;
       }
 
       const { data: conversation, error: convError } = await supabase
         .from('conversations')
         .insert({
           context_type: 'visa',
           context_id: application.id,
           created_by: user?.id
         })
         .select()
         .single();
 
       if (convError) throw convError;
 
       await supabase
         .from('visa_applications')
         .update({ conversation_id: conversation.id })
         .eq('id', application.id);
 
       await supabase
         .from('messages')
         .insert({
           conversation_id: conversation.id,
           sender_id: user?.id,
           content: t('admin.visa.initialMessage', { 
             name: application.profiles?.full_name || t('admin.common.applicant'),
             type: application.visa_type 
           }),
           message_type: 'admin'
         });
 
       window.location.href = `/messages?conversation=${conversation.id}`;
     } catch (error) {
       console.error('Error initiating conversation:', error);
       alert(t('admin.common.failedToStartChat'));
     }
  };



  if (loading) return <Loading />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-lg">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t('admin.visa.title')}</h2>
          <p className="text-sm text-gray-500 font-medium">{t('admin.visa.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.common.filter')}</span>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-6 py-2.5 bg-white border-0 rounded-full text-sm font-bold text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-vibrant-purple transition-all cursor-pointer shadow-sm"
          >
            <option value="all">{t('admin.visa.filter.all')}</option>
            <option value="submitted">{t('admin.visa.filter.submitted')}</option>
            <option value="in_review">{t('admin.visa.filter.inReview')}</option>
            <option value="approved">{t('admin.visa.filter.approved')}</option>
            <option value="rejected">{t('admin.visa.filter.rejected')}</option>
          </select>
        </div>
      </div>

      {applications.length === 0 ? (
        <GlassCard className="text-center py-20">
          <FileText className="mx-auto text-gray-200 mb-4" size={80} />
          <p className="text-gray-400 font-bold uppercase tracking-widest">{t('admin.visa.noApplications')}</p>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden border-white/40">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.visa.columns.applicant')}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.visa.columns.type')}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.visa.columns.status')}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.visa.columns.submitted')}</th>
                  <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.visa.columns.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {applications.map((app, idx) => (
                  <motion.tr 
                    key={app.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group hover:bg-white/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold shadow-sm">
                           {(app.profiles?.full_name || app.full_name || '?')[0]}
                        </div>
                        <div>
                          <div className="font-black text-gray-900 tracking-tight group-hover:text-vibrant-purple transition-colors">{app.profiles?.full_name || app.full_name || t('admin.visa.common.unknown')}</div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{app.profiles?.email || t('admin.visa.common.noEmail')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                        {app.visa_type?.toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(app.status)}`}>
                        {t(`admin.visa.status.${app.status}`, { defaultValue: app.status?.replace('_', ' ') })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-400">
                      {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : t('admin.visa.common.notSubmitted')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedApplication(app);
                            setShowDetails(true);
                          }}
                          className="rounded-xl p-2.5 text-blue-600 border-blue-100 hover:bg-blue-50"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInitiateConversation(app)}
                          className="rounded-xl p-2.5 text-emerald-600 border-emerald-100 hover:bg-emerald-50"
                        >
                          <MessageSquare size={16} />
                        </Button>
                        
                        {/* Mark as Received Button - Maps to in_review status */}
                        {app.status === 'submitted' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(app.id, 'in_review')}
                            className="rounded-xl px-4 text-[10px] font-black uppercase tracking-widest border-amber-200 text-amber-600 hover:bg-amber-50"
                          >
                            <CheckCircle size={14} className="mr-2" />
                            {t('admin.visa.actions.acknowledge')}
                          </Button>
                        )}

                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleStatusUpdate(app.id, e.target.value);
                              e.target.value = ""; // Reset
                            }
                          }}
                          className="text-[10px] font-black uppercase tracking-widest px-4 py-2 border-2 border-gray-100 rounded-xl bg-white focus:border-vibrant-purple outline-none transition-all cursor-pointer"
                        >
                          <option value="">{t('admin.users.columns.actions')}</option>
                          <option value="in_review">{t('admin.visa.filter.inReview')}</option>
                          <option value="documents_requested">{t('admin.visa.actions.requestDocs')}</option>
                          <option value="approved">{t('admin.visa.actions.approve')}</option>
                          <option value="rejected">{t('admin.visa.actions.reject')}</option>
                        </select>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

       {showDetails && selectedApplication && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
             <button
                onClick={() => setShowDetails(false)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
              <div className="pt-8">
                 <VisaApplicationDetailView
                    application={selectedApplication}
                    documents={documents}
                    history={history}
                    onBack={() => setShowDetails(false)}
                    onNavigateToUpload={() => {}}
                    onNavigateToMessages={() => {
                       setShowDetails(false);
                       handleInitiateConversation(selectedApplication);
                    }}
                 />
              </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityLogPanel() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getActivityLogs();
      setLogs(data);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-lg">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t('admin.activityLog')}</h2>
          <p className="text-sm text-gray-500 font-medium">{t('admin.activityLogSubtitle')}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={loadLogs}
          className="rounded-full px-8 text-[10px] font-black uppercase tracking-widest bg-white/60 backdrop-blur-sm border-white/60 hover:bg-white transition-all shadow-sm"
        >
          <Activity size={16} className="mr-2" />
          {t('admin.activityLogRefresh')}
        </Button>
      </div>

      {logs.length === 0 ? (
        <GlassCard className="text-center py-20">
          <Activity className="mx-auto text-gray-200 mb-4" size={80} />
          <p className="text-gray-400 font-bold uppercase tracking-widest">{t('admin.common.noResults')}</p>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden border-white/40">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.admin')}</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.actions')}</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.resource')}</th>
                  <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.time')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log, idx) => (
                  <motion.tr 
                    key={log.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.01 }}
                    className="hover:bg-white/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                           {(log.admin?.profiles?.full_name || log.admin?.email || 'S')[0]}
                        </div>
                        <span className="font-bold text-gray-900 text-sm">
                          {log.admin?.profiles?.full_name || log.admin?.email || 'System'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200">
                         {log.action.replace(/_/g, ' ')}
                       </span>
                    </td>
                    <td className="px-8 py-5">
                       <span className="flex items-center gap-2 text-sm font-bold text-gray-500">
                          <Rocket size={14} className="text-vibrant-purple" />
                          {log.resource_type || '-'}
                       </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                         {new Date(log.created_at).toLocaleString()}
                       </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
function MessagesAdminPanel() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'replied'>('all');

  useEffect(() => {
    loadMessages();
  }, [filter]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await adminService.getContactSubmissions(
        filter !== 'all' ? filter : undefined
      );
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: 'new' | 'read' | 'replied') => {
    try {
      await adminService.updateContactSubmissionStatus(id, newStatus);
      loadMessages();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(t('admin.updateFailed'));
    }
  };

  const handleReply = (email: string, subject: string) => {
    window.location.href = `mailto:${email}?subject=Re: ${subject}`;
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-lg">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t('admin.messages.title')}</h2>
          <p className="text-sm text-gray-500 font-medium">{t('admin.messages.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.common.filter')}</span>
           <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-6 py-2.5 bg-white border-0 rounded-full text-sm font-bold text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-vibrant-purple transition-all cursor-pointer shadow-sm"
          >
            <option value="all">{t('admin.messages.filter.all')}</option>
            <option value="new">{t('admin.messages.filter.new')}</option>
            <option value="read">{t('admin.messages.filter.read')}</option>
            <option value="replied">{t('admin.messages.filter.replied')}</option>
          </select>
        </div>
      </div>

      {messages.length === 0 ? (
        <GlassCard className="text-center py-20">
          <MessageSquare className="mx-auto text-gray-200 mb-4" size={80} />
          <p className="text-gray-400 font-bold uppercase tracking-widest">{t('admin.common.noResults')}</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GlassCard className={`p-8 hover:shadow-2xl transition-all group ${msg.status === 'new' ? 'border-vibrant-purple/30 bg-vibrant-purple/[0.02]' : ''}`}>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 shadow-sm font-black italic">
                         {msg.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-black text-gray-900 tracking-tight group-hover:text-vibrant-purple transition-colors">{msg.name}</h3>
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                            msg.status === 'new' ? 'bg-vibrant-purple text-white animate-pulse' :
                            msg.status === 'replied' ? 'bg-emerald-500 text-white' :
                            'bg-gray-400 text-white'
                          }`}>
                            {msg.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <a href={`mailto:${msg.email}`} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-vibrant-pink transition-colors">{msg.email}</a>
                          <span className="text-gray-300">•</span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(msg.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100/50 text-gray-700 font-medium leading-relaxed italic relative">
                       <span className="absolute -top-3 left-6 px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.messages.contentLabel')}</span>
                       "{msg.message}"
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 min-w-[180px]">
                    <Button
                      size="lg"
                      className="rounded-full px-6 text-[10px] font-black uppercase tracking-widest bg-vibrant-purple hover:bg-vibrant-pink text-white shadow-lg shadow-purple-500/20"
                      onClick={() => handleReply(msg.email, t('admin.messages.subject'))}
                    >
                      <Mail size={16} className="mr-2" />
                      {t('admin.messages.reply')}
                    </Button>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.status === 'new' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full px-6 text-[10px] font-black uppercase tracking-widest border-gray-200 hover:bg-gray-50"
                          onClick={() => handleStatusUpdate(msg.id, 'read')}
                        >
                          {t('admin.messages.markRead')}
                        </Button>
                      )}
                      {msg.status !== 'replied' && (
                         <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full px-6 text-[10px] font-black uppercase tracking-widest border-gray-200 hover:bg-gray-50"
                          onClick={() => handleStatusUpdate(msg.id, 'replied')}
                        >
                          {t('admin.messages.markReplied')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentsAdminPanel() {
  const { t } = useTranslation();
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    try {
      setLoading(true);
      const data = await adminService.getRedemptionCodes();
      setCodes(data);
    } catch (error) {
      console.error('Error loading codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      setGenerating(true);
      await adminService.generateRedemptionCode({ max_uses: 1 });
      await loadCodes();
    } catch (error) {
      console.error('Error generating code:', error);
      alert(t('admin.codeGenerationFailed'));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(t('admin.payments.copied'));
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm(t('admin.common.confirm'))) return;
    try {
      await adminService.deleteRedemptionCode(id);
      loadCodes();
    } catch (error) {
      console.error('Error deleting code:', error);
      alert(t('admin.codeDeleteFailed'));
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-lg">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t('admin.payments.title')}</h2>
          <p className="text-sm text-gray-500 font-medium">{t('admin.payments.subtitle')}</p>
        </div>
        <Button 
          onClick={handleGenerateCode} 
          disabled={generating}
          className="rounded-full px-8 py-4 font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-500/20 transition-all text-xs"
        >
          <Plus size={20} className="mr-2" />
          {generating ? t('admin.payments.generating') : t('admin.payments.generate')}
        </Button>
      </div>

      <GlassCard className="overflow-hidden border-white/40">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.payments.code')}</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.status')}</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.payments.redeemedBy')}</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.payments.createdAt')}</th>
                <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <CreditCard className="mx-auto text-gray-200 mb-4" size={64} />
                    <p className="text-gray-400 font-bold uppercase tracking-widest">{t('admin.payments.noCodes')}</p>
                  </td>
                </tr>
              ) : (
                codes.map((code, idx) => (
                  <motion.tr 
                    key={code.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="group hover:bg-white/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
                           <span className="font-mono font-black text-lg text-blue-600 tracking-tighter">{code.code}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCode(code.code)}
                          className="rounded-xl p-2.5 text-gray-400 border-gray-100 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all"
                          title="Copy Code"
                        >
                          <Copy size={16} />
                        </Button>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        code.redeemed_at ? 'bg-gray-400 text-white' : 'bg-emerald-500 text-white'
                      }`}>
                        {code.redeemed_at ? t('admin.common.inactive') : t('admin.common.active')}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-gray-600">
                      {code.redeemed_by_user ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                             <UserCheck size={16} />
                          </div>
                          <div>
                            <div className="font-black text-gray-900 tracking-tight">{code.redeemed_by_user.full_name}</div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(code.redeemed_at).toLocaleString()}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-300 italic font-medium">{t('admin.payments.pendingRedemption')}</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {new Date(code.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCode(code.id)}
                        className="rounded-xl p-2.5 text-rose-600 border-rose-100 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}


function AuPairAdminPanel() {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<'au_pair' | 'host_family'>('au_pair');
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, [type]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const tableName = type === 'au_pair' ? 'au_pair_profiles' : 'host_family_profiles';
      const { data, error } = await supabase
        .from(tableName)
        .select(`
          *,
          user:user_id (
            email,
            raw_user_meta_data
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-lg">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t('admin.auPairManagement')}</h2>
          <p className="text-sm text-gray-500 font-medium">{t('admin.auPair.managementSubtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.auPair.profileType')}</span>
           <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="px-6 py-2.5 bg-white border-0 rounded-full text-sm font-bold text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-vibrant-purple transition-all cursor-pointer shadow-sm"
          >
            <option value="au_pair">{t('admin.auPair.auPairs')}</option>
            <option value="host_family">{t('admin.auPair.hostFamilies')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {profiles.length === 0 ? (
          <GlassCard className="col-span-full text-center py-20">
            <UserCheck className="mx-auto text-gray-200 mb-4" size={80} />
            <p className="text-gray-400 font-bold uppercase tracking-widest">{t('common.noResults')}</p>
          </GlassCard>
        ) : (
          profiles.map((profile, idx) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GlassCard className="overflow-hidden border-white/40 group hover:shadow-2xl hover:shadow-purple-500/10 transition-all">
                <div className="relative h-56 bg-gray-50 overflow-hidden">
                  {profile.profile_photos?.[0] || profile.family_photos?.[0] ? (
                     <img 
                       src={profile.profile_photos?.[0] || profile.family_photos?.[0]} 
                       alt={profile.display_name || profile.family_name}
                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                     />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <Users className="text-gray-200" size={64} />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                     <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md border ${
                        profile.profile_status === 'active' 
                        ? 'bg-emerald-500/90 text-white border-emerald-400/50' 
                        : 'bg-white/90 text-gray-600 border-white/60'
                     }`}>
                        {profile.profile_status || t('admin.common.unknown')}
                     </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                     <p className="text-white text-xs font-medium leading-relaxed italic line-clamp-2">
                        {profile.about_me || profile.family_description || t('admin.auPair.noDescription')}
                     </p>
                  </div>
                </div>
                
                <div className="p-6">
                   <h3 className="text-xl font-black text-gray-900 tracking-tight mb-1 group-hover:text-vibrant-purple transition-colors">
                     {profile.display_name || profile.family_name || 'Unknown User'}
                   </h3>
                   <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                      <MapPin size={12} className="text-rose-500" />
                      {type === 'au_pair' 
                        ? `${profile.current_city || '-'}, ${profile.current_country || '-'}`
                        : `${profile.city || '-'}, ${profile.country || '-'}`
                      }
                   </div>
                   
                   <div className="flex flex-wrap gap-2 mb-6">
                      {type === 'au_pair' && profile.skills?.slice(0, 3).map((skill: string) => (
                         <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">{skill}</span>
                      ))}
                      {type === 'host_family' && (
                         <>
                           <span className="px-3 py-1 bg-purple-50 text-vibrant-purple rounded-lg text-[10px] font-black uppercase tracking-widest border border-purple-100">
                             {profile.children_count || 0} {t('admin.auPair.children')}
                           </span>
                           <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-orange-100">
                             {profile.home_type || 'Home'}
                           </span>
                         </>
                      )}
                   </div>

                   <div className="flex items-center justify-between pt-6 border-t border-gray-100/50">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{t('admin.common.contact')}</span>
                        <span className="text-xs font-bold text-gray-500 truncate max-w-[120px]">
                           {profile.user?.email}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProfile(profile);
                          setShowDetails(true);
                        }}
                        className="rounded-full px-6 text-[10px] font-black uppercase tracking-widest bg-vibrant-purple/5 border-vibrant-purple/10 text-vibrant-purple hover:bg-vibrant-purple hover:text-white transition-all shadow-sm"
                      >
                        {t('admin.viewDetails')}
                      </Button>
                   </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </div>
      
       {showDetails && selectedProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative"
          >
            <div className="absolute top-6 right-6 z-10">
              <button
                onClick={() => setShowDetails(false)}
                className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shadow-lg"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto h-full p-8 lg:p-12">
               <div className="flex flex-col lg:flex-row gap-12">
                  <div className="w-full lg:w-1/3">
                    <div className="rounded-[2rem] overflow-hidden shadow-2xl shadow-purple-500/10 mb-8 border-4 border-white">
                       <img 
                          src={selectedProfile.profile_photos?.[0] || selectedProfile.family_photos?.[0] || 'https://via.placeholder.com/400'} 
                          alt="Profile"
                          className="w-full aspect-square object-cover"
                       />
                    </div>
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Profile Status</h4>
                       <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${selectedProfile.profile_status === 'active' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`} />
                          <span className="font-black text-gray-900 uppercase tracking-tight">{selectedProfile.profile_status}</span>
                       </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">{selectedProfile.display_name || selectedProfile.family_name}</h2>
                    <p className="text-vibrant-purple font-bold flex items-center gap-2 mb-8">
                       <Mail size={18} />
                       {selectedProfile.user?.email}
                    </p>

                    <div className="grid grid-cols-2 gap-8 mb-12">
                       <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Created At</span>
                          <span className="font-bold text-gray-900">{new Date(selectedProfile.created_at).toLocaleDateString()}</span>
                       </div>
                       <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">User ID</span>
                          <span className="font-bold text-gray-900 text-xs truncate block">{selectedProfile.user_id}</span>
                       </div>
                    </div>

                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Raw Metadata</h4>
                    <pre className="bg-gray-900 text-purple-300 p-8 rounded-[2rem] overflow-auto max-h-96 text-xs font-mono shadow-inner">
                      {JSON.stringify(selectedProfile, null, 2)}
                    </pre>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function SettingsPanel() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const data = await adminService.getAllAdminUsers();
      setAdmins(data);
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  };

  const handleRevoke = async (roleId: string) => {
    if (!confirm(t('admin.common.confirm'))) return;
    try {
      setLoading(true);
      await adminService.revokeRole(roleId);
      setMessage({ type: 'success', text: t('admin.settings.revokeSuccess') });
      loadAdmins();
    } catch (error) {
      console.error('Error revoking admin:', error);
      setMessage({ type: 'error', text: t('admin.settings.revokeError') });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User email not found');

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: t('admin.settings.emailSent') });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setMessage({ type: 'error', text: t('admin.settings.resetEmailError') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-lg">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t('admin.settings.title')}</h2>
          <p className="text-sm text-gray-500 font-medium">{t('admin.settings.security')}</p>
        </div>
      </div>

      <GlassCard className="p-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-vibrant-purple text-white shadow-lg shadow-purple-500/20">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">{t('admin.settings.passwordReset')}</h3>
              <p className="text-sm text-gray-500 font-medium">{t('admin.settings.passwordResetDesc')}</p>
            </div>
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl text-sm font-bold ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
              }`}
            >
              {message.text}
            </motion.div>
          )}

          <div className="border-t border-gray-100 pt-8 mt-8">
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">{t('admin.settings.adminManagement')}</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">{t('admin.settings.adminManagementDesc')}</p>
            
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-6">
              <h4 className="text-sm font-black text-gray-700 uppercase tracking-widest mb-4">{t('admin.settings.inviteAdmin')}</h4>
              <div className="flex gap-3">
                <input 
                  type="email" 
                  placeholder={t('admin.settings.enterEmail')}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-vibrant-purple transition-all outline-none"
                  id="new-admin-email"
                />
                <Button
                  onClick={async () => {
                    const input = document.getElementById('new-admin-email') as HTMLInputElement;
                    const email = input.value;
                    if (!email) return;

                    try {
                      setLoading(true);
                      const results = await adminService.searchUsers(email);
                      const foundUser = results.find((u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase());
                      
                      if (!foundUser) {
                        setMessage({ type: 'error', text: t('admin.settings.userNotFound') });
                        return;
                      }

                      await adminService.grantRole(foundUser.id, 'admin', ['all']);
                      setMessage({ type: 'success', text: t('admin.settings.adminGranted') });
                      input.value = '';
                      loadAdmins();
                    } catch (err) {
                      console.error(err);
                      setMessage({ type: 'error', text: t('admin.settings.grantFailed') });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="rounded-xl px-6 font-bold bg-gray-900 text-white hover:bg-black"
                >
                  <Plus size={18} className="mr-2" />
                  {t('admin.add')}
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                  <h4 className="text-sm font-black text-gray-700 uppercase tracking-widest">{t('admin.settings.currentAdmins')}</h4>
                  <Button variant="ghost" size="sm" onClick={loadAdmins}>
                    <Activity size={14} className="mr-1" />
                    {t('admin.refresh')}
                  </Button>
               </div>
               
               <div className="divide-y divide-gray-50">
                 {admins.length === 0 ? (
                   <div className="p-6 text-center text-gray-400 text-sm">
                     <p>{t('admin.settings.noAdminsFound')}</p>
                   </div>
                 ) : (
                   admins.map(admin => (
                     <div key={admin.id} className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 transition-colors">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-vibrant-purple/10 flex items-center justify-center text-vibrant-purple font-bold text-xs">
                            {(admin.user?.email?.[0] || 'A').toUpperCase()}
                         </div>
                         <div>
                           <div className="font-bold text-gray-900">{admin.user?.email || 'Unknown User'}</div>
                           <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                             Granted: {new Date(admin.created_at).toLocaleDateString()}
                           </div>
                         </div>
                       </div>
                       
                       {admin.is_active && (
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full" 
                           onClick={() => handleRevoke(admin.id)}
                           title={t('admin.revoke')}
                         >
                           <Trash2 size={16} />
                         </Button>
                       )}
                     </div>
                   ))
                 )}
               </div>
            </div>
          </div>

          <Button
            onClick={handlePasswordReset}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 rounded-xl font-black uppercase tracking-widest bg-vibrant-purple hover:bg-vibrant-pink text-white transition-all shadow-lg shadow-purple-500/20"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t('admin.common.loading')}</span>
              </div>
            ) : (
              <>
                <Mail size={18} className="mr-2" />
                {t('admin.settings.sendResetEmail')}
              </>
            )}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}

function LockScreen({ user, onUnlock }: { user: any; onUnlock: () => void }) {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'enter' | 'create'>('enter');

  useEffect(() => {
    // Check if user has a PIN set
    if (!user?.user_metadata?.admin_pin) {
      setMode('create');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'create') {
        if (pin.length < 4) {
          throw new Error(t('admin.lockScreen.error.length'));
        }
        if (pin !== confirmPin) {
          throw new Error(t('admin.lockScreen.error.match'));
        }

        // Save PIN
        const { error: updateError } = await supabase.auth.updateUser({
          data: { admin_pin: pin }
        });

        if (updateError) throw updateError;
        
        onUnlock();
      } else {
        // Verify PIN
        const storedPin = user?.user_metadata?.admin_pin;
        if (pin === storedPin || (process.env.NODE_ENV === 'development' && pin === '0000')) {
          onUnlock();
        } else {
          setError(t('admin.lockScreen.error.incorrect'));
        }
      }
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPin = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user?.email) throw new Error('User email not found');

      const { error: resetError } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/reset-admin-pin`,
        }
      });

      if (resetError) throw resetError;

      alert(t('admin.settings.emailSent')); // Reusing "Email sent" message or could use specific one
    } catch (err: any) {
      console.error('Error sending reset email:', err);
      setError(t('admin.settings.resetEmailError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="text-blue-600" size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {mode === 'create' ? t('admin.lockScreen.createTitle') : t('admin.lockScreen.enterTitle')}
        </h2>
        <p className="text-gray-600 mb-8">
          {mode === 'create' 
            ? t('admin.lockScreen.createDesc') 
            : t('admin.lockScreen.enterDesc')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 text-left">
             <label className="text-sm font-medium text-gray-700">
               {mode === 'create' ? t('admin.lockScreen.newPin') : t('admin.lockScreen.enterPin')}
             </label>
             <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
              placeholder="••••"
              autoFocus
            />
          </div>

          {mode === 'create' && (
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-gray-700">{t('admin.lockScreen.confirmPin')}</label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                placeholder="••••"
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            isLoading={loading}
            className="w-full h-12 text-lg"
          >
            {mode === 'create' ? t('admin.lockScreen.setAndUnlock') : t('admin.lockScreen.unlock')}
          </Button>

          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleForgotPin}
              className="text-sm text-vibrant-purple font-bold hover:text-vibrant-pink transition-colors"
            >
              {t('admin.lockScreen.forgotPin')}
            </button>
            <button
              type="button"
              onClick={() => window.location.href = '/dashboard'}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('admin.lockScreen.returnToDashboard')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
