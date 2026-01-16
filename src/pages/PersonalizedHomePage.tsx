import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { useI18n } from '../contexts/I18nContext';
import {
  Briefcase,
  Calendar,
  ShoppingBag,
  Users,
  GraduationCap,
  Home,
  TrendingUp,
  Heart,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function PersonalizedHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const {
    personalization,
    primaryRole,
    moduleEngagement,
    loading,
    getRecommendations,
    trackModuleVisit,
  } = usePersonalization();

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    trackModuleVisit('home');
  }, []);

  useEffect(() => {
    if (!loading && user && personalization) {
      redirectBasedOnRole();
    }
  }, [loading, user, personalization, primaryRole]);

  useEffect(() => {
    if (user && primaryRole && personalization?.show_recommendations) {
      loadRecommendations();
    }
  }, [user, primaryRole, personalization]);

  const redirectBasedOnRole = () => {
    if (!personalization || !user) return;

    if (primaryRole) {
      const roleRoute = getRoleRoute(primaryRole);
      if (roleRoute !== '/home') {
        navigate(roleRoute, { replace: true });
        return;
      }
    }

    if (personalization.last_visited_module) {
      const lastModule = personalization.last_visited_module;
      if (lastModule !== 'home') {
        navigate(`/${lastModule}`, { replace: true });
        return;
      }
    }

    if (moduleEngagement.length > 0) {
      const topModule = moduleEngagement[0].module;
      if (topModule !== 'home') {
        navigate(`/${topModule}`, { replace: true });
      }
    }
  };

  const getRoleRoute = (role: any): string => {
    const routes: Record<string, string> = {
      'jobs:job_seeker': '/jobs',
      'jobs:employer': '/my-jobs',
      'au_pair:au_pair': '/au-pair/families',
      'au_pair:host_family': '/au-pair/browse',
      'events:attendee': '/events',
      'events:organizer': '/events/my-events',
      'marketplace:buyer': '/marketplace',
      'marketplace:seller': '/marketplace/my-listings',
    };

    return routes[`${role.module}:${role.role_type}`] || '/home';
  };

  const loadRecommendations = async () => {
    if (!primaryRole) return;

    setLoadingRecommendations(true);
    try {
      let recs: any[] = [];

      switch (primaryRole.module) {
        case 'jobs':
          recs = await getRecommendations('jobs', 6);
          break;
        case 'au_pair':
          recs = await getRecommendations('families', 6);
          break;
        case 'events':
          recs = await getRecommendations('events', 6);
          break;
        case 'marketplace':
          recs = await getRecommendations('marketplace', 6);
          break;
      }

      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('home.loadingPersonalized')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              {t('home.welcome')}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t('home.connectDiscoverGrow')}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/signup')} size="lg">
                {t('home.getStarted')}
              </Button>
              <Button onClick={() => navigate('/signin')} variant="secondary" size="lg">
                {t('home.signIn')}
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <ModuleCard
              icon={<Briefcase className="w-8 h-8" />}
              title={t('home.findJobs')}
              description={t('home.findJobsDesc')}
              onClick={() => navigate('/jobs')}
            />
            <ModuleCard
              icon={<Home className="w-8 h-8" />}
              title={t('home.auPairProgram')}
              description={t('home.auPairDesc')}
              onClick={() => navigate('/au-pair')}
            />
            <ModuleCard
              icon={<Calendar className="w-8 h-8" />}
              title={t('home.events')}
              description={t('home.eventsDesc')}
              onClick={() => navigate('/events')}
            />
            <ModuleCard
              icon={<ShoppingBag className="w-8 h-8" />}
              title={t('home.marketplace')}
              description={t('home.marketplaceDesc')}
              onClick={() => navigate('/marketplace')}
            />
            <ModuleCard
              icon={<GraduationCap className="w-8 h-8" />}
              title={t('home.education')}
              description={t('home.educationDesc')}
              onClick={() => navigate('/education')}
            />
            <ModuleCard
              icon={<Users className="w-8 h-8" />}
              title={t('home.community')}
              description={t('home.communityDesc')}
              onClick={() => navigate('/community')}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('home.welcomeBack')}</h1>
          <p className="text-gray-600 mt-2">
            {getWelcomeMessage()}
          </p>
        </div>

        {recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                {t('home.recommendedForYou')}
              </h2>
              <button
                onClick={() => navigate(getRoleRoute(primaryRole))}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
              >
                {t('home.viewAll')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {loadingRecommendations ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <RecommendationCard key={index} item={rec} role={primaryRole} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {moduleEngagement.slice(0, 6).map((engagement) => (
            <ModuleEngagementCard
              key={engagement.module}
              module={engagement.module}
              score={engagement.engagement_score}
              actionsCount={engagement.actions_count}
              onClick={() => navigate(`/${engagement.module}`)}
            />
          ))}
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('home.quickActions')}</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <QuickActionButton
              icon={<MessageCircle className="w-5 h-5" />}
              label={t('home.messages') || t('home.quickActions')} // fallback if needed, but let's use common
              onClick={() => navigate('/messaging')}
            />
            <QuickActionButton
              icon={<Heart className="w-5 h-5" />}
              label={t('home.savedItems')}
              onClick={() => navigate('/saved')}
            />
            <QuickActionButton
              icon={<Users className="w-5 h-5" />}
              label={t('home.myProfile')}
              onClick={() => navigate('/profile')}
            />
            <QuickActionButton
              icon={<Calendar className="w-5 h-5" />}
              label={t('home.myEvents')}
              onClick={() => navigate('/events/my-events')}
            />
          </div>
        </div>
      </div>
    </div>
  );

  function getWelcomeMessage(): string {
    if (!primaryRole) return t('home.exploreFeatures');

    const messages: Record<string, string> = {
      'jobs:job_seeker': t('home.discoverJobOpp'),
      'jobs:employer': t('home.manageJobsApps'),
      'au_pair:au_pair': t('home.findHostFamilyMatch'),
      'au_pair:host_family': t('home.connectQualifiedAuPairs'),
      'events:attendee': t('home.discoverExcitingEvents'),
      'events:organizer': t('home.manageEventsAttendees'),
      'marketplace:buyer': t('home.browseCommunityItems'),
      'marketplace:seller': t('home.manageListingsSales'),
    };

    return messages[`${primaryRole.module}:${primaryRole.role_type}`] || t('home.explorePlatform');
  }
}

function ModuleCard({ icon, title, description, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function ModuleEngagementCard({ module, score, actionsCount, onClick }: any) {
  const { t } = useI18n();
  const getModuleInfo = (module: string) => {
    const info: Record<string, { icon: any; label: string; color: string }> = {
      jobs: { icon: <Briefcase className="w-6 h-6" />, label: t('home.findJobs'), color: 'blue' },
      'au_pair': { icon: <Home className="w-6 h-6" />, label: t('home.auPairProgram'), color: 'green' },
      events: { icon: <Calendar className="w-6 h-6" />, label: t('home.events'), color: 'purple' },
      marketplace: { icon: <ShoppingBag className="w-6 h-6" />, label: t('home.marketplace'), color: 'orange' },
      education: { icon: <GraduationCap className="w-6 h-6" />, label: t('home.education'), color: 'red' },
      community: { icon: <Users className="w-6 h-6" />, label: t('home.community'), color: 'pink' },
    };

    return info[module] || { icon: null, label: module, color: 'gray' };
  };

  const moduleInfo = getModuleInfo(module);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg p-6 shadow hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className={`text-${moduleInfo.color}-600 mb-3`}>{moduleInfo.icon}</div>
      <h3 className="font-semibold text-gray-900 mb-2">{moduleInfo.label}</h3>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{actionsCount} {t('home.actions')}</span>
        <span className={`text-${moduleInfo.color}-600 font-medium`}>
          {score}% {t('home.engaged')}
        </span>
      </div>
    </div>
  );
}

function RecommendationCard({ item, role }: any) {
  if (!role) return null;

  if (role.module === 'jobs') {
    return (
      <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
        <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
        <p className="text-sm text-gray-600 mb-2">{item.company_name}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{item.location_city}</span>
          <span className="text-blue-600 font-medium">{item.job_type}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <h4 className="font-semibold text-gray-900 mb-2">{item.title || item.family_name}</h4>
      <p className="text-sm text-gray-600">{item.location || item.description}</p>
    </div>
  );
}

function QuickActionButton({ icon, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="text-blue-600 mb-2">{icon}</div>
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </button>
  );
}
