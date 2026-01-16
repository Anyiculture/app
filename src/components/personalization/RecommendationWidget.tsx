import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { getCategoryById } from '../../constants/marketplaceCategories';

interface RecommendationWidgetProps {
  type: 'jobs' | 'families' | 'events' | 'marketplace';
  title?: string;
  limit?: number;
  showViewAll?: boolean;
  viewAllRoute?: string;
}

export function RecommendationWidget({
  type,
  title,
  limit = 5,
  showViewAll = true,
  viewAllRoute,
}: RecommendationWidgetProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { getRecommendations, personalization } = usePersonalization();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (personalization?.show_recommendations) {
      loadRecommendations();
    }
  }, [type, limit, personalization]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const recs = await getRecommendations(type, limit);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!personalization?.show_recommendations) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  const defaultTitle = {
    jobs: t('dashboard.recommendedJobs') || 'Recommended Jobs',
    families: t('dashboard.recommendedFamilies') || 'Recommended Families',
    events: t('dashboard.recommendedEvents') || 'Recommended Events',
    marketplace: t('dashboard.recommendedItems') || 'Recommended Items',
  }[type];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          {title || defaultTitle}
        </h3>
        {showViewAll && viewAllRoute && (
          <button
            onClick={() => navigate(viewAllRoute)}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
          >
            {t('common.viewAll') || 'View All'}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <RecommendationItem key={index} item={rec} type={type} />
        ))}
      </div>
    </div>
  );
}

function RecommendationItem({ item, type }: { item: any; type: string }) {
  const navigate = useNavigate();
  const { t, language } = useI18n();

  const handleClick = () => {
    const routes: Record<string, string> = {
      jobs: `/jobs/${item.id}`,
      families: `/au-pair/family/${item.id}`,
      events: `/events/${item.id}`,
      marketplace: `/marketplace/${item.id}`,
    };

    navigate(routes[type]);
  };

  const getCategoryName = (id: string) => {
    const category = getCategoryById(id);
    if (!category) return id;
    return language === 'zh' ? category.name_zh : category.name_en;
  };

  return (
    <div
      onClick={handleClick}
      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {type === 'jobs' && (
        <>
          <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
          <p className="text-sm text-gray-600 mb-2">{item.company_name}</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{item.location_city}</span>
            {item.salary_min && (
              <span className="text-blue-600 font-medium">
                ${item.salary_min.toLocaleString()}+
              </span>
            )}
          </div>
        </>
      )}

      {type === 'families' && (
        <>
          <h4 className="font-semibold text-gray-900 mb-1">{item.family_name}</h4>
          <p className="text-sm text-gray-600 mb-1">{item.location}</p>
          <p className="text-sm text-gray-500">
            {item.children_count} {t('common.children') || 'children'} • {t('common.ages') || 'Ages'}: {item.children_ages}
          </p>
        </>
      )}

      {type === 'events' && (
        <>
          <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
          <p className="text-sm text-gray-600 mb-1">{item.location}</p>
          <p className="text-sm text-gray-500">
            {new Date(item.event_date).toLocaleDateString()}
          </p>
        </>
      )}

      {type === 'marketplace' && (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
              <p className="text-sm text-gray-500">{getCategoryName(item.category)}</p>
            </div>
            <span className="text-lg font-bold text-blue-600">
              ${item.price}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
