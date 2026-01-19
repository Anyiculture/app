import React from 'react';
import { cn } from '../../../lib/utils';

interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function AdminCard({ children, className, noPadding = false, ...props }: AdminCardProps) {
  return (
    <div 
      className={cn(
        "bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200",
        !noPadding && "p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
