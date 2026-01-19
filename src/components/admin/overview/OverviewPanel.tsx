import { useI18n } from '../../../contexts/I18nContext';
import { AdminStats } from '../../../services/adminService';
import { AdminStatCard } from '../ui/AdminStatCard';
import { AdminPageHeader } from '../ui/AdminPageHeader';
import { 
  Users, 
  Briefcase, 
  ShoppingBag, 
  Calendar, 
  GraduationCap, 
  FileText,
  MessageSquare
} from 'lucide-react';

interface OverviewPanelProps {
  stats: AdminStats;
}

export function OverviewPanel({ stats }: OverviewPanelProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader 
        title={t('admin.dashboardOverview')} 
        description={t('admin.welcomeBack')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard
          title={t('admin.totalUsers')}
          value={stats.totalUsers}
          icon={<Users size={20} />}
          gradient="from-blue-500 to-cyan-500"
        />
        <AdminStatCard
          title={t('admin.totalJobs')}
          value={stats.totalJobs}
          icon={<Briefcase size={20} />}
          gradient="from-emerald-500 to-teal-500"
        />
        <AdminStatCard
          title={t('admin.totalMarketplace')}
          value={stats.totalMarketplaceItems}
          icon={<ShoppingBag size={20} />}
          gradient="from-pink-500 to-rose-500"
        />
        <AdminStatCard
          title={t('admin.totalEvents')}
          value={stats.totalEvents}
          icon={<Calendar size={20} />}
          gradient="from-amber-500 to-orange-500"
        />
        <AdminStatCard
          title={t('admin.educationPrograms')}
          value={stats.totalEducationPrograms}
          icon={<GraduationCap size={20} />}
          gradient="from-indigo-500 to-violet-500"
        />
        <AdminStatCard
          title={t('admin.pendingVisa')}
          value={stats.pendingVisaApplications}
          icon={<FileText size={20} />}
          gradient="from-red-500 to-orange-500"
        />
        <AdminStatCard
          title={t('admin.activeConversations')}
          value={stats.activeConversations}
          icon={<MessageSquare size={20} />}
          gradient="from-cyan-500 to-blue-500"
        />
      </div>

      {/* Recent Activity Section - Placeholder for now */}
      {/* <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('admin.recentActivity')}</h3>
        <AdminCard className="h-64 flex items-center justify-center text-gray-400">
          Recent activity log will appear here
        </AdminCard>
      </div> */}
    </div>
  );
}
