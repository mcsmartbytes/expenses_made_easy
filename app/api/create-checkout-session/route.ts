import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthenticatedUser } from '@/utils/apiAuth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return authError;

  try {
    const { plan, interval, email } = await req.json();

    const priceIds: Record<string, string> = {
      'premium-month': process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID!,
      'premium-year': process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID!,
      'pro-month': process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
      'pro-year': process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
    };

    const priceId = priceIds[`${plan}-${interval}`];

    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?plan=${plan}`,
      customer_email: email,
      metadata: {
        user_id: user!.id,
        plan: plan,
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          user_id: user!.id,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
