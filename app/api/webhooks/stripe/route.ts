import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Use service role for admin operations
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY missing for Stripe webhooks. Falling back to NEXT_PUBLIC_SUPABASE_ANON_KEY; set the service key in production.');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabaseKey) {
  throw new Error('Supabase credentials are required for Stripe webhooks.');
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  console.log('Webhook received:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    console.error('No user_id in session metadata');
    return;
  }

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const plan = getPlanFromPriceId(subscription.items.data[0]?.price.id);

  // Update user profile with subscription info
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_plan: plan,
      subscription_status: subscription.status === 'trialing' ? 'trialing' : 'active',
      subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_start_date: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }

  console.log(`User ${userId} subscribed to ${plan} plan`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const plan = getPlanFromPriceId(subscription.items.data[0]?.price.id);

  // Find user by stripe_customer_id
  const { data: profile, error: findError } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (findError || !profile) {
    console.error('User not found for customer:', customerId);
    return;
  }

  const status = mapStripeStatus(subscription.status);

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({
      subscription_plan: plan,
      subscription_status: status,
      subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('user_id', profile.user_id);

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

  console.log(`Subscription updated for user ${profile.user_id}: ${plan} (${status})`);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) return;

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({
      subscription_status: 'canceled',
      subscription_plan: 'free',
    })
    .eq('user_id', profile.user_id);

  if (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }

  console.log(`Subscription canceled for user ${profile.user_id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) return;

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({
      subscription_status: 'past_due',
    })
    .eq('user_id', profile.user_id);

  if (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }

  console.log(`Payment failed for user ${profile.user_id}`);
}

function getPlanFromPriceId(priceId: string): 'free' | 'premium' | 'pro' {
  const premiumPriceIds = [
    process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
  ];
  const proPriceIds = [
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  ];

  if (premiumPriceIds.includes(priceId)) return 'premium';
  if (proPriceIds.includes(priceId)) return 'pro';
  return 'free';
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'inactive';
  }
}
