import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { auPairService, AuPairProfile, HostFamilyProfile } from '../../services/auPairService';
import { StartConversationButton } from './ui/StartConversationButton';
import { Button, Modal } from '../ui';
import { Search, Eye, MapPin, Trash2, Ban, CheckCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';

const SimpleCard = ({ children, className = "", noPadding = false }: { children: React.ReactNode, className?: string, noPadding?: boolean }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${noPadding ? '' : 'p-6'} ${className}`}>
    {children}
  </div>
);

export function AuPairAdminPanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'au_pairs' | 'families'>('au_pairs');
  const [auPairs, setAuPairs] = useState<AuPairProfile[]>([]);
  const [families, setFamilies] = useState<HostFamilyProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuPair, setSelectedAuPair] = useState<AuPairProfile | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<HostFamilyProfile | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'au_pairs') {
        const data = await auPairService.getAdminAuPairProfiles();
        setAuPairs(data);
      } else {
        const data = await auPairService.getAdminHostFamilyProfiles();
        setFamilies(data);
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
  const filteredAuPairs = auPairs.filter(p => 
    p.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nationality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFamilies = families.filter(f => 
    f.family_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewProfile = (profile: AuPairProfile | HostFamilyProfile, type: 'aupair' | 'family') => {
    // Navigate to the public profile view for this user
    // Au Pair profiles use /au-pair/profile/:id
    // Host Family profiles use /host-family/profile/:id
    const route = type === 'aupair' ? `/au-pair/profile/${profile.id}` : `/host-family/profile/${profile.id}`;
    window.open(route, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t('admin.auPair.management')}</h2>
        <div className="flex gap-4">
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
                    Au Pairs
                </button>
                <button
                    onClick={() => setActiveTab('families')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'families' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Families
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
                  <th className="px-6 py-3 font-medium">Photo</th>
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
                            <StartConversationButton 
                                userId={profile.user_id} 
                                userName={profile.display_name} 
                                contextType="aupair" 
                                sourceContext={`Au Pair Profile: ${profile.display_name}`}
                                size="sm"
                                variant="ghost"
                                className="text-gray-500 hover:text-blue-600"
                            />
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
      ) : (
        <SimpleCard noPadding className="overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Family Name</th>
                  <th className="px-6 py-3 font-medium">Photo</th>
                  <th className="px-6 py-3 font-medium">Location</th>
                  <th className="px-6 py-3 font-medium">Children</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFamilies.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No profiles found.
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
      )}

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
                    <StartConversationButton 
                        userId={selectedFamily.user_id} 
                        userName={selectedFamily.family_name} 
                        contextType="aupair" 
                        sourceContext={`Host Family: ${selectedFamily.family_name}`}
                        size="sm"
                        variant="outline"
                        label="Message"
                    />
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
    </div>
  );
}
