
import { cn } from '../../../lib/utils';
import { useI18n } from '../../../contexts/I18nContext';

export type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'blue' | 'purple';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
  label?: string; // Optional custom label override
}

export function StatusBadge({ status, variant, className, label }: StatusBadgeProps) {
  const { t } = useI18n();

  // Auto-detect variant if not provided based on common status strings
  const detectVariant = (s: string): StatusVariant => {
    const lower = s.toLowerCase();
    if (['active', 'approved', 'completed', 'paid', 'published', 'verified'].includes(lower)) return 'success';
    if (['pending', 'review', 'in_review', 'waiting', 'draft'].includes(lower)) return 'warning';
    if (['rejected', 'banned', 'deleted', 'cancelled', 'failed', 'suspended'].includes(lower)) return 'error';
    if (['new', 'info'].includes(lower)) return 'blue';
    return 'neutral';
  };

  const finalVariant = variant || detectVariant(status);
  const displayLabel = label || t(`status.${status.toLowerCase()}`) || status;

  const variants = {
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    neutral: "bg-gray-50 text-gray-600 border-gray-200",
    default: "bg-gray-50 text-gray-600 border-gray-200"
  };

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-xs font-medium border",
      variants[finalVariant],
      className
    )}>
      {displayLabel}
    </span>
  );
}
