
import { Crown, AlertCircle } from 'lucide-react';

interface SubscriptionStatusProps {
  planName?: string;
  isActive: boolean;
  className?: string;
}

export function SubscriptionStatus({ planName, isActive, className = '' }: SubscriptionStatusProps) {
  if (!planName) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isActive ? (
        <>
          <Crown className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium text-gray-700">{planName}</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium text-red-600">{planName} (Inactive)</span>
        </>
      )}
    </div>
  );
}