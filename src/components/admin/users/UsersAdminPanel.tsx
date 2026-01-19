import React, { useState, useEffect } from 'react';
import { useI18n } from '../../../contexts/I18nContext';
import { adminService } from '../../../services/adminService';
import { AdminPageHeader } from '../ui/AdminPageHeader';
import { AdminTable } from '../ui/AdminTable';
import { StatusBadge } from '../ui/StatusBadge';
import { StartConversationButton } from '../ui/StartConversationButton';
import { Button } from '../../ui/Button';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { Search, Ban, Trash2, CheckCircle, User } from 'lucide-react';
import { Input } from '../../ui/Input';
import { useToast } from '../../ui/Toast';
import { EditUserModal } from './EditUserModal';
import { Edit2 } from 'lucide-react';

export function UsersAdminPanel() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Action states
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [confirmBanOpen, setConfirmBanOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { users: data, total } = await adminService.getAllUsers(20, page * 20);
      setUsers(data);
      setTotalUsers(total);
    } catch (error) {
      console.error('Failed to load users:', error);
      showToast('error', t('admin.users.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadUsers();
      return;
    }
    
    setLoading(true);
    try {
      const results = await adminService.searchUsers(searchQuery);
      setUsers(results);
      setTotalUsers(results.length); // Search doesn't return total count usually
    } catch (error) {
      console.error('Search failed:', error);
      showToast('error', t('admin.users.searchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    
    setProcessing(true);
    try {
      const newStatus = !selectedUser.is_banned;
      await adminService.updateUserStatus(selectedUser.id, newStatus);
      
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, is_banned: newStatus } : u
      ));
      
      showToast('success', newStatus ? t('admin.users.bannedSuccess') : t('admin.users.unbannedSuccess'));
      setConfirmBanOpen(false);
    } catch (error) {
      console.error('Failed to update user status:', error);
      showToast('error', t('admin.users.statusUpdateError'));
    } finally {
      setProcessing(false);
      setSelectedUser(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      await adminService.deleteUser(selectedUser.id);
      
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setTotalUsers(prev => prev - 1);
      
      showToast('success', t('admin.users.deleteSuccess'));
      setConfirmDeleteOpen(false);
    } catch (error) {
      console.error('Failed to delete user:', error);
      showToast('error', t('admin.users.deleteError'));
    } finally {
      setProcessing(false);
      setSelectedUser(null);
    }
  };

  const columns = [
    {
      header: t('admin.users.columns.user'),
      cell: (user: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              <User className="text-gray-400 w-5 h-5" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.full_name || t('common.unknownUser')}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      )
    },
    {
      header: t('admin.users.columns.role'),
      accessorKey: 'role',
      className: 'hidden md:table-cell',
      cell: (user: any) => (
        <span className="capitalize text-gray-600">{user.role || t('admin.users.columns.user')}</span>
      )
    },
    {
      header: t('admin.users.columns.status'),
      accessorKey: 'status',
      className: 'hidden sm:table-cell',
      cell: (user: any) => (
        <StatusBadge 
          status={user.is_banned ? 'banned' : 'active'} 
          variant={user.is_banned ? 'error' : 'success'}
        />
      )
    },
    {
      header: t('admin.users.columns.joined'),
      accessorKey: 'created_at',
      className: 'hidden lg:table-cell',
      cell: (user: any) => new Date(user.created_at).toLocaleDateString()
    }
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title={t('admin.users.title') || 'User Management'} 
        description={t('admin.users.description') || 'Manage user accounts, roles, and access.'}
      >
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder={t('admin.users.searchPlaceholder') || "Search users..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="secondary" size="sm">
            <Search size={16} />
          </Button>
        </form>
      </AdminPageHeader>

      <AdminTable
        columns={columns}
        data={users}
        loading={loading}
        actions={(user) => (
          <div className="flex justify-end gap-2">
            <StartConversationButton 
              userId={user.id}
              userName={user.full_name}
              contextType="account"
              sourceContext="User Management"
              size="sm"
              variant="ghost"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedUser(user);
                setEditModalOpen(true);
              }}
              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
              title={t('admin.users.edit')}
            >
              <Edit2 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedUser(user);
                setConfirmBanOpen(true);
              }}
              className={user.is_banned ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-orange-600 hover:text-orange-700 hover:bg-orange-50"}
              title={user.is_banned ? t('admin.actions.unban') : t('admin.actions.ban')}
            >
              {user.is_banned ? <CheckCircle size={16} /> : <Ban size={16} />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedUser(user);
                setConfirmDeleteOpen(true);
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              title={t('admin.actions.delete')}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )}
      />

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>{t('admin.users.totalCount', { count: totalUsers })}</span>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            {t('common.previous')}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={users.length < 20} // Simple check, ideally check total vs offset
            onClick={() => setPage(p => p + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      </div>

      {/* Ban Confirmation */}
      <ConfirmDialog
        isOpen={confirmBanOpen}
        onClose={() => setConfirmBanOpen(false)}
        onConfirm={handleBanUser}
        title={selectedUser?.is_banned ? t('admin.users.confirm.unbanTitle') : t('admin.users.confirm.banTitle')}
        message={selectedUser?.is_banned 
          ? t('admin.users.confirm.unbanMessage', { userName: selectedUser?.full_name }) 
          : t('admin.users.confirm.banMessage', { userName: selectedUser?.full_name })
        }
        confirmText={selectedUser?.is_banned ? t('admin.actions.unban') : t('admin.actions.ban')}
        variant={selectedUser?.is_banned ? 'success' : 'warning'}
        loading={processing}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteUser}
        title={t('admin.users.confirmDeleteTitle')}
        message={t('admin.users.confirmDeleteMessage', { name: selectedUser?.full_name })}
        confirmText={t('admin.actions.delete')}
        variant="danger"
        loading={processing}
      />

      {/* Edit User Modal */}
      <EditUserModal 
        isOpen={editModalOpen}
        onClose={() => {
            setEditModalOpen(false);
            setSelectedUser(null);
        }}
        onSuccess={() => {
            loadUsers();
            setEditModalOpen(false);
            setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
}
