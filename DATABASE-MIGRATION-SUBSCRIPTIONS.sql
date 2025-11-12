ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;

ALTER TABLE user_profiles
ADD CONSTRAINT check_subscription_plan CHECK (subscription_plan IN ('free', 'premium', 'pro'));
ALTER TABLE user_profiles
ADD CONSTRAINT check_subscription_status CHECK (subscription_status IN ('inactive', 'active', 'trialing', 'past_due', 'canceled'));

CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_plan ON user_profiles(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);

CREATE OR REPLACE FUNCTION is_paid_user(user_id UUID) RETURNS BOOLEAN AS \$\$
BEGIN
  RETURN EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND subscription_status = 'active' AND subscription_plan IN ('premium', 'pro'));
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_paid_user(UUID) TO authenticated;
UPDATE user_profiles SET subscription_plan = 'free', subscription_status = 'inactive' WHERE subscription_plan IS NULL;
