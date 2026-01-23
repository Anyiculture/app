import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { auPairService, AuPairProfile, HostFamilyProfile } from '../../services/auPairService';
import { StartConversationButton } from './ui/StartConversationButton';
import { Button, Modal } from '../ui';
import { Search, Eye, MapPin, Trash2, Ban, CheckCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AuPairOnboarding } from '../AuPairOnboarding';
import { HostFamilyOnboarding } from '../HostFamilyOnboarding';

const SimpleCard = ({ children, className = "", noPadding = false }: { children: React.ReactNode, className?: string, noPadding?: boolean }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${noPadding ? '' : 'p-6'} ${className}`}>
    {children}
  </div>
);

export function AuPairAdminPanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'au_pairs' | 'families' | 'deleted'>('au_pairs');
  const [auPairs, setAuPairs] = useState<AuPairProfile[]>([]);
  const [families, setFamilies] = useState<HostFamilyProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuPair, setSelectedAuPair] = useState<AuPairProfile | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<HostFamilyProfile | null>(null);
  
  // Onboarding modal states
  const [showAuPairOnboarding, setShowAuPairOnboarding] = useState(false);
  const [showFamilyOnboarding, setShowFamilyOnboarding] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'au_pairs') {
        const data = await auPairService.getAdminAuPairProfiles();
        setAuPairs(data);
      } else if (activeTab === 'families') {
        const data = await auPairService.getAdminHostFamilyProfiles();
        setFamilies(data);
      } else {
        // Load both for deleted tab
        const apData = await auPairService.getAdminAuPairProfiles();
        const famData = await auPairService.getAdminHostFamilyProfiles();
        setAuPairs(apData);
        setFamilies(famData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleBanUser = async (userId: string, currentStatus: string, type: 'aupair' | 'family') => {
      // Toggle ban status
      // Note: We are setting profile_status to 'banned' for visibility in this specific list
      // and checking if it's currently banned to toggle back to 'active'
      const isBanning = currentStatus !== 'banned';
      const newStatus = isBanning ? 'banned' : 'active';
      
      if (window.confirm(isBanning ? 'Are you sure you want to ban this user?' : 'Unban this user?')) {
        try {
            await adminService.updateUserStatus(userId, isBanning); // Updates auth/profiles is_banned
            
            // Also update local profile status for visibility in this table
            if (type === 'aupair') {
                await auPairService.adminUpdateAuPairProfile(userId, { profile_status: newStatus });
            } else {
                await auPairService.adminUpdateHostFamilyProfile(userId, { profile_status: newStatus });
            }
            loadData();
        } catch (error) {
            console.error('Error updating ban status:', error);
            alert('Failed to update status');
        }
      }
  };

  const handleDeleteUser = async (userId: string, type: 'aupair' | 'family') => {
      if (window.confirm('Are you sure you want to delete this user? This will mark them as deleted but keep the record.')) {
          try {
              // Soft delete by setting status to 'deleted'
              if (type === 'aupair') {
                  await auPairService.adminUpdateAuPairProfile(userId, { profile_status: 'deleted' });
              } else {
                  await auPairService.adminUpdateHostFamilyProfile(userId, { profile_status: 'deleted' });
              }
              loadData();
          } catch (error) {
              console.error('Error deleting user:', error);
              alert('Failed to delete user');
          }
      }
  };

  // Filtered data
  const filteredAuPairs = auPairs.filter(p => {
    const matchesSearch = p.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nationality?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'deleted') {
      return matchesSearch && p.profile_status === 'deleted';
    }
    return matchesSearch && p.profile_status !== 'deleted';
  });

  const filteredFamilies = families.filter(f => {
    const matchesSearch = f.family_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.city?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'deleted') {
      return matchesSearch && f.profile_status === 'deleted';
    }
    return matchesSearch && f.profile_status !== 'deleted';
  });

  const handleViewProfile = (profile: AuPairProfile | HostFamilyProfile, type: 'aupair' | 'family') => {
    // Navigate to the public profile view for this user
    // Au Pair profiles use /au-pair/profile/:id
    // Host Family profiles use /host-family/profile/:id
    const route = type === 'aupair' ? `/au-pair/profile/${profile.id}` : `/host-family/profile/${profile.id}`;
    window.open(route, '_blank');
  };

  const handleCreateAuPairListing = () => {
    setEditingProfileId(null);
    setShowAuPairOnboarding(true);
  };

  const handleCreateFamilyListing = () => {
    setEditingProfileId(null);
    setShowFamilyOnboarding(true);
  };



  const handleDeleteListing = async (profileId: string, type: 'aupair' | 'family', createdBy: string) => {
    // For admin listings, confirm deletion
    if (createdBy === 'admin' && !window.confirm(t('admin.auPair.confirmDelete'))) {
      return;
    }
    // For regular users, verify intent
    if (createdBy !== 'admin' && !window.confirm('Are you sure you want to delete this listing?')) {
        return;
    }

    try {
        if (type === 'aupair') {
            await auPairService.deleteAdminAuPairProfile(profileId);
        } else {
            await auPairService.deleteAdminHostFamilyProfile(profileId);
        }
        loadData();
    } catch (error) {
        console.error('Error deleting listing:', error);
        alert('Failed to delete listing');
    }
  };

  const handleRestoreListing = async (profileId: string, type: 'aupair' | 'family') => {
      if (!window.confirm('Restore this listing?')) return;
      try {
          if (type === 'aupair') {
              await auPairService.adminUpdateAuPairProfile(profileId, { profile_status: 'active' });
          } else {
              await auPairService.adminUpdateHostFamilyProfile(profileId, { profile_status: 'active' });
          }
          loadData();
      } catch (error) {
          console.error('Error restoring listing:', error);
          alert('Failed to restore listing');
      }
  };
  

  const handleOnboardingComplete = () => {
    setShowAuPairOnboarding(false);
    setShowFamilyOnboarding(false);
    setEditingProfileId(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t('admin.auPair.management')}</h2>
        <div className="flex gap-4">
            <Button 
              onClick={activeTab === 'au_pairs' ? handleCreateAuPairListing : handleCreateFamilyListing}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {activeTab === 'au_pairs' ? t('admin.auPair.createListing') : t('admin.auPair.createFamilyListing')}
            </Button>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    placeholder="Search..."
                    className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('au_pairs')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'au_pairs' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    {t('admin.sidebar.auPair')}
                </button>
                <button
                    onClick={() => setActiveTab('families')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'families' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    {t('common.families') || 'Families'}
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <button
                    onClick={() => setActiveTab('deleted')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'deleted' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-red-900'}`}
                >
                    {t('common.deleted') || 'Deleted'}
                </button>
            </div>
        </div>
      </div>

      {activeTab === 'au_pairs' ? (
          <SimpleCard noPadding className="overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">{t('admin.auPair.columns.user')}</th>
                  <th className="px-6 py-3 font-medium">{t('admin.auPair.columns.photo')}</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">{t('admin.auPair.columns.nationality')}</th>
                  <th className="px-6 py-3 font-medium hidden lg:table-cell">{t('admin.auPair.columns.experience')}</th>
                  <th className="px-6 py-3 font-medium">{t('admin.auPair.columns.status')}</th>
                  <th className="px-6 py-3 font-medium text-right">{t('admin.auPair.columns.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAuPairs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {t('admin.auPair.noProfiles')}
                    </td>
                  </tr>
                ) : (
                  filteredAuPairs.map((profile) => (
                    <tr key={profile.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{profile.display_name}</div>
                        <div className="text-xs text-gray-500">{profile.age} years old</div>
                      </td>
                      <td className="px-6 py-4">
                        {profile.profile_photos?.[0] ? (
                            <img src={profile.profile_photos[0]} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                <Eye size={16} />
                            </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 hidden md:table-cell">{profile.nationality}</td>
                      <td className="px-6 py-4 text-gray-600 hidden lg:table-cell">{profile.childcare_experience_years} years</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          profile.profile_status === 'active' ? 'bg-green-100 text-green-700' : 
                          profile.profile_status === 'banned' ? 'bg-red-100 text-red-700' :
                          profile.profile_status === 'deleted' ? 'bg-gray-200 text-gray-600' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {profile.profile_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                            {profile.created_by === 'admin' ? (
                                <span className="px-2 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded border border-blue-100 cursor-default">
                                    {t('admin.adminListing') || 'Admin Listing'}
                                </span>
                            ) : (
                                <StartConversationButton 
                                    userId={profile.user_id} 
                                    userName={profile.display_name} 
                                    contextType="aupair" 
                                    sourceContext={`Au Pair Profile: ${profile.display_name}`}
                                    size="sm"
                                    variant="ghost"
                                    className="text-gray-500 hover:text-blue-600"
                                />
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleViewProfile(profile, 'aupair')} title="View Profile">
                                <Eye size={14} />
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className={profile.profile_status === 'banned' ? "text-green-600 hover:text-green-700" : "text-orange-600 hover:text-orange-700"}
                                onClick={() => handleBanUser(profile.user_id, profile.profile_status, 'aupair')}
                                title={profile.profile_status === 'banned' ? "Unban User" : "Ban User"}
                            >
                                {profile.profile_status === 'banned' ? <CheckCircle size={14} /> : <Ban size={14} />}
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 hover:text-red-700" 
                                onClick={() => handleDeleteUser(profile.user_id, 'aupair')}
                                title="Soft Delete User"
                                disabled={profile.profile_status === 'deleted'}
                            >
                                <Ban size={14} />
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 hover:text-red-700" 
                                onClick={() => handleDeleteListing(profile.id, 'aupair', profile.created_by)}
                                title="Delete Listing"
                            >
                                <Trash2 size={14} />
                            </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </SimpleCard>
      ) : activeTab === 'deleted' ? (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-red-800">{t('admin.deletedAuPairs') || 'Deleted Au Pairs'}</h3>
             <SimpleCard noPadding className="overflow-hidden">
                <table className="w-full text-sm text-left">
                    {/* Reuse table structure or create shared component */}
                     <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                        <tr>
                        <th className="px-6 py-3 font-medium">{t('admin.auPair.columns.user')}</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredAuPairs.map(profile => (
                            <tr key={profile.id}>
                                <td className="px-6 py-4">{profile.display_name}</td>
                                <td className="px-6 py-4">{profile.profile_status}</td>
                                <td className="px-6 py-4 text-right">
                                    <Button size="sm" onClick={() => handleRestoreListing(profile.id, 'aupair')}>{t('common.restore') || 'Restore'}</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </SimpleCard>

             <h3 className="text-lg font-semibold text-red-800 mt-8">{t('admin.deletedHostFamilies') || 'Deleted Host Families'}</h3>
             <SimpleCard noPadding className="overflow-hidden">
                <table className="w-full text-sm text-left">
                     <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                        <tr>
                        <th className="px-6 py-3 font-medium">{t('hostFamily.familyName') || 'Family Name'}</th>
                        <th className="px-6 py-3 font-medium">{t('admin.auPair.columns.status')}</th>
                        <th className="px-6 py-3 font-medium text-right">{t('admin.auPair.columns.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredFamilies.map(profile => (
                            <tr key={profile.id}>
                                <td className="px-6 py-4">{profile.family_name}</td>
                                <td className="px-6 py-4">{profile.profile_status}</td>
                                <td className="px-6 py-4 text-right">
                                    <Button size="sm" onClick={() => handleRestoreListing(profile.id, 'family')}>{t('common.restore') || 'Restore'}</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </SimpleCard>
        </div>
      ) : activeTab === 'families' ? (
        <SimpleCard noPadding className="overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">{t('hostFamily.familyName') || 'Family Name'}</th>
                  <th className="px-6 py-3 font-medium">{t('admin.auPair.columns.photo')}</th>
                  <th className="px-6 py-3 font-medium">{t('admin.auPair.columns.location')}</th>
                  <th className="px-6 py-3 font-medium">{t('admin.auPair.columns.children')}</th>
                  <th className="px-6 py-3 font-medium">{t('admin.auPair.columns.status')}</th>
                  <th className="px-6 py-3 font-medium text-right">{t('admin.auPair.columns.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFamilies.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        {t('admin.auPair.noProfiles')}
                        </td>
                    </tr>
                ) : (
                    filteredFamilies.map((profile) => (
                        <tr key={profile.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-medium text-gray-900">{profile.family_name}</td>
                            <td className="px-6 py-4">
                                {profile.family_photos?.[0] || profile.home_photos?.[0] ? (
                                    <img 
                                        src={profile.family_photos?.[0] || profile.home_photos?.[0]} 
                                        alt="Family" 
                                        className="w-10 h-10 rounded-full object-cover" 
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                        <Eye size={16} />
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                                <div className="flex items-center gap-1">
                                    <MapPin size={12} />
                                    {profile.city}, {profile.country}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{profile.children_count}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                                  profile.profile_status === 'active' ? 'bg-green-100 text-green-700' : 
                                  profile.profile_status === 'banned' ? 'bg-red-100 text-red-700' :
                                  profile.profile_status === 'deleted' ? 'bg-gray-200 text-gray-600' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                {profile.profile_status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleViewProfile(profile, 'family')} title="View Profile">
                                    <Eye size={14} />
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className={profile.profile_status === 'banned' ? "text-green-600 hover:text-green-700" : "text-orange-600 hover:text-orange-700"}
                                    onClick={() => handleBanUser(profile.user_id, profile.profile_status, 'family')}
                                    title={profile.profile_status === 'banned' ? "Unban User" : "Ban User"}
                                >
                                    {profile.profile_status === 'banned' ? <CheckCircle size={14} /> : <Ban size={14} />}
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600 hover:text-red-700" 
                                    onClick={() => handleDeleteUser(profile.user_id, 'family')}
                                    title="Soft Delete User"
                                    disabled={profile.profile_status === 'deleted'}
                                >
                                    <Ban size={14} />
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600 hover:text-red-700" 
                                    onClick={() => handleDeleteListing(profile.id, 'family', profile.created_by)}
                                    title="Delete Listing"
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </td>
                    </tr>
                ))
                )}
              </tbody>
            </table>
        </SimpleCard>
      ) : null}

      {/* Detail Modals (Simplified) */}
      {selectedAuPair && (
        <Modal isOpen={!!selectedAuPair} onClose={() => setSelectedAuPair(null)} title="Au Pair Profile">
            <div className="p-6">
                <h3 className="text-lg font-bold">{selectedAuPair.display_name}</h3>
                <p className="text-gray-600 mb-4">{selectedAuPair.bio || "No bio available"}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Nationality:</strong> {selectedAuPair.nationality}</div>
                    <div><strong>Age:</strong> {selectedAuPair.age}</div>
                    <div><strong>Experience:</strong> {selectedAuPair.childcare_experience_years} years</div>
                    <div><strong>Status:</strong> {selectedAuPair.profile_status}</div>
                </div>
            </div>
        </Modal>
      )}

      {selectedFamily && (
        <Modal isOpen={!!selectedFamily} onClose={() => setSelectedFamily(null)} title="Host Family Profile">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold">{selectedFamily.family_name}</h3>
                        <p className="text-sm text-gray-500">User ID: {selectedFamily.user_id}</p>
                    </div>
                    {selectedFamily.created_by === 'admin' ? (
                        <span className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded border border-blue-100">
                            Admin Created Listing
                        </span>
                    ) : (
                        <StartConversationButton 
                            userId={selectedFamily.user_id} 
                            userName={selectedFamily.family_name} 
                            contextType="aupair" 
                            sourceContext={`Host Family: ${selectedFamily.family_name}`}
                            size="sm"
                            variant="outline"
                            label="Message"
                        />
                    )}
                </div>
                <p className="text-gray-600 mb-4">{selectedFamily.expectations || "No expectations listed"}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Location:</strong> {selectedFamily.city}, {selectedFamily.country}</div>
                    <div><strong>Children:</strong> {selectedFamily.children_count}</div>
                    <div><strong>Status:</strong> {selectedFamily.profile_status}</div>
                </div>
            </div>
        </Modal>
      )}

      {/* Onboarding Modals for Admin-Owned Listings */}
      {showAuPairOnboarding && (
        <Modal 
          isOpen={showAuPairOnboarding} 
          onClose={() => {
            setShowAuPairOnboarding(false);
            setEditingProfileId(null);
          }}
          title={editingProfileId ? t('admin.auPair.editListing') : t('admin.auPair.createListing')}
          size="xl"
        >
          <AuPairOnboarding
            mode={editingProfileId ? 'edit' : 'create'}
            onComplete={handleOnboardingComplete}
            adminMode={true}
            initialData={editingProfileId ? { profileId: editingProfileId } : undefined}
          />
        </Modal>
      )}

      {showFamilyOnboarding && (
        <Modal 
          isOpen={showFamilyOnboarding} 
          onClose={() => {
            setShowFamilyOnboarding(false);
            setEditingProfileId(null);
          }}
          title={editingProfileId ? t('admin.auPair.editListing') : t('admin.auPair.createFamilyListing')}
          size="xl"
        >
          <HostFamilyOnboarding
            mode={editingProfileId ? 'edit' : 'create'}
            onComplete={handleOnboardingComplete}
            initialData={editingProfileId ? { profileId: editingProfileId } : undefined}
          />
        </Modal>
      )}
    </div>
  );
}
