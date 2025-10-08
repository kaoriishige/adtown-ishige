import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10', // APIバージョンを更新
});

/**
 * Stripeから顧客情報を取得する
 * @param customerId Stripeの顧客ID
 */
export async function getStripeCustomer(customerId: string) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('Error fetching Stripe customer:', error);
    return null;
  }
}

/**
 * Stripeから支払い情報を取得する（仮実装）
 * @param customerId Stripeの顧客ID
 */
export async function getPaymentInfo(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'active' });
    const hasActiveSubscription = subscriptions.data.length > 0;

    return {
      hasActiveSubscription,
    };
  } catch (error) {
    console.error('Error fetching payment info:', error);
    return null;
  }
}