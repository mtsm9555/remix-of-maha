
CREATE TABLE IF NOT EXISTS public.encryption_keys (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('data_encryption', 'key_encryption', 'master_key')),
  algorithm TEXT NOT NULL CHECK (algorithm IN ('AES-256-GCM', 'AES-256-CBC', 'ChaCha20-Poly1305')),
  encrypted_key_material TEXT NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  rotation_enabled BOOLEAN DEFAULT FALSE,
  rotation_interval_days INTEGER,
  last_rotated_at TIMESTAMPTZ,
  next_rotation_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  allowed_services TEXT[] DEFAULT '{}',
  allowed_roles TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL,
  UNIQUE(tenant_id, name)
);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_tenant ON public.encryption_keys(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_rotation ON public.encryption_keys(tenant_id, next_rotation_at) WHERE rotation_enabled = TRUE;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.encryption_keys TO authenticated;
GRANT ALL ON public.encryption_keys TO service_role;
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage encryption keys" ON public.encryption_keys FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.encrypted_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('public', 'internal', 'confidential', 'restricted', 'pii', 'financial', 'credentials')),
  encryption_key_id TEXT NOT NULL REFERENCES public.encryption_keys(id),
  algorithm TEXT NOT NULL CHECK (algorithm IN ('AES-256-GCM', 'AES-256-CBC', 'ChaCha20-Poly1305')),
  description TEXT,
  requires_audit BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, table_name, field_name)
);
CREATE INDEX IF NOT EXISTS idx_encrypted_fields_tenant ON public.encrypted_fields(tenant_id, table_name);
CREATE INDEX IF NOT EXISTS idx_encrypted_fields_active ON public.encrypted_fields(tenant_id, is_active);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.encrypted_fields TO authenticated;
GRANT ALL ON public.encrypted_fields TO service_role;
ALTER TABLE public.encrypted_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage encrypted fields" ON public.encrypted_fields FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.key_rotation_events (
  id TEXT PRIMARY KEY,
  key_id TEXT NOT NULL REFERENCES public.encryption_keys(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  from_version INTEGER NOT NULL,
  to_version INTEGER NOT NULL,
  rotated_by TEXT NOT NULL,
  rotated_at TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('scheduled', 'manual', 'compromised')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_key_rotation_key ON public.key_rotation_events(key_id, rotated_at DESC);
CREATE INDEX IF NOT EXISTS idx_key_rotation_tenant ON public.key_rotation_events(tenant_id, rotated_at DESC);
GRANT SELECT, INSERT ON public.key_rotation_events TO authenticated;
GRANT ALL ON public.key_rotation_events TO service_role;
ALTER TABLE public.key_rotation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view rotation events" ON public.key_rotation_events FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Tenant members insert rotation events" ON public.key_rotation_events FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.encryption_audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('encrypt', 'decrypt', 'key_created', 'key_rotated', 'key_revoked', 'field_configured')),
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'service', 'system')),
  key_id TEXT,
  table_name TEXT,
  field_name TEXT,
  record_count INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_encryption_audit_tenant ON public.encryption_audit_logs(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_encryption_audit_action ON public.encryption_audit_logs(tenant_id, action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_encryption_audit_table ON public.encryption_audit_logs(tenant_id, table_name, timestamp DESC);
GRANT SELECT, INSERT ON public.encryption_audit_logs TO authenticated;
GRANT ALL ON public.encryption_audit_logs TO service_role;
ALTER TABLE public.encryption_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view encryption audit" ON public.encryption_audit_logs FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Tenant members insert encryption audit" ON public.encryption_audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TRIGGER update_encryption_keys_updated_at BEFORE UPDATE ON public.encryption_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_encrypted_fields_updated_at BEFORE UPDATE ON public.encrypted_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
