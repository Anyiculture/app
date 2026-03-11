import React, { useState, useEffect, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { JobCard } from '../components/JobCard';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { supabase } from '../lib/supabase';
import { GeneralOnboarding } from '../components/GeneralOnboarding';
import { HeroCarousel } from '../components/HeroCarousel';
import { ChevronRight, Loader2, ShoppingBag, Briefcase, Calendar, GraduationCap, Users, Sparkles, ShieldCheck, Baby, TrendingUp, Upload, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { MarketplaceCard } from '../components/marketplace/MarketplaceCard';
import { EventCard } from '../components/events/EventCard';
import { ProfileCard } from '../components/aupair/ProfileCard';
import { EducationCard } from '../components/education/EducationCard';
import { BackgroundBlobs, GlassCard, Button } from '../components/ui';
import { motion } from 'framer-motion';
import { hostFamilySubscriptionService, type HostFamilySubscriptionState } from '../services/hostFamilySubscriptionService';
import { differenceInDays } from 'date-fns';

interface Profile {
  id: string;
  display_name: string;
  onboarding_completed: boolean;
  is_first_login: boolean;
  interested_modules: string[];
  primary_interest: string;
  au_pair_role?: string | null;
}

export function DashboardPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hostFamilySubscription, setHostFamilySubscription] = useState<HostFamilySubscriptionState | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else if (!loading) {
       navigate('/signin');
    }
  }, [user, loading, navigate]);

  const loadProfile = async () => {
    if (!user?.id) return;
    
    try {
      let resolvedIsAdmin = false;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, onboarding_completed, is_first_login, interested_modules, primary_interest, au_pair_role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);

      // Check if user is admin
      try {
        const { adminService } = await import('../services/adminService');
        resolvedIsAdmin = await adminService.checkIsAdmin();
        setIsAdmin(resolvedIsAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        resolvedIsAdmin = false;
      }

      // Fetch user services/roles
      const { data: rolesData } = await supabase
        .from('user_services')
        .select('role')
        .eq('user_id', user.id);
      
      const roleSet = new Set<string>(rolesData?.map((r: { role: string }) => r.role) || []);

      if (data?.au_pair_role === 'host_family' || data?.au_pair_role === 'au_pair') {
        roleSet.add(data.au_pair_role);
      }

      if (!roleSet.has('host_family')) {
        const { data: hostFamilyProfile } = await supabase
          .from('host_family_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (hostFamilyProfile) roleSet.add('host_family');
      }

      if (!roleSet.has('au_pair')) {
        const { data: auPairProfile } = await supabase
          .from('au_pair_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (auPairProfile) roleSet.add('au_pair');
      }

      const roles = Array.from(roleSet);
      setUserRoles(roles);

      // Load host-family subscription state from canonical backend source
      if (roles.includes('host_family') && !resolvedIsAdmin) {
        const subscriptionState = await hostFamilySubscriptionService.getState(user.id);
        setHostFamilySubscription(subscriptionState);
      } else {
        setHostFamilySubscription(null);
      }

    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // Redirect to sign in if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-gray-400 mx-auto mb-4" size={32} />
          <p className="text-gray-500">Redirecting to login...</p>
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Link 
                to="/admin" 
                className="flex items-center gap-4 p-2 pr-6 bg-white/40 backdrop-blur-xl border border-white/60 rounded-full hover:bg-white/60 transition-all shadow-xl shadow-purple-500/5 group"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-gray-900 text-white rounded-full">
                  <ShieldCheck size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-vibrant-purple uppercase tracking-widest">{t('dashboard.masterControl')}</span>
                  <span className="font-bold text-gray-900">{t('nav.adminPortal')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  if (!profile?.onboarding_completed && !isAdmin) {
    return <GeneralOnboarding userId={user?.id || ''} onComplete={loadProfile} />;
  }

  const isAuPair = userRoles.includes('au_pair');
  const isHostFamily = userRoles.includes('host_family') && !isAdmin;
  const hostFamilyStatusChipTone =
    hostFamilySubscription?.subscription_status === 'premium_active'
      ? {
          wrap: 'border-emerald-200 bg-emerald-50 text-emerald-700',
          icon: 'text-emerald-600',
        }
      : hostFamilySubscription?.subscription_status === 'pending_approval'
        ? {
            wrap: 'border-amber-200 bg-amber-50 text-amber-700',
            icon: 'text-amber-600',
          }
        : {
            wrap: 'border-rose-200 bg-rose-50 text-rose-700',
            icon: 'text-rose-600',
          };
  const hostFamilyStatusChipLabel =
    hostFamilySubscription?.subscription_status === 'premium_active'
      ? (t('account.billing.currentPlanPremium') || 'Premium active')
      : hostFamilySubscription?.subscription_status === 'pending_approval'
        ? (t('dashboard.viewPaymentStatus') || 'Pending approval')
        : hostFamilySubscription?.subscription_status === 'premium_expired'
          ? (t('dashboard.renewSubscription') || 'Expired')
          : hostFamilySubscription?.subscription_status === 'rejected'
            ? (t('dashboard.resubmitPayment') || 'Rejected')
            : (t('account.billing.currentPlanFree') || 'Free Plan');
  const hostFamilyStatusLabel =
    hostFamilySubscription?.subscription_status === 'premium_active'
      ? `${(t('dashboard.premiumActiveUntil') || 'Premium active until {{date}}')
          .replace('{{date}}', hostFamilySubscription.expires_at ? new Date(hostFamilySubscription.expires_at).toLocaleDateString() : '-')} ${
            hostFamilySubscription.expires_at
              ? `• ${t('dashboard.daysRemaining', {
                  days: Math.max(0, differenceInDays(new Date(hostFamilySubscription.expires_at), new Date()))
                })}`
              : ''
          }`.trim()
      : hostFamilySubscription?.subscription_status === 'pending_approval'
        ? (t('dashboard.paymentAwaitingApproval') || 'Payment submitted, awaiting admin approval.')
        : hostFamilySubscription?.subscription_status === 'premium_expired'
          ? (t('dashboard.subscriptionExpiredRenew') || 'Subscription expired. Renew to continue contacting au pairs.')
          : hostFamilySubscription?.subscription_status === 'rejected'
            ? (t('dashboard.paymentRejectedResubmit') || 'Payment was rejected. Resubmit your payment proof.')
            : (t('dashboard.freePlanUpgradePrompt') || 'Free Plan. Upgrade to contact au pairs.');
  const hostFamilyStatusAction =
    hostFamilySubscription?.subscription_status === 'premium_active'
      ? (t('dashboard.viewBilling') || 'Billing')
      : hostFamilySubscription?.subscription_status === 'premium_expired'
        ? (t('dashboard.renewSubscription') || 'Renew')
        : hostFamilySubscription?.subscription_status === 'rejected'
          ? (t('dashboard.resubmitPayment') || 'Resubmit')
          : hostFamilySubscription?.subscription_status === 'pending_approval'
            ? (t('dashboard.viewPaymentStatus') || 'Status')
            : (t('dashboard.uploadProof') || 'Upgrade');

  const LogoText = t('dashboard.title');



  return (
    <div className="min-h-screen bg-[#eaecf0] pb-10 overflow-hidden relative font-sans">
      <BackgroundBlobs />
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-vibrant-purple/10 rounded-full mb-4 ring-1 ring-vibrant-purple/20">
              <Sparkles className="w-4 h-4 text-vibrant-purple animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-vibrant-purple">
                {t('dashboard.welcomeBack')}
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-gray-900 tracking-tight leading-none mb-2 sm:mb-4">
              {LogoText.split(' ').map((word, i) => (
                <span key={i} className={i === 1 ? "text-transparent bg-clip-text bg-gradient-to-r from-vibrant-purple to-purple-800" : ""}>
                  {word}{' '}
                </span>
              ))}
            </h1>
            <p className="text-sm sm:text-lg text-gray-500 font-medium">
              {t('common.welcome')}, <span className="text-gray-900 font-bold underline decoration-vibrant-purple/30 underline-offset-4">{profile?.display_name}</span>. {t('dashboard.readyAdventure')}
            </p>
          </motion.div>
        </div>

        {/* Dynamic Greeting & Hero */}
        <div className="mb-10 sm:mb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-8 hidden lg:block">
             <div className="relative h-full overflow-hidden rounded-[2.5rem] shadow-2xl group min-h-[250px]">
               <HeroCarousel />
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6">
             <GlassCard className="flex-1 flex flex-col justify-center p-8 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-white/20">
               <div className="w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center mb-6 text-blue-600">
                  <TrendingUp size={24} />
               </div>
                <h3 className="text-2xl font-black text-gray-900 leading-tight mb-2 uppercase tracking-wide">{t('dashboard.platformStatus')}</h3>
                <p className="text-gray-600 font-medium mb-6">{t('dashboard.smoothRunning')}</p>
               <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-600 underline">{t('dashboard.joinMembers')}</span>
               </div>
               {(isAdmin || (isHostFamily && hostFamilySubscription)) && (
                 <div className="mt-6 flex flex-wrap items-center gap-2">
                   {isAdmin && (
                     <Link
                       to="/admin"
                       className="inline-flex h-8 items-center gap-2 rounded-full bg-gray-900 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
                     >
                       <ShieldCheck size={14} />
                       {t('nav.adminPortal')}
                     </Link>
                   )}

                   {isHostFamily && hostFamilySubscription && (
                     <>
                       <span className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold ${hostFamilyStatusChipTone.wrap}`}>
                         {hostFamilySubscription.subscription_status === 'premium_active' ? (
                           <CheckCircle size={14} className={hostFamilyStatusChipTone.icon} />
                         ) : hostFamilySubscription.subscription_status === 'pending_approval' ? (
                           <Upload size={14} className={hostFamilyStatusChipTone.icon} />
                         ) : (
                           <AlertCircle size={14} className={hostFamilyStatusChipTone.icon} />
                         )}
                         {hostFamilyStatusChipLabel}
                       </span>
                       <button
                         type="button"
                         onClick={() => navigate(
                           hostFamilySubscription.subscription_status === 'premium_active'
                             ? '/account?section=billing'
                             : '/au-pair/payment'
                         )}
                         className="inline-flex h-8 items-center rounded-full border border-white/70 bg-white/80 px-3 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-white hover:text-gray-900"
                       >
                         {hostFamilyStatusAction}
                       </button>
                     </>
                   )}
                 </div>
               )}
               {isHostFamily && hostFamilySubscription && (
                 <p className="mt-3 text-xs font-medium leading-relaxed text-gray-600">
                   {hostFamilyStatusLabel}
                 </p>
               )}
             </GlassCard>
          </div>
        </div>

        {/* Reimagined Module Sections (Instead of Shelves) */}
        <div className="space-y-8 sm:space-y-12">
          {/* Marketplace Section */}
          <SectionContainer 
            id="marketplace"
            title={t('nav.marketplace')} 
            subtitle={t('dashboard.marketplaceSubtitle')}
            link="/marketplace"
            icon={<ShoppingBag size={32} />}
            gradient="from-pink-500 to-rose-500"
          >
            <MarketplaceShelfContent />
          </SectionContainer>

          {/* Jobs Section */}
          <SectionContainer 
            id="jobs"
            title="Positions" 
            subtitle={t('dashboard.jobsSubtitle')}
            link="/jobs"
            icon={<Briefcase size={32} />}
            gradient="from-blue-500 to-cyan-500"
          >
            <JobsShelfContent />
          </SectionContainer>

          {/* Events Section */}
          <SectionContainer 
            id="events"
            title={t('nav.events')} 
            subtitle={t('dashboard.eventsSubtitle')}
            link="/events"
            icon={<Calendar size={32} />}
            gradient="from-purple-500 to-indigo-500"
          >
            <EventsShelfContent />
          </SectionContainer>

          {/* Education Section */}
          <SectionContainer 
            id="education"
            title={t('nav.education')} 
            subtitle={t('dashboard.educationSubtitle')}
            link="/education"
            icon={<GraduationCap size={32} />}
            gradient="from-indigo-600 to-violet-600"
          >
            <EducationShelfContent />
          </SectionContainer>



          {(isHostFamily || isAdmin) && (
            <SectionContainer 
              id="aupair-candidates"
              title={t('dashboard.verifiedAuPairs')} 
              subtitle={t('dashboard.auPairsSubtitle')}
              link="/au-pairs/browse"
              icon={<Baby size={32} />}
              gradient="from-orange-500 to-amber-500"
            >
              <AuPairCandidatesShelfContent />
            </SectionContainer>
          )}

          {(isAuPair || profile?.interested_modules.includes('auPair')) && !isHostFamily && (
            <SectionContainer 
              id="host-families"
              title={t('dashboard.hostFamiliesMatching')} 
              subtitle={t('dashboard.hostFamiliesSubtitle')}
              link="/families/browse"
              icon={<Users size={32} />}
              gradient="from-blue-600 to-indigo-700"
            >
              <HostFamiliesShelfContent />
            </SectionContainer>
          )}

          <SectionContainer 
            id="community"
            title={t('dashboard.communityDiscussions')} 
            subtitle={t('dashboard.communitySubtitle')}
            link="/community"
            icon={<MessageSquare size={32} />}
            gradient="from-violet-500 to-fuchsia-500"
          >
            <CommunityShelfContent />
          </SectionContainer>
        </div>
      </div>
    </div>
  );
}

// --- Layout Helpers ---

function SectionContainer({ title, subtitle, link, icon, gradient, children, id }: { 
  title: string, subtitle: string, link: string, icon: ReactNode, gradient: string, children: ReactNode, id: string 
}) {
  const { t } = useI18n();
  return (
    <motion.section 
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="relative"
    >
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${gradient} p-0.5 shadow-lg`}>
            <div className="w-full h-full bg-white/10 backdrop-blur-xl rounded-[0.4rem] sm:rounded-[0.6rem] flex items-center justify-center text-white">
              {React.cloneElement(icon as React.ReactElement, { size: 16, className: 'sm:w-6 sm:h-6' })}
            </div>
          </div>
          <div>
            <h2 className="text-sm sm:text-xl font-black text-gray-900 tracking-tight uppercase leading-tight">{title}</h2>
            <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest">{subtitle}</p>
          </div>
        </div>
        <Link to={link}>
          <Button variant="outline" className="h-7 sm:h-9 rounded-full px-3 py-0 sm:px-5 font-black uppercase tracking-widest text-[8px] sm:text-[10px] transition-all hover:scale-105 border-gray-200 flex items-center justify-center ring-1 ring-gray-200/50">
            {t('dashboard.seeAll')} <ChevronRight size={12} className="ml-1 sm:w-3.5 sm:h-3.5" />
          </Button>
        </Link>
      </div>

      <div className="flex gap-3 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {children}
      </div>
    </motion.section>
  );
}

// --- Specific Shelves ---

function JobsShelfContent() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (!jobsData) {
          setJobs([]);
          setLoading(false);
          return;
        }

        // Fetch employer profiles for logos
        const posterIds = [...new Set(jobsData.map((job: any) => job.poster_id))];
        const { data: profiles } = await supabase
          .from('profiles_employer')
          .select('id, company_logo, company_name')
          .in('id', posterIds);

        const jobsWithLogos = jobsData.map((job: any) => {
          const profile = profiles?.find((p: any) => p.id === job.poster_id);
          return {
            ...job,
            company_logo: profile?.company_logo,
            // Use profile company name if job doesn't have one, or prefer profile one?
            // Job usually has company_name snapshot, but profile is source of truth.
            // Let's keep job's company_name but add logo.
            employer_logo: profile?.company_logo
          };
        });

        setJobs(jobsWithLogos);
      } catch (error) {
        console.error('Error loading jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <SkeletonGrid size={6} />;
  return (
    <>
      {jobs.map((job, i) => (
        <motion.div
          key={job.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="w-[40vw] sm:w-[220px] md:w-[260px] flex-none snap-start"
        >
          <JobCard job={job} isDashboard={true} />
        </motion.div>
      ))}
    </>
  );
}

function MarketplaceShelfContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: items, error } = await supabase
          .from('marketplace_items')
          .select('*')
          .eq('status', 'active')
          .limit(10);

        if (error) throw error;
        if (!items) return;

        const userIds = [...new Set(items.map((item: any) => item.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, full_name')
          .in('id', userIds);

        setItems(items.map((item: any) => ({
          ...item,
          seller: profiles?.find((p: any) => p.id === item.user_id) || null
        })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <SkeletonGrid size={6} />;
  return (
    <>
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="w-[40vw] sm:w-[220px] md:w-[260px] flex-none snap-start"
        >
          <MarketplaceCard 
            item={item} 
            user={user} 
            onToggleFavorite={() => {}} 
            getItemDistance={() => null} 
            isDashboard={true}
          />
        </motion.div>
      ))}
    </>
  );
}

function EventsShelfContent() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('events')
        .select('*, organizer:profiles!organizer_id(display_name, avatar_url, full_name)')
        .eq('status', 'published')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(10);
      
      setEvents(data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <SkeletonGrid size={6} />;
  return (
    <>
      {events.map((event, i) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="w-[40vw] sm:w-[220px] md:w-[260px] flex-none snap-start"
        >
          <EventCard event={event} isDashboard={true} />
        </motion.div>
      ))}
    </>
  );
}

function EducationShelfContent() {
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('education_resources')
        .select('*')
        .eq('status', 'active')
        .limit(10);
      
      setPrograms(data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <SkeletonGrid size={6} />;
  return (
    <>
      {programs.map((program, i) => (
        <motion.div
          key={program.id}
          initial={{ opacity: 0, filter: 'blur(5px)' }}
          whileInView={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ delay: i * 0.05 }}
          className="w-[40vw] sm:w-[220px] md:w-[260px] flex-none snap-start h-full"
        >
          <EducationCard program={program} onToggleFavorite={() => {}} isDashboard={true} />
        </motion.div>
      ))}
    </>
  );
}

function CommunityShelfContent() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('community_posts')
        .select('id, content, category, comments_count, created_at, author_id, profiles!community_posts_author_id_fkey(display_name)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setPosts(data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <SkeletonGrid size={6} />;
  return (
    <>
      {posts.map((post, i) => (
        <motion.div
           key={post.id}
           initial={{ opacity: 0, scale: 0.9 }}
           whileInView={{ opacity: 1, scale: 1 }}
           transition={{ delay: i * 0.05 }}
           className="w-[40vw] sm:w-[220px] md:w-[260px] flex-none snap-start"
        >
          <Link to={`/community/${post.id}`} className="block h-full group">
            <GlassCard className="h-32 sm:h-40 flex flex-col justify-between hover:border-vibrant-purple transition-colors p-3 sm:p-5">
              <div>
                <div className="flex items-center gap-1.5 mb-2 sm:mb-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-vibrant-purple/10 flex items-center justify-center text-vibrant-purple">
                    <MessageSquare size={12} className="sm:w-4 sm:h-4" />
                  </div>
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-vibrant-purple">{post.category ? t(`community.categories.${post.category}`) : t('dashboard.discussion')}</span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-vibrant-purple transition-colors">
                  {post.content}
                </h4>
              </div>
              <div className="flex items-center justify-between pt-2 sm:pt-4 border-t border-gray-100">
                <span className="text-[10px] sm:text-sm font-bold text-gray-400 capitalize">{(post.profiles as any)?.display_name || t('dashboard.globalUser')}</span>
                <div className="flex items-center gap-1 text-gray-300">
                   <Users size={12} />
                   <span className="text-[10px] font-black">{post.comments_count || 0}</span>
                </div>
              </div>
            </GlassCard>
          </Link>
        </motion.div>
      ))}
    </>
  );
}



function HostFamiliesShelfContent() {
  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('host_family_profiles')
        .select('*')
        .eq('profile_status', 'active')
        .limit(6);
      setFamilies(data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <SkeletonGrid size={6} />;
  return (
    <>
      {families.slice(0, window.innerWidth < 640 ? 3 : 6).map((family, i) => (
        <motion.div 
          key={family.id} 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          transition={{ delay: i * 0.05 }}
          className="w-[40vw] sm:w-[220px] md:w-[260px] flex-none snap-start"
        >
          <ProfileCard profile={family} userRole="au_pair" isFavorited={false} onToggleFavorite={() => {}} onView={() => {}} isDashboard={true} />
        </motion.div>
      ))}
    </>
  );
}

function AuPairCandidatesShelfContent() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('au_pair_profiles')
        .select('*')
        .eq('profile_status', 'active')
        .limit(6);
      setCandidates(data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <SkeletonGrid size={6} />;
  return (
    <>
      {candidates.slice(0, window.innerWidth < 640 ? 3 : 6).map((candidate, i) => (
        <motion.div 
          key={candidate.id} 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          transition={{ delay: i * 0.05 }}
          className="w-[40vw] sm:w-[220px] md:w-[260px] flex-none snap-start"
        >
          <ProfileCard profile={candidate} userRole="host_family" isFavorited={false} onToggleFavorite={() => {}} onView={() => {}} isDashboard={true} />
        </motion.div>
      ))}
    </>
  );
}

function SkeletonGrid({ size = 3 }: { size?: number }) {
  return (
    <>
      {Array.from({ length: size }).map((_, i) => (
        <div key={i} className="h-64 bg-gray-100 rounded-[2rem] animate-pulse border border-gray-100" />
      ))}
    </>
  );
}
