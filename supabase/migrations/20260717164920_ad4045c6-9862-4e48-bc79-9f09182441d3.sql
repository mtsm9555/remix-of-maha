
CREATE TABLE public.rbac_permissions (
  id TEXT PRIMARY KEY,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(resource, action)
);
CREATE INDEX idx_rbac_permissions_resource ON public.rbac_permissions(resource);
GRANT SELECT ON public.rbac_permissions TO authenticated;
GRANT ALL ON public.rbac_permissions TO service_role;
ALTER TABLE public.rbac_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissions readable by authenticated" ON public.rbac_permissions FOR SELECT TO authenticated USING (true);

CREATE TABLE public.rbac_roles (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('system','tenant','workspace','custom')),
  parent_role_id TEXT REFERENCES public.rbac_roles(id) ON DELETE SET NULL,
  inherits_permissions BOOLEAN NOT NULL DEFAULT TRUE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  effective_permissions TEXT[] NOT NULL DEFAULT '{}',
  max_members INTEGER,
  current_member_count INTEGER NOT NULL DEFAULT 0,
  is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
CREATE INDEX idx_rbac_roles_tenant ON public.rbac_roles(tenant_id);
CREATE INDEX idx_rbac_roles_active ON public.rbac_roles(tenant_id, is_active);
CREATE INDEX idx_rbac_roles_parent ON public.rbac_roles(parent_role_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbac_roles TO authenticated;
GRANT ALL ON public.rbac_roles TO service_role;
ALTER TABLE public.rbac_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view roles" ON public.rbac_roles FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "Tenant admins manage roles" ON public.rbac_roles FOR ALL TO authenticated
  USING (public.tenant_role(tenant_id, auth.uid()) IN ('owner','admin'))
  WITH CHECK (public.tenant_role(tenant_id, auth.uid()) IN ('owner','admin'));

CREATE TABLE public.rbac_role_assignments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES public.rbac_roles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id TEXT,
  assigned_by TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role_id, tenant_id, workspace_id)
);
CREATE INDEX idx_rbac_ra_user ON public.rbac_role_assignments(user_id, tenant_id);
CREATE INDEX idx_rbac_ra_role ON public.rbac_role_assignments(role_id, tenant_id);
CREATE INDEX idx_rbac_ra_active ON public.rbac_role_assignments(tenant_id, is_active);
CREATE INDEX idx_rbac_ra_expires ON public.rbac_role_assignments(expires_at) WHERE expires_at IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbac_role_assignments TO authenticated;
GRANT ALL ON public.rbac_role_assignments TO service_role;
ALTER TABLE public.rbac_role_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own assignments" ON public.rbac_role_assignments FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Tenant members view assignments" ON public.rbac_role_assignments FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "Tenant admins manage assignments" ON public.rbac_role_assignments FOR ALL TO authenticated
  USING (public.tenant_role(tenant_id, auth.uid()) IN ('owner','admin'))
  WITH CHECK (public.tenant_role(tenant_id, auth.uid()) IN ('owner','admin'));

CREATE TABLE public.rbac_audit_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rbac_audit_tenant ON public.rbac_audit_logs(tenant_id, timestamp DESC);
CREATE INDEX idx_rbac_audit_user ON public.rbac_audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_rbac_audit_action ON public.rbac_audit_logs(action, timestamp DESC);
GRANT SELECT, INSERT ON public.rbac_audit_logs TO authenticated;
GRANT ALL ON public.rbac_audit_logs TO service_role;
ALTER TABLE public.rbac_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view audit" ON public.rbac_audit_logs FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.rbac_touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_rbac_roles_updated BEFORE UPDATE ON public.rbac_roles
  FOR EACH ROW EXECUTE FUNCTION public.rbac_touch_updated_at();
CREATE TRIGGER trg_rbac_ra_updated BEFORE UPDATE ON public.rbac_role_assignments
  FOR EACH ROW EXECUTE FUNCTION public.rbac_touch_updated_at();
