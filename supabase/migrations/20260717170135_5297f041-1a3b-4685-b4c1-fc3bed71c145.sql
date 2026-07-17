
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id TEXT,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','error','critical')),
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user','agent','system','api_key')),
  actor_email TEXT,
  actor_name TEXT,
  target_type TEXT,
  target_id TEXT,
  target_name TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  session_id TEXT,
  correlation_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_time ON public.audit_logs(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(tenant_id, event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(tenant_id, actor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(tenant_id, target_type, target_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(tenant_id, severity, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip ON public.audit_logs(tenant_id, ip_address, timestamp DESC);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.audit_alerts (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','error','critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  related_event_ids TEXT[] NOT NULL DEFAULT '{}',
  event_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('active','acknowledged','resolved','false_positive')),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_tenant ON public.audit_alerts(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_severity ON public.audit_alerts(tenant_id, severity, created_at DESC);
GRANT SELECT ON public.audit_alerts TO authenticated;
GRANT ALL ON public.audit_alerts TO service_role;
ALTER TABLE public.audit_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view audit alerts" ON public.audit_alerts FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.audit_exports (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('csv','json','pdf')),
  query JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','processing','completed','failed')),
  progress INTEGER NOT NULL DEFAULT 0,
  file_url TEXT,
  file_content TEXT,
  file_size_bytes BIGINT,
  event_count INTEGER,
  expires_at TIMESTAMPTZ NOT NULL,
  downloaded_at TIMESTAMPTZ,
  downloaded_by TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_audit_exports_tenant ON public.audit_exports(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_exports_status ON public.audit_exports(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_exports_expires ON public.audit_exports(expires_at);
GRANT SELECT ON public.audit_exports TO authenticated;
GRANT ALL ON public.audit_exports TO service_role;
ALTER TABLE public.audit_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view audit exports" ON public.audit_exports FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.audit_retention (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  retention_days INTEGER NOT NULL DEFAULT 365,
  archive_after_days INTEGER NOT NULL DEFAULT 90,
  total_events BIGINT NOT NULL DEFAULT 0,
  oldest_event_date TIMESTAMPTZ,
  newest_event_date TIMESTAMPTZ,
  storage_used_bytes BIGINT NOT NULL DEFAULT 0,
  archived_storage_bytes BIGINT NOT NULL DEFAULT 0,
  last_cleanup_at TIMESTAMPTZ,
  next_cleanup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT ON public.audit_retention TO authenticated;
GRANT ALL ON public.audit_retention TO service_role;
ALTER TABLE public.audit_retention ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view audit retention" ON public.audit_retention FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.audit_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_audit_alerts_updated BEFORE UPDATE ON public.audit_alerts FOR EACH ROW EXECUTE FUNCTION public.audit_touch_updated_at();
CREATE TRIGGER trg_audit_exports_updated BEFORE UPDATE ON public.audit_exports FOR EACH ROW EXECUTE FUNCTION public.audit_touch_updated_at();
CREATE TRIGGER trg_audit_retention_updated BEFORE UPDATE ON public.audit_retention FOR EACH ROW EXECUTE FUNCTION public.audit_touch_updated_at();
