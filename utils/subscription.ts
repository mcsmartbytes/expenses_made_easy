import { createClient } from '@/utils/supabase';

export interface SubscriptionInfo {
  plan: 'free' | 'premium' | 'pro';
  status: 'inactive' | 'active' | 'trialing' | 'past_due' | 'canceled';
  isPaidUser: boolean;
  isPremium: boolean;
  isPro: boolean;
}

export async function getSubscription(userId: string): Promise<SubscriptionInfo> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_plan, subscription_status')
    .eq('id', userId)
    .single();

  const plan = (profile?.subscription_plan || 'free') as 'free' | 'premium' | 'pro';
  const status = (profile?.subscription_status || 'inactive') as SubscriptionInfo['status'];

  return {
    plan,
    status,
    isPaidUser: status === 'active' || status === 'trialing',
    isPremium: plan === 'premium' && (status === 'active' || status === 'trialing'),
    isPro: plan === 'pro' && (status === 'active' || status === 'trialing'),
  };
}

export async function canAddExpense(userId: string): Promise<{ allowed: boolean; message?: string }> {
  const subscription = await getSubscription(userId);
  if (subscription.isPaidUser) return { allowed: true };

  const supabase = createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('expenses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('date', startOfMonth.toISOString());

  if ((count || 0) >= 50) {
    return {
      allowed: false,
      message: "You've reached your limit of 50 expenses this month. Upgrade to Premium for unlimited!"
    };
  }
  return { allowed: true };
}
