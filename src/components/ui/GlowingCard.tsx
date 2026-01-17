
import { ArrowRight, LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useI18n } from '../../contexts/I18nContext';

interface GlowingCardProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  features?: string[];
  color?: string; // used for icon bg
  className?: string;
}

export function GlowingCard({ title, icon: Icon, description, features, color, className }: GlowingCardProps) {
  const { t } = useI18n();
  // Convert bg-color-500 to border-color-500/etc
  const borderColor = color?.replace('bg-', 'border-') || 'border-gray-200';
  const textColor = color?.replace('bg-', 'text-') || 'text-gray-900';
  const shadowColor = color?.replace('bg-', 'shadow-') || 'shadow-gray-200';

  return (
    <div className={cn("relative group w-full h-full perspective-500", className)}>
      {/* 1. Permanent Colorful Border (always visible, gets brighter on hover) */}
      <div className={cn("absolute inset-0 rounded-[22px] border-2 transition-all duration-300", borderColor, "border-opacity-30 group-hover:border-opacity-100 group-hover:shadow-[0_0_30px_rgba(0,0,0,0.15)]", shadowColor)} />
      
      {/* 2. Soft Gradient Background - Not Just White */}
      <div className="absolute inset-[2px] rounded-[20px] bg-gradient-to-br from-white/95 via-white/80 to-white/60 backdrop-blur-xl transition-all duration-300 group-hover:bg-white/90" />
      
      {/* 3. Decorative Corner Pattern */}
      <div className={cn("absolute top-[2px] right-[2px] w-20 h-20 rounded-tr-[20px] rounded-bl-[40px] opacity-10 transition-all duration-500 group-hover:scale-110", color)} />

      {/* Main Content */}
      <div className="relative w-full h-full flex flex-col justify-end p-4 sm:p-6 gap-3 sm:gap-4 z-10 transition-transform duration-300 group-hover:-translate-y-1">
         
         {/* Icon with Glowing Background */}
         <div className={cn("mb-auto p-2 sm:p-3.5 rounded-xl sm:rounded-2xl w-fit transition-all duration-300 shadow-sm group-hover:scale-110 group-hover:rotate-3", color, "bg-opacity-15", textColor)}>
            <div className={cn("absolute inset-0 rounded-xl sm:rounded-2xl opacity-20 blur-md group-hover:opacity-40 transition-opacity", color)} />
            <Icon className="h-6 w-6 sm:h-8 sm:w-8 relative z-10" />
         </div>

         <div className="relative">
            <h3 className={cn("text-lg sm:text-2xl font-bold capitalize transition-colors duration-300 font-display", "text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r", color?.replace('bg-', 'from-').replace('500', '600'), "to-vibrant-purple")}>
              {title}
            </h3>
            {description && <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1 sm:mt-2 line-clamp-2 leading-relaxed group-hover:text-gray-900 transition-colors">{description}</p>}
            
            {/* Features List */}
            {features && features.length > 0 && (
               <ul className="mt-2 sm:mt-4 space-y-1 sm:space-y-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  {features.map((feature, i) => (
                     <li key={i} className="flex items-center text-[10px] sm:text-xs text-gray-500 font-semibold group-hover:text-gray-700 transition-colors">
                        <div className={cn("w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full mr-1.5 sm:mr-2 shrink-0", color)} />
                        {feature}
                     </li>
                  ))}
               </ul>
            )}
         </div>

         {/* CTA Link */}
          <div className={cn("flex items-center text-xs sm:text-sm font-bold mt-1 sm:mt-2 opacity-50 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0", textColor)}>
             {t('common.explore')} <div className={cn("ml-1.5 sm:ml-2 p-1 rounded-full transition-colors", color, "bg-opacity-20")}><ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" /></div>
          </div>
      </div>
    </div>
  );
}
