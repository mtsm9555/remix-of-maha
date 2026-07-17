
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS scopes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allowed_endpoints TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allowed_departments TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rate_limit_per_day INTEGER NOT NULL DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS ip_allowlist TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ip_blocklist TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_used_ip TEXT,
  ADD COLUMN IF NOT EXISTS total_requests BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requests_today INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requests_this_month INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_by TEXT,
  ADD COLUMN IF NOT EXISTS revocation_reason TEXT,
  ADD COLUMN IF NOT EXISTS rotation_policy JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_api_keys_status ON public.api_keys(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires ON public.api_keys(expires_at) WHERE expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.api_key_usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id TEXT NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  response_status INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT
);
CREATE INDEX IF NOT EXISTS idx_usage_api_key ON public.api_key_usage_records(api_key_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_tenant ON public.api_key_usage_records(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_endpoint ON public.api_key_usage_records(endpoint, timestamp DESC);
GRANT SELECT ON public.api_key_usage_records TO authenticated;
GRANT ALL ON public.api_key_usage_records TO service_role;
ALTER TABLE public.api_key_usage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read tenant api key usage" ON public.api_key_usage_records FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.api_key_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id TEXT NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_api_key ON public.api_key_audit_logs(api_key_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON public.api_key_audit_logs(tenant_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.api_key_audit_logs(action, performed_at DESC);
GRANT SELECT ON public.api_key_audit_logs TO authenticated;
GRANT ALL ON public.api_key_audit_logs TO service_role;
ALTER TABLE public.api_key_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read tenant api key audit" ON public.api_key_audit_logs FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
