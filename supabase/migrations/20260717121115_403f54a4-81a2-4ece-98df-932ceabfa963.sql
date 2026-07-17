
-- pricing_plans
CREATE TABLE public.pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free','starter','pro','enterprise')),
  description TEXT NOT NULL DEFAULT '',
  monthly_price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  yearly_price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  stripe_monthly_price_id TEXT,
  stripe_yearly_price_id TEXT,
  quotas JSONB NOT NULL DEFAULT '{}'::jsonb,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing_plans TO authenticated, anon;
GRANT ALL ON public.pricing_plans TO service_role;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON public.pricing_plans FOR SELECT USING (is_active = true);

-- subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.pricing_plans(id),
  status TEXT NOT NULL CHECK (status IN ('trialing','active','past_due','canceled','paused','incomplete')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly','yearly')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  usage JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);
CREATE INDEX idx_subs_tenant ON public.subscriptions(tenant_id);
CREATE INDEX idx_subs_status ON public.subscriptions(status);
CREATE INDEX idx_subs_stripe_customer ON public.subscriptions(stripe_customer_id);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_member_read" ON public.subscriptions FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));

-- usage_meters
CREATE TABLE public.usage_meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_usage_tenant ON public.usage_meters(tenant_id, recorded_at DESC);
CREATE INDEX idx_usage_metric ON public.usage_meters(tenant_id, metric_name, recorded_at DESC);
GRANT SELECT ON public.usage_meters TO authenticated;
GRANT ALL ON public.usage_meters TO service_role;
ALTER TABLE public.usage_meters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_member_read" ON public.usage_meters FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));

-- billing_invoices
CREATE TABLE public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT,
  amount_usd NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('draft','open','paid','void','uncollectible')),
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_tenant ON public.billing_invoices(tenant_id, created_at DESC);
CREATE INDEX idx_invoices_status ON public.billing_invoices(status);
GRANT SELECT ON public.billing_invoices TO authenticated;
GRANT ALL ON public.billing_invoices TO service_role;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_member_read" ON public.billing_invoices FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));

-- triggers
CREATE TRIGGER update_pricing_plans_updated_at BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- seed default plans
INSERT INTO public.pricing_plans (id, name, tier, description, monthly_price_usd, yearly_price_usd, quotas, features) VALUES
('free','Free','free','Perfect for trying out the platform',0,0,
  '{"maxAgents":2,"maxTeamMembers":3,"maxMemoryRecords":1000,"monthlyBudgetUSD":50,"maxStorageGB":1,"allowedModels":["gpt-4o-mini"],"allowedTools":["*"]}'::jsonb,
  '{"customRoles":false,"ssoEnabled":false,"auditLogs":false,"prioritySupport":false,"customIntegrations":false,"whiteLabel":false}'::jsonb),
('starter','Starter','starter','For small teams getting started',49,490,
  '{"maxAgents":10,"maxTeamMembers":10,"maxMemoryRecords":100000,"monthlyBudgetUSD":500,"maxStorageGB":25,"allowedModels":["gpt-4o-mini","gpt-4o"],"allowedTools":["*"]}'::jsonb,
  '{"customRoles":true,"ssoEnabled":false,"auditLogs":true,"prioritySupport":false,"customIntegrations":false,"whiteLabel":false}'::jsonb),
('pro','Pro','pro','For growing organizations',199,1990,
  '{"maxAgents":50,"maxTeamMembers":50,"maxMemoryRecords":1000000,"monthlyBudgetUSD":5000,"maxStorageGB":250,"allowedModels":["*"],"allowedTools":["*"]}'::jsonb,
  '{"customRoles":true,"ssoEnabled":true,"auditLogs":true,"prioritySupport":true,"customIntegrations":true,"whiteLabel":false}'::jsonb),
('enterprise','Enterprise','enterprise','Custom limits and dedicated support',999,9990,
  '{"maxAgents":-1,"maxTeamMembers":-1,"maxMemoryRecords":-1,"monthlyBudgetUSD":-1,"maxStorageGB":-1,"allowedModels":["*"],"allowedTools":["*"]}'::jsonb,
  '{"customRoles":true,"ssoEnabled":true,"auditLogs":true,"prioritySupport":true,"customIntegrations":true,"whiteLabel":true}'::jsonb);
