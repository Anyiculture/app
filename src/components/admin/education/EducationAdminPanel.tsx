import React, { useState, useEffect } from 'react';
import { useI18n } from '../../../contexts/I18nContext';
import { adminService } from '../../../services/adminService';
import { AdminPageHeader } from '../ui/AdminPageHeader';
import { AdminTable } from '../ui/AdminTable';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../../ui/Button';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { Search, Trash2, Eye, CheckCircle, XCircle, GraduationCap } from 'lucide-react';
import { Input } from '../../ui/Input';
import { useToast } from '../../ui/Toast';
import { Modal } from '../../ui/Modal';
import { EducationDetailView } from '../../education/EducationDetailView';


export function EducationAdminPanel() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalResources, setTotalResources] = useState(0);
  
  // Action states
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [viewResource, setViewResource] = useState<any>(null);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadResources();
  }, [page]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const { data, total } = await adminService.getEducationResources(20, page * 20);
      setResources(data);
      setTotalResources(total);
    } catch (error) {
      console.error('Failed to load education resources:', error);
      showToast('error', t('admin.education.loadError') || 'Failed to load education resources');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadResources();
      return;
    }
    
    setLoading(true);
    try {
      console.warn('Search not fully implemented for education yet');
      loadResources();
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedResource) return;
    
    setProcessing(true);
    try {
      const newStatus = selectedResource.status === 'active' ? 'inactive' : 'active';
      await adminService.updateEducationProgramStatus(selectedResource.id, newStatus);
      
      setResources(resources.map(r => 
        r.id === selectedResource.id ? { ...r, status: newStatus } : r
      ));
      
      showToast('success', t('admin.education.statusUpdateSuccess') || 'Status updated');
      setConfirmStatusOpen(false);
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast('error', t('admin.education.statusUpdateError') || 'Failed to update status');
    } finally {
      setProcessing(false);
      setSelectedResource(null);
    }
  };

  const handleDeleteResource = async () => {
    if (!selectedResource) return;

    setProcessing(true);
    try {
      await adminService.deleteEducationProgram(selectedResource.id);
      
      setResources(resources.filter(r => r.id !== selectedResource.id));
      setTotalResources(prev => prev - 1);
      
      showToast('success', t('admin.education.deleteSuccess') || 'Resource deleted');
      setConfirmDeleteOpen(false);
    } catch (error) {
      console.error('Failed to delete resource:', error);
      showToast('error', t('admin.education.deleteError') || 'Failed to delete resource');
    } finally {
      setProcessing(false);
      setSelectedResource(null);
    }
  };

  const columns = [
    {
      header: t('admin.education.columns.program') || 'Program',
      cell: (resource: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{resource.program_name}</p>
            <p className="text-xs text-gray-500">{resource.institution_name}</p>
          </div>
        </div>
      )
    },
    {
      header: t('admin.education.columns.image') || 'Image',
      cell: (resource: any) => (
        resource.image_url ? (
          <img src={resource.image_url} alt={resource.program_name} className="h-10 w-10 object-cover rounded" />
        ) : (
          <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
            <GraduationCap size={20} />
          </div>
        )
      )
    },
    {
      header: t('admin.education.columns.location') || 'Location',
      accessorKey: 'location',
      className: 'hidden md:table-cell',
      cell: (resource: any) => (
        <span className="text-gray-600">{resource.city}, {resource.country}</span>
      )
    },
    {
      header: t('admin.education.columns.status') || 'Status',
      accessorKey: 'status',
      cell: (resource: any) => (
        <StatusBadge 
          status={resource.status} 
          variant={resource.status === 'active' ? 'success' : 'default'}
        />
      )
    },
    {
      header: t('admin.education.columns.posted') || 'Posted',
      accessorKey: 'created_at',
      className: 'hidden lg:table-cell',
      cell: (resource: any) => new Date(resource.created_at).toLocaleDateString()
    }
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title={t('admin.education.title') || 'Education Programs'} 
        description={t('admin.education.description') || 'Manage education resources and programs.'}
      >
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder={t('admin.education.searchPlaceholder') || "Search programs..."}
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
        data={resources}
        loading={loading}
        actions={(resource) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewResource(resource)}
              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
              title={t('common.view')}
            >
              <Eye size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedResource(resource);
                setConfirmStatusOpen(true);
              }}
              className={resource.status === 'active' ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
              title={resource.status === 'active' ? t('admin.actions.deactivate') : t('admin.actions.activate')}
            >
              {resource.status === 'active' ? <XCircle size={16} /> : <CheckCircle size={16} />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedResource(resource);
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
        <span>{t('admin.common.totalCount', { count: totalResources }) || `Total: ${totalResources}`}</span>
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
            disabled={resources.length < 20}
            onClick={() => setPage(p => p + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmStatusOpen}
        onClose={() => setConfirmStatusOpen(false)}
        onConfirm={handleStatusChange}
        title={selectedResource?.status === 'active' ? (t('admin.education.confirmDeactivateTitle') || 'Deactivate Program?') : (t('admin.education.confirmActivateTitle') || 'Activate Program?')}
        message={selectedResource?.status === 'active' 
          ? (t('admin.education.confirmDeactivateMessage') || 'Are you sure you want to deactivate this program?') 
          : (t('admin.education.confirmActivateMessage') || 'Are you sure you want to activate this program?')
        }
        confirmText={selectedResource?.status === 'active' ? (t('admin.actions.deactivate') || 'Deactivate') : (t('admin.actions.activate') || 'Activate')}
        variant={selectedResource?.status === 'active' ? 'warning' : 'success'}
        loading={processing}
      />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteResource}
        title={t('admin.education.confirmDeleteTitle') || 'Delete Program?'}
        message={t('admin.education.confirmDeleteMessage') || 'Are you sure you want to delete this program? This action cannot be undone.'}
        confirmText={t('admin.actions.delete')}
        variant="danger"
        loading={processing}
      />

       {viewResource && (
        <Modal
          isOpen={!!viewResource}
          onClose={() => setViewResource(null)}
          title={t('admin.education.programDetails') || 'Program Details'}
          size="xl"
        >
          <div className="max-h-[80vh] overflow-y-auto p-4">
            <EducationDetailView
              program={viewResource}
              isOwner={false}
              isFavorited={false}
              hasInterest={false}
              onToggleFavorite={() => {}}
              onContact={() => {}}
              onApply={() => {}}
              onEdit={() => {}}
              isAuthenticated={true}
              onSignIn={() => {}}
              isAdminView={true}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
