export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  currencySymbol: string;
  mode: 'subscription' | 'payment';
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_TkgFEjL1Yo2WlG',
    priceId: 'price_1SnAszHQxLtp8PvuUQpCVyPj',
    name: 'AnyiCulture Au Pair Family Premium',
    description: 'Unlimited access to verified Au Pair profiles in China. View full profiles, photos, and videos, and message Au Pairs without limits. Designed for host families seeking trusted, long-term cultural exchange.',
    price: 100.00,
    currency: 'cny',
    currencySymbol: '¥',
    mode: 'subscription'
  }
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};