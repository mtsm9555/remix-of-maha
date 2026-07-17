
CREATE TABLE public.secrets (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'custom',
  tags TEXT[] NOT NULL DEFAULT '{}',
  encrypted_value TEXT NOT NULL,
  encryption_key_id TEXT NOT NULL DEFAULT 'master',
  encryption_algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  version INT NOT NULL DEFAULT 1,
  previous_version_id TEXT,
  rotation_enabled BOOLEAN NOT NULL DEFAULT false,
  rotation_interval_days INT,
  last_rotated_at TIMESTAMPTZ,
  next_rotation_at TIMESTAMPTZ,
  rotation_status TEXT NOT NULL DEFAULT 'active',
  access_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  last_accessed_at TIMESTAMPTZ,
  last_accessed_by UUID,
  access_count INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  UNIQUE(tenant_id, name)
);
CREATE INDEX idx_secrets_tenant ON public.secrets(tenant_id);
CREATE INDEX idx_secrets_next_rotation ON public.secrets(next_rotation_at) WHERE rotation_enabled = true AND is_revoked = false;

GRANT SELECT ON public.secrets TO authenticated;
GRANT ALL ON public.secrets TO service_role;
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view secrets" ON public.secrets FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));

CREATE TABLE public.secret_versions (
  id TEXT PRIMARY KEY,
  secret_id TEXT NOT NULL REFERENCES public.secrets(id) ON DELETE CASCADE,
  version INT NOT NULL,
  encrypted_value TEXT NOT NULL,
  encryption_key_id TEXT NOT NULL,
  rotation_reason TEXT,
  rotated_by UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_secret_versions_secret ON public.secret_versions(secret_id);

GRANT SELECT ON public.secret_versions TO authenticated;
GRANT ALL ON public.secret_versions TO service_role;
ALTER TABLE public.secret_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view versions" ON public.secret_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.secrets s WHERE s.id = secret_id AND public.is_tenant_member(s.tenant_id, auth.uid())));

CREATE TABLE public.secret_access_requests (
  id TEXT PRIMARY KEY,
  secret_id TEXT NOT NULL REFERENCES public.secrets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  reason TEXT NOT NULL,
  requested_duration INT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  access_granted_at TIMESTAMPTZ,
  access_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_secret_access_requests_tenant ON public.secret_access_requests(tenant_id);

GRANT SELECT ON public.secret_access_requests TO authenticated;
GRANT ALL ON public.secret_access_requests TO service_role;
ALTER TABLE public.secret_access_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view access requests" ON public.secret_access_requests FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));

CREATE TABLE public.vault_audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  secret_id TEXT,
  user_id UUID,
  action TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vault_audit_tenant ON public.vault_audit_logs(tenant_id, timestamp DESC);
CREATE INDEX idx_vault_audit_secret ON public.vault_audit_logs(secret_id);

GRANT SELECT ON public.vault_audit_logs TO authenticated;
GRANT ALL ON public.vault_audit_logs TO service_role;
ALTER TABLE public.vault_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view audit logs" ON public.vault_audit_logs FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));

CREATE TRIGGER trg_secrets_updated_at BEFORE UPDATE ON public.secrets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_secret_access_requests_updated_at BEFORE UPDATE ON public.secret_access_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
