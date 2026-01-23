import { useState, useEffect } from 'react';
import { useI18n } from '../../../contexts/I18nContext';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';
import { 
  LayoutDashboard, 
  Shield, 
  Bell, 
  Settings,
  Save,
  Lock,
  UserPlus,
  Trash2
} from 'lucide-react';

interface ModuleConfig {
  id: string;
  label: string;
  enabled: boolean;
}

interface AdminUser {
  id: string;
  email: string;
  joined_at: string;
}

export function AdminSettingsPanel() {
  const { t } = useI18n();
  const { user } = useAuth();
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

  // Admin Management State
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // PIN Management State
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    // Load persistsed settings
    const savedModules = localStorage.getItem('admin_dashboard_modules');
    if (savedModules) {
      setModules(JSON.parse(savedModules));
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'permissions') {
      fetchAdmins();
    }
  }, [activeSection]);

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
    setTimeout(() => {
      localStorage.setItem('admin_dashboard_modules', JSON.stringify(modules));
      showToast('success', t('common.saved'));
      setLoading(false);
      window.dispatchEvent(new Event('admin_settings_updated'));
    }, 500);
  };

  const toggleModule = (id: string) => {
    setModules(modules.map(m => 
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ));
  };

  // --- Admin Management Functions ---

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const { error } = await supabase.functions.invoke('manage-admin', {
        body: {}, // Use URL params for GET usually, but supabase invoke sends body. 
                  // Wait, GET requests with invoke are tricky. Let's use POST with action param if GET fails, 
                  // or just append params to URL if client supports it.
                  // Default invoke is POST. let's support action in body or query.
        // My function supports url.searchParams. Let's pass query params?
        // supabase-js invoke method: .invoke('func', { headers, body, method })
        method: 'POST', // Use POST for simplicity as my function checks method? No, my function assumes standard serve(req).
                        // Let's pass action in query params.
      });
      
      // Actually, passing query params to invoke:
      // invoke('manage-admin?action=list')
      
      const { data: listData, error: listError } = await supabase.functions.invoke('manage-admin?action=list', {
        method: 'GET'
      });

      if (listError) throw listError;
      setAdmins(listData.admins || []);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
      // Fallback or show error
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-admin?action=add', {
        method: 'POST',
        body: { email: newAdminEmail }
      });

      if (error) throw error;
      
      showToast('success', `Admin invite sent to ${newAdminEmail}`);
      setNewAdminEmail('');
      fetchAdmins();
    } catch (err: any) {
      console.error('Failed to add admin:', err);
      showToast('error', err.message || 'Failed to add admin');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-admin?action=remove', {
        method: 'POST',
        body: { userId }
      });

      if (error) throw error;
      
      showToast('success', 'Admin removed successfully');
      fetchAdmins();
    } catch (err: any) {
      console.error('Failed to remove admin:', err);
      showToast('error', err.message || 'Failed to remove admin');
    } finally {
      setLoading(false);
    }
  };

  // --- Security Functions ---

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (newPin.length !== 4) {
      setPinError(t('admin.lockScreen.error.length'));
      return;
    }
    if (newPin !== confirmPin) {
      setPinError(t('admin.lockScreen.error.match'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { admin_pin: newPin }
      });

      if (error) throw error;
      
      showToast('success', 'PIN updated successfully');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      setPinError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'general', label: t('settings.general'), icon: Settings },
    { id: 'security', label: 'Security', icon: Lock }, // Changed from global 'settings.security' which might not exist
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

          {activeSection === 'security' && (
             <div className="space-y-6">
               <div>
                  <h3 className="text-lg font-medium text-gray-900">Admin Security</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage your access PIN and security settings.
                  </p>
               </div>

               <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Lock size={16} />
                    Change Admin PIN
                  </h4>
                  <form onSubmit={handleUpdatePin} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">New PIN</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 border rounded-md text-center tracking-widest"
                          placeholder="••••"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Confirm PIN</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 border rounded-md text-center tracking-widest"
                          placeholder="••••"
                        />
                      </div>
                    </div>
                    {pinError && <p className="text-xs text-red-500">{pinError}</p>}
                    <div className="flex justify-end">
                      <Button type="submit" disabled={loading || !newPin} size="sm">
                        Update PIN
                      </Button>
                    </div>
                  </form>
               </div>
             </div>
          )}

          {activeSection === 'permissions' && (
             <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Admin Management</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage who has access to the admin portal.
                  </p>
               </div>

               {/* Add Admin Form */}
               <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                 <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                   <UserPlus size={16} />
                   Add New Admin
                 </h4>
                 <form onSubmit={handleAddAdmin} className="flex gap-2">
                   <input
                     type="email"
                     value={newAdminEmail}
                     onChange={(e) => setNewAdminEmail(e.target.value)}
                     placeholder="Enter user email..."
                     className="flex-1 px-3 py-2 border border-blue-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                     required
                   />
                   <Button type="submit" disabled={loading} size="sm">
                     Invite
                   </Button>
                 </form>
                 <p className="text-xs text-blue-600 mt-2">
                   User must already have an account on the platform.
                 </p>
               </div>

               {/* Admin List */}
               <div className="space-y-3">
                 <h4 className="text-sm font-medium text-gray-700">Current Admins</h4>
                 
                 {loadingAdmins ? (
                   <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
                 ) : (
                   <div className="bg-white border boundary-gray-200 rounded-lg divide-y divide-gray-100">
                     {admins.map(admin => (
                       <div key={admin.id} className="flex items-center justify-between p-4">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                             <Shield size={14} className="text-gray-500" />
                           </div>
                           <div>
                             <p className="text-sm font-medium text-gray-900">{admin.email}</p>
                             <p className="text-xs text-gray-500">Joined {new Date(admin.joined_at).toLocaleDateString()}</p>
                           </div>
                         </div>
                         
                         {admin.id !== user?.id && (
                           <button
                             onClick={() => handleRemoveAdmin(admin.id)}
                             className="text-gray-400 hover:text-red-600 transition-colors p-2"
                             title="Remove access"
                           >
                             <Trash2 size={16} />
                           </button>
                         )}
                         {admin.id === user?.id && (
                           <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">You</span>
                         )}
                       </div>
                     ))}
                     
                     {admins.length === 0 && (
                       <div className="p-4 text-center text-gray-500 text-sm">
                         No admins found.
                       </div>
                     )}
                   </div>
                 )}
               </div>
             </div>
          )}

          {activeSection === 'general' && (
             <div className="text-center py-12 text-gray-500">
               <Settings size={48} className="mx-auto mb-4 text-gray-300" />
               <p>{t('admin.settings.generalPlaceholder')}</p>
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
