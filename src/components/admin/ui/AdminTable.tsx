import React from 'react';
import { cn } from '../../../lib/utils';
import { AdminCard } from './AdminCard';
import { Loading } from '../../ui/Loading';

interface AdminTableProps<T> {
  columns: {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string;
  }[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  actions?: (item: T) => React.ReactNode;
}

export function AdminTable<T>({ 
  columns, 
  data, 
  loading, 
  onRowClick, 
  emptyMessage = "No data found",
  actions 
}: AdminTableProps<T>) {
  
  if (loading) {
    return (
      <AdminCard className="flex items-center justify-center min-h-[200px]">
        <Loading />
      </AdminCard>
    );
  }

  return (
    <AdminCard noPadding className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {columns.map((col, i) => (
              <th 
                key={i} 
                className={cn(
                  "px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs", 
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
            {actions && <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.length > 0 ? (
            data.map((item, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={cn(
                  "hover:bg-gray-50/50 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 text-gray-700 whitespace-nowrap">
                    {col.cell ? col.cell(item) : (item as any)[col.accessorKey as string]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {actions(item)}
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </AdminCard>
  );
}
