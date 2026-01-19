import { useState, useEffect } from 'react';
import { useI18n } from '../../../contexts/I18nContext';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';
import { 
  Globe, 
  LayoutDashboard, 
  Shield, 
  Bell, 
  Settings,
  Save
} from 'lucide-react';

interface ModuleConfig {
  id: string;
  label: string;
  enabled: boolean;
}

export function AdminSettingsPanel() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState('modules');
  const [loading, setLoading] = useState(false);

  // Dashboard Modules Configuration
  const [modules, setModules] = useState<ModuleConfig[]>([
    { id: 'visa', label: 'Visas', enabled: true },
    { id: 'jobs', label: 'Jobs', enabled: true },
    { id: 'education', label: 'Education', enabled: true },
    { id: 'marketplace', label: 'Marketplace', enabled: true },
    { id: 'events', label: 'Events', enabled: true },
    { id: 'community', label: 'Community', enabled: true },
    { id: 'au-pair', label: 'Au Pairs', enabled: true },
  ]);

  useEffect(() => {
    // Load persisted settings
    const savedModules = localStorage.getItem('admin_dashboard_modules');
    if (savedModules) {
      setModules(JSON.parse(savedModules));
    }
  }, []);

  const getModuleLabel = (id: string) => {
    switch(id) {
        case 'visa': return t('nav.visa');
        case 'jobs': return t('nav.jobs');
        case 'education': return t('nav.education');
        case 'marketplace': return t('nav.marketplace');
        case 'events': return t('nav.events');
        case 'community': return t('nav.community');
        case 'au-pair': return t('nav.auPair');
        default: return id;
    }
  };

  const handleSaveModules = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      localStorage.setItem('admin_dashboard_modules', JSON.stringify(modules));
      showToast('success', t('common.saved'));
      setLoading(false);
      // Trigger a custom event so other components can react
      window.dispatchEvent(new Event('admin_settings_updated'));
    }, 500);
  };

  const toggleModule = (id: string) => {
    setModules(modules.map(m => 
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ));
  };

  const sections = [
    { id: 'general', label: t('settings.general'), icon: Settings },
    { id: 'localization', label: t('settings.language'), icon: Globe },
    { id: 'modules', label: t('admin.dashboard.modules'), icon: LayoutDashboard },
    { id: 'permissions', label: t('admin.roles'), icon: Shield },
    { id: 'notifications', label: t('settings.notifications.label'), icon: Bell },
  ];

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-100 bg-gray-50/50 p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
          {t('admin.settings.title')}
        </h2>
        <nav className="space-y-1">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeSection === section.id
                  ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <section.icon size={16} />
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl">
          {activeSection === 'modules' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{t('admin.dashboard.modules')}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {t('admin.settings.modulesDesc')}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                {modules.map(module => (
                  <div key={module.id} className="flex items-center justify-between p-4">
                    <span className="text-sm font-medium text-gray-700">{getModuleLabel(module.id)}</span>
                    <button
                      onClick={() => toggleModule(module.id)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        module.enabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          module.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveModules} disabled={loading} className="flex items-center gap-2">
                  <Save size={16} />
                  {loading ? t('common.saving') : t('common.saveChanges')}
                </Button>
              </div>
            </div>
          )}

          {activeSection === 'general' && (
             <div className="text-center py-12 text-gray-500">
               <Settings size={48} className="mx-auto mb-4 text-gray-300" />
               <p>{t('admin.settings.generalPlaceholder')}</p>
             </div>
          )}
          
          {activeSection === 'localization' && (
             <div className="text-center py-12 text-gray-500">
               <Globe size={48} className="mx-auto mb-4 text-gray-300" />
               <p>{t('admin.settings.localizationPlaceholder')}</p>
             </div>
          )}

           {activeSection === 'permissions' && (
             <div className="text-center py-12 text-gray-500">
               <Shield size={48} className="mx-auto mb-4 text-gray-300" />
               <p>{t('admin.settings.permissionsPlaceholder')}</p>
             </div>
          )}

           {activeSection === 'notifications' && (
             <div className="text-center py-12 text-gray-500">
               <Bell size={48} className="mx-auto mb-4 text-gray-300" />
               <p>{t('admin.settings.notificationsPlaceholder')}</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
