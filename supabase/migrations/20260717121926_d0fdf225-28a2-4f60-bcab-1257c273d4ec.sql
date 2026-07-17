
-- Extend billing_invoices
ALTER TABLE public.billing_invoices
  ADD COLUMN IF NOT EXISTS subtotal_usd NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_usd NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_usd NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_paid_usd NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_remaining_usd NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS invoice_date TIMESTAMPTZ NOT NULL DEFAULT now();

-- Payments
CREATE TABLE IF NOT EXISTS public.billing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.billing_invoices(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  amount_usd NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending','processing','succeeded','failed','refunded','partially_refunded')),
  payment_method JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_billing_payments_tenant ON public.billing_payments(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_payments_invoice ON public.billing_payments(invoice_id);
GRANT SELECT ON public.billing_payments TO authenticated;
GRANT ALL ON public.billing_payments TO service_role;
ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read tenant payments" ON public.billing_payments FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

-- Credits
CREATE TABLE IF NOT EXISTS public.billing_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount_usd NUMERIC NOT NULL,
  remaining_usd NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('available','applied','expired')),
  reason TEXT NOT NULL,
  issued_by TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_billing_credits_tenant ON public.billing_credits(tenant_id, status);
GRANT SELECT ON public.billing_credits TO authenticated;
GRANT ALL ON public.billing_credits TO service_role;
ALTER TABLE public.billing_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read tenant credits" ON public.billing_credits FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

-- Refunds
CREATE TABLE IF NOT EXISTS public.billing_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.billing_payments(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  stripe_refund_id TEXT,
  amount_usd NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending','succeeded','failed')),
  reason TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  processed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_billing_refunds_tenant ON public.billing_refunds(tenant_id, created_at DESC);
GRANT SELECT ON public.billing_refunds TO authenticated;
GRANT ALL ON public.billing_refunds TO service_role;
ALTER TABLE public.billing_refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read tenant refunds" ON public.billing_refunds FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

-- Billing events (audit)
CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  invoice_id UUID,
  payment_id UUID,
  amount_usd NUMERIC,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_billing_events_tenant ON public.billing_events(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON public.billing_events(event_type, timestamp DESC);
GRANT SELECT ON public.billing_events TO authenticated;
GRANT ALL ON public.billing_events TO service_role;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read tenant billing events" ON public.billing_events FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

-- Dunning attempts
CREATE TABLE IF NOT EXISTS public.billing_dunning_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.billing_invoices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','sent','failed')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  result TEXT
);
CREATE INDEX IF NOT EXISTS idx_billing_dunning_scheduled ON public.billing_dunning_attempts(scheduled_at, status);
GRANT SELECT ON public.billing_dunning_attempts TO authenticated;
GRANT ALL ON public.billing_dunning_attempts TO service_role;
ALTER TABLE public.billing_dunning_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read tenant dunning" ON public.billing_dunning_attempts FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
