import React, { useState, useEffect } from 'react';
import { useI18n } from '../../../contexts/I18nContext';
import { adminService } from '../../../services/adminService';
import { AdminPageHeader } from '../ui/AdminPageHeader';
import { AdminTable } from '../ui/AdminTable';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../../ui/Button';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { Search, Trash2, Eye, CheckCircle, XCircle, ShoppingBag } from 'lucide-react';
import { Input } from '../../ui/Input';
import { useToast } from '../../ui/Toast';

export function MarketplaceAdminPanel() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  
  // Action states
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadItems();
  }, [page]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data, total } = await adminService.getMarketplaceItems(20, page * 20);
      setItems(data);
      setTotalItems(total);
    } catch (error) {
      console.error('Failed to load marketplace items:', error);
      showToast('error', t('admin.marketplace.loadError') || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadItems();
      return;
    }
    
    setLoading(true);
    try {
      console.warn('Search not fully implemented for marketplace yet');
      loadItems();
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedItem) return;
    
    setProcessing(true);
    try {
      const newStatus = selectedItem.status === 'active' ? 'sold' : 'active';
      await adminService.updateStatus('marketplace_items', selectedItem.id, newStatus);
      
      setItems(items.map(i => 
        i.id === selectedItem.id ? { ...i, status: newStatus } : i
      ));
      
      showToast('success', t('admin.marketplace.statusUpdateSuccess') || 'Item status updated');
      setConfirmStatusOpen(false);
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast('error', t('admin.marketplace.statusUpdateError') || 'Failed to update status');
    } finally {
      setProcessing(false);
      setSelectedItem(null);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    setProcessing(true);
    try {
      await adminService.deleteItem('marketplace_items', selectedItem.id);
      
      setItems(items.filter(i => i.id !== selectedItem.id));
      setTotalItems(prev => prev - 1);
      
      showToast('success', t('admin.marketplace.deleteSuccess') || 'Item deleted');
      setConfirmDeleteOpen(false);
    } catch (error) {
      console.error('Failed to delete item:', error);
      showToast('error', t('admin.marketplace.deleteError') || 'Failed to delete item');
    } finally {
      setProcessing(false);
      setSelectedItem(null);
    }
  };

  const columns = [
    {
      header: t('admin.marketplace.columns.item') || 'Item',
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 overflow-hidden">
            {item.images && item.images[0] ? (
              <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <ShoppingBag size={20} />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.title}</p>
            <p className="text-xs text-gray-500">{item.seller?.full_name || 'Unknown Seller'}</p>
          </div>
        </div>
      )
    },
    {
      header: t('admin.marketplace.columns.price') || 'Price',
      accessorKey: 'price',
      className: 'hidden md:table-cell',
      cell: (item: any) => (
        <span className="text-gray-900 font-medium">
          {item.currency} {item.price}
        </span>
      )
    },
    {
      header: t('admin.marketplace.columns.status') || 'Status',
      accessorKey: 'status',
      cell: (item: any) => (
        <StatusBadge 
          status={item.status} 
          variant={item.status === 'active' ? 'success' : item.status === 'sold' ? 'default' : 'warning'}
        />
      )
    },
    {
      header: t('admin.marketplace.columns.posted') || 'Posted',
      accessorKey: 'created_at',
      className: 'hidden lg:table-cell',
      cell: (item: any) => new Date(item.created_at).toLocaleDateString()
    }
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title={t('admin.marketplace.title') || 'Marketplace Listings'} 
        description={t('admin.marketplace.description') || 'Manage marketplace items and sales.'}
      >
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder={t('admin.marketplace.searchPlaceholder') || "Search items..."}
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
        data={items}
        loading={loading}
        actions={(item) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/marketplace/${item.id}`, '_blank')}
              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
              title={t('common.view')}
            >
              <Eye size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedItem(item);
                setConfirmStatusOpen(true);
              }}
              className={item.status === 'active' ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
              title={item.status === 'active' ? t('admin.actions.markSold') : t('admin.actions.activate')}
            >
              {item.status === 'active' ? <CheckCircle size={16} /> : <CheckCircle size={16} />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedItem(item);
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
        <span>{t('admin.common.totalCount', { count: totalItems }) || `Total: ${totalItems}`}</span>
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
            disabled={items.length < 20}
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
        title={selectedItem?.status === 'active' ? (t('admin.marketplace.confirmSoldTitle') || 'Mark as Sold?') : (t('admin.marketplace.confirmActivateTitle') || 'Activate Item?')}
        message={selectedItem?.status === 'active' 
          ? (t('admin.marketplace.confirmSoldMessage') || 'Are you sure you want to mark this item as sold?') 
          : (t('admin.marketplace.confirmActivateMessage') || 'Are you sure you want to activate this item?')
        }
        confirmText={selectedItem?.status === 'active' ? (t('admin.actions.markSold') || 'Mark Sold') : (t('admin.actions.activate') || 'Activate')}
        variant={selectedItem?.status === 'active' ? 'warning' : 'success'}
        loading={processing}
      />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteItem}
        title={t('admin.marketplace.confirmDeleteTitle') || 'Delete Item?'}
        message={t('admin.marketplace.confirmDeleteMessage') || 'Are you sure you want to delete this item? This action cannot be undone.'}
        confirmText={t('admin.actions.delete')}
        variant="danger"
        loading={processing}
      />
    </div>
  );
}
