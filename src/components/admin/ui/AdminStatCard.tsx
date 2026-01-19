import React from 'react';
import { AdminCard } from './AdminCard';
import { cn } from '../../../lib/utils';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  gradient?: string;
}

export function AdminStatCard({ title, value, icon, trend, className, gradient }: AdminStatCardProps) {
  return (
    <AdminCard className={cn("relative overflow-hidden border-none", className)}>
      {/* Background Gradient */}
      <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", gradient || "from-blue-500 to-indigo-600")} />
      
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
              <span className="text-gray-400">from last month</span>
            </div>
          )}
        </div>
        
        <div className={cn("p-3 rounded-xl bg-gradient-to-br shadow-lg text-white", gradient || "from-blue-500 to-indigo-600")}>
          {icon}
        </div>
      </div>
    </AdminCard>
  );
}
