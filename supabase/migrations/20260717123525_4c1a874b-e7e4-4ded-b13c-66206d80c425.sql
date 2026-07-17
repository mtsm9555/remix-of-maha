
CREATE TABLE public.workspaces (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('project','client','department','research','custom')),
  isolation_level TEXT NOT NULL CHECK (isolation_level IN ('strict','moderate','open')),
  isolation_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  owner_id UUID NOT NULL,
  member_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_members INTEGER NOT NULL DEFAULT 50,
  resource_quota JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','suspended')),
  archived_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);
CREATE INDEX idx_workspaces_tenant ON public.workspaces(tenant_id);
CREATE INDEX idx_workspaces_owner ON public.workspaces(owner_id);
CREATE INDEX idx_workspaces_status ON public.workspaces(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can view workspaces" ON public.workspaces FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenant_members tm WHERE tm.tenant_id = workspaces.tenant_id AND tm.user_id = auth.uid()));
CREATE POLICY "Tenant members can manage workspaces" ON public.workspaces FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenant_members tm WHERE tm.tenant_id = workspaces.tenant_id AND tm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members tm WHERE tm.tenant_id = workspaces.tenant_id AND tm.user_id = auth.uid()));

CREATE TABLE public.workspace_memberships (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','member','viewer')),
  permissions TEXT[] DEFAULT '{}',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ,
  UNIQUE(workspace_id, user_id)
);
CREATE INDEX idx_wm_workspace ON public.workspace_memberships(workspace_id);
CREATE INDEX idx_wm_user ON public.workspace_memberships(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_memberships TO authenticated;
GRANT ALL ON public.workspace_memberships TO service_role;
ALTER TABLE public.workspace_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see their memberships" ON public.workspace_memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.workspaces w JOIN public.tenant_members tm ON tm.tenant_id = w.tenant_id
    WHERE w.id = workspace_memberships.workspace_id AND tm.user_id = auth.uid()
  ));

CREATE TABLE public.cross_workspace_access (
  id TEXT PRIMARY KEY,
  source_workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  target_workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL CHECK (access_type IN ('read','write','admin')),
  granted_by UUID NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(source_workspace_id, target_workspace_id)
);
CREATE INDEX idx_cwa_source ON public.cross_workspace_access(source_workspace_id);
CREATE INDEX idx_cwa_target ON public.cross_workspace_access(target_workspace_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cross_workspace_access TO authenticated;
GRANT ALL ON public.cross_workspace_access TO service_role;
ALTER TABLE public.cross_workspace_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage cross access" ON public.cross_workspace_access FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspaces w JOIN public.tenant_members tm ON tm.tenant_id = w.tenant_id
    WHERE w.id = cross_workspace_access.source_workspace_id AND tm.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workspaces w JOIN public.tenant_members tm ON tm.tenant_id = w.tenant_id
    WHERE w.id = cross_workspace_access.source_workspace_id AND tm.user_id = auth.uid()
  ));

CREATE TABLE public.workspace_budget_usage (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  amount_usd REAL NOT NULL,
  description TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wbu_workspace ON public.workspace_budget_usage(workspace_id, recorded_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_budget_usage TO authenticated;
GRANT ALL ON public.workspace_budget_usage TO service_role;
ALTER TABLE public.workspace_budget_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view budget" ON public.workspace_budget_usage FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspaces w JOIN public.tenant_members tm ON tm.tenant_id = w.tenant_id
    WHERE w.id = workspace_budget_usage.workspace_id AND tm.user_id = auth.uid()
  ));

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
