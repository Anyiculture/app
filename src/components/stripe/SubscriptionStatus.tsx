import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { STRIPE_PRODUCTS } from '../../stripe-config';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface Subscription {
  subscription_status: string;
  price_id: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
}

export function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('subscription_status, price_id, current_period_end, cancel_at_period_end')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscription || subscription.subscription_status === 'not_started') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800">No active subscription</span>
        </div>
      </div>
    );
  }

  const product = STRIPE_PRODUCTS.find(p => p.priceId === subscription.price_id);
  const isActive = subscription.subscription_status === 'active';
  const endDate = subscription.current_period_end 
    ? new Date(subscription.current_period_end * 1000).toLocaleDateString()
    : null;

  return (
    <div className={`rounded-lg shadow p-6 ${isActive ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
      <div className="flex items-center mb-2">
        {isActive ? (
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600 mr-2" />
        )}
        <h3 className={`font-semibold ${isActive ? 'text-green-800' : 'text-red-800'}`}>
          {product?.name || 'Subscription'}
        </h3>
      </div>
      <p className={`text-sm ${isActive ? 'text-green-700' : 'text-red-700'}`}>
        Status: {subscription.subscription_status}
      </p>
      {endDate && (
        <p className={`text-sm ${isActive ? 'text-green-700' : 'text-red-700'}`}>
          {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on: {endDate}
        </p>
      )}
    </div>
  );
}