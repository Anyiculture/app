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
    <AdminCard className={cn(
      "relative overflow-hidden border-0 shadow-lg group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5",
      "bg-gradient-to-br text-white ring-1 ring-white/20",
      gradient || "from-blue-600 to-indigo-700",
      className
    )}
    // Force override white background
    style={{ backgroundColor: 'transparent' }}
    >
      {/* Dark Overlay for Contrast - Critical for light gradients like Amber/Cyan */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500 z-0" />

      {/* Decorative Glass Overlay / Grain */}
      <div className="absolute inset-0 bg-white/[0.05] backdrop-blur-[1px] z-0" />
      
      {/* Abstract Shapes for Depth */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-black/10 rounded-full blur-2xl" />

      {/* Large Decorative Icon Background */}
      <div className="absolute -bottom-4 -right-4 rotate-[-15deg] opacity-10 group-hover:opacity-20 group-hover:rotate-0 group-hover:scale-110 transition-all duration-700 ease-out z-0">
         {React.cloneElement(icon as React.ReactElement, { size: 120, strokeWidth: 1.5 })}
      </div>

      <div className="relative z-10 p-2">
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)] group-hover:bg-white/25 transition-all duration-300">
            {React.cloneElement(icon as React.ReactElement, { size: 24, className: "text-white drop-shadow-md" })}
          </div>
          
          {trend && (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border shadow-sm",
              trend.isPositive 
                ? "bg-emerald-400/30 border-emerald-400/40 text-emerald-50 shadow-[0_0_10px_rgba(52,211,153,0.3)]" 
                : "bg-rose-400/30 border-rose-400/40 text-rose-50 shadow-[0_0_10px_rgba(251,113,133,0.3)]"
            )}>
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-4xl font-black tracking-tight mb-1 text-white drop-shadow-lg group-hover:scale-105 transition-transform origin-left duration-300">
            {value}
          </h3>
          <p className="text-sm font-bold text-white/90 uppercase tracking-widest drop-shadow-md">{title}</p>
        </div>
      </div>
    </AdminCard>
  );
}
