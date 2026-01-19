import React from 'react';
import { AdminCard } from '../ui/AdminCard';
import { AdminPageHeader } from '../ui/AdminPageHeader';

interface PlaceholderPanelProps {
  title: string;
}

export function PlaceholderPanel({ title }: PlaceholderPanelProps) {
  return (
    <div>
      <AdminPageHeader title={title} />
      <AdminCard className="h-96 flex flex-col items-center justify-center text-gray-400">
        <div className="text-4xl mb-4">🚧</div>
        <p>This module is currently being redesigned.</p>
        <p className="text-sm mt-2">Check back soon for the new {title} experience.</p>
      </AdminCard>
    </div>
  );
}
