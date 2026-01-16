import { useState } from 'react';
import { Crown, Check, Loader2 } from 'lucide-react';
import { StripeProduct } from '../stripe-config';

interface SubscriptionCardProps {
  product: StripeProduct;
  isCurrentPlan?: boolean;
  onSubscribe: (priceId: string) => Promise<void>;
}

export function SubscriptionCard({ product, isCurrentPlan = false, onSubscribe }: SubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (isCurrentPlan) return;
    
    setIsLoading(true);
    try {
      await onSubscribe(product.priceId);
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative rounded-lg border-2 p-6 ${
      isCurrentPlan 
        ? 'border-green-500 bg-green-50' 
        : 'border-gray-200 bg-white hover:border-indigo-300'
    } transition-colors`}>
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Current Plan
          </span>
        </div>
      )}
      
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Crown className="h-8 w-8 text-indigo-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {product.name}
        </h3>
        
        <div className="mb-4">
          <span className="text-3xl font-bold text-gray-900">
            {product.currencySymbol}{product.price}
          </span>
          <span className="text-gray-600 ml-1">/month</span>
        </div>
        
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          {product.description}
        </p>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-gray-700">
            <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
            <span>Unlimited access to Au Pair profiles</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
            <span>View full profiles, photos, and videos</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
            <span>Message Au Pairs without limits</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
            <span>Verified profiles only</span>
          </div>
        </div>
        
        <button
          onClick={handleSubscribe}
          disabled={isCurrentPlan || isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isCurrentPlan
              ? 'bg-green-100 text-green-700 cursor-not-allowed'
              : isLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </div>
          ) : isCurrentPlan ? (
            'Active'
          ) : (
            'Subscribe Now'
          )}
        </button>
      </div>
    </div>
  );
}