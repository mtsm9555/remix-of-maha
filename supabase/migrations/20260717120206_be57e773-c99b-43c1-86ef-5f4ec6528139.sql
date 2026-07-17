
-- advanced_roles
CREATE TABLE public.advanced_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  parent_role_id UUID REFERENCES public.advanced_roles(id) ON DELETE SET NULL,
  inheritance_depth INTEGER NOT NULL DEFAULT 0,
  direct_permissions TEXT[] NOT NULL DEFAULT '{}',
  inherited_permissions TEXT[] NOT NULL DEFAULT '{}',
  effective_permissions TEXT[] NOT NULL DEFAULT '{}',
  conditional_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  max_members INTEGER NOT NULL DEFAULT -1,
  current_member_count INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);
CREATE INDEX idx_adv_roles_tenant ON public.advanced_roles(tenant_id);
CREATE INDEX idx_adv_roles_parent ON public.advanced_roles(parent_role_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.advanced_roles TO authenticated;
GRANT ALL ON public.advanced_roles TO service_role;
ALTER TABLE public.advanced_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adv_roles_select" ON public.advanced_roles FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "adv_roles_admin_write" ON public.advanced_roles FOR ALL TO authenticated
  USING (public.tenant_role(tenant_id, auth.uid()) IN ('owner','admin'))
  WITH CHECK (public.tenant_role(tenant_id, auth.uid()) IN ('owner','admin'));

-- advanced_role_assignments
CREATE TABLE public.advanced_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.advanced_roles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_temporary BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(role_id, user_id, tenant_id)
);
CREATE INDEX idx_adv_assignments_user ON public.advanced_role_assignments(user_id, tenant_id);
CREATE INDEX idx_adv_assignments_role ON public.advanced_role_assignments(role_id);
CREATE INDEX idx_adv_assignments_expires ON public.advanced_role_assignments(expires_at) WHERE expires_at IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.advanced_role_assignments TO authenticated;
GRANT ALL ON public.advanced_role_assignments TO service_role;
ALTER TABLE public.advanced_role_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adv_assign_select" ON public.advanced_role_assignments FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "adv_assign_admin_write" ON public.advanced_role_assignments FOR ALL TO authenticated
  USING (public.tenant_role(tenant_id, auth.uid()) IN ('owner','admin'))
  WITH CHECK (public.tenant_role(tenant_id, auth.uid()) IN ('owner','admin'));

-- advanced_role_change_logs
CREATE TABLE public.advanced_role_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.advanced_roles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_adv_role_logs_role ON public.advanced_role_change_logs(role_id, changed_at DESC);
GRANT SELECT, INSERT ON public.advanced_role_change_logs TO authenticated;
GRANT ALL ON public.advanced_role_change_logs TO service_role;
ALTER TABLE public.advanced_role_change_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adv_logs_select" ON public.advanced_role_change_logs FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "adv_logs_admin_insert" ON public.advanced_role_change_logs FOR INSERT TO authenticated
  WITH CHECK (public.tenant_role(tenant_id, auth.uid()) IN ('owner','admin'));

-- advanced_jit_role_elevations
CREATE TABLE public.advanced_jit_role_elevations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  target_role_id UUID NOT NULL REFERENCES public.advanced_roles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected','expired'))
);
CREATE INDEX idx_adv_jit_tenant ON public.advanced_jit_role_elevations(tenant_id, status);
CREATE INDEX idx_adv_jit_user ON public.advanced_jit_role_elevations(user_id);
GRANT SELECT, INSERT, UPDATE ON public.advanced_jit_role_elevations TO authenticated;
GRANT ALL ON public.advanced_jit_role_elevations TO service_role;
ALTER TABLE public.advanced_jit_role_elevations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adv_jit_select" ON public.advanced_jit_role_elevations FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "adv_jit_request" ON public.advanced_jit_role_elevations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "adv_jit_admin_update" ON public.advanced_jit_role_elevations FOR UPDATE TO authenticated
  USING (public.tenant_role(tenant_id, auth.uid()) IN ('owner','admin'));

-- advanced_role_templates
CREATE TABLE public.advanced_role_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  conditional_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system_template BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.advanced_role_templates TO authenticated;
GRANT ALL ON public.advanced_role_templates TO service_role;
ALTER TABLE public.advanced_role_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adv_templates_select" ON public.advanced_role_templates FOR SELECT TO authenticated
  USING (true);

-- update_updated_at trigger reuse
CREATE TRIGGER update_advanced_roles_updated_at BEFORE UPDATE ON public.advanced_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_advanced_role_templates_updated_at BEFORE UPDATE ON public.advanced_role_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default templates
INSERT INTO public.advanced_role_templates (name, description, category, permissions, conditional_permissions) VALUES
('Engineering Lead','Full access to development tools and deployment','engineering',
  ARRAY['agents:deploy','agents:execute','data:read','data:write','tools:install','tools:manage','analytics:view'],'[]'::jsonb),
('Marketing Manager','Access to marketing tools and content management','marketing',
  ARRAY['agents:execute','data:read','data:write','analytics:view'],'[]'::jsonb),
('Finance Analyst','Read-only access to financial data and analytics','finance',
  ARRAY['data:read','analytics:view','budget:view'],'[]'::jsonb),
('HR Manager','Access to member management and organization settings','hr',
  ARRAY['members:manage','roles:view','analytics:view'],'[]'::jsonb),
('Viewer','Read-only access','custom',
  ARRAY['data:read','analytics:view'],'[]'::jsonb);
