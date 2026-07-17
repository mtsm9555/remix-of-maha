
-- Tenants
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'trial',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','trial','cancel_pending')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Tenant members
CREATE TABLE public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','member','viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_members TO authenticated;
GRANT ALL ON public.tenant_members TO service_role;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- Helper: is user a member of tenant (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tenant_members WHERE user_id = _user_id AND tenant_id = _tenant_id);
$$;

CREATE OR REPLACE FUNCTION public.tenant_role(_user_id UUID, _tenant_id UUID)
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.tenant_members WHERE user_id = _user_id AND tenant_id = _tenant_id LIMIT 1;
$$;

-- Policies: tenants
CREATE POLICY "Members can view their tenants" ON public.tenants FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), id));
CREATE POLICY "Owners/admins can update tenants" ON public.tenants FOR UPDATE TO authenticated
  USING (public.tenant_role(auth.uid(), id) IN ('owner','admin'))
  WITH CHECK (public.tenant_role(auth.uid(), id) IN ('owner','admin'));
CREATE POLICY "Authenticated can create tenants" ON public.tenants FOR INSERT TO authenticated
  WITH CHECK (true);

-- Policies: tenant_members
CREATE POLICY "Members can view co-members" ON public.tenant_members FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Owners/admins manage members" ON public.tenant_members FOR ALL TO authenticated
  USING (public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin'))
  WITH CHECK (public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin'));
CREATE POLICY "User can insert self as first member" ON public.tenant_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Add tenant_id to existing tables
ALTER TABLE public.project_memories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.department_memories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.user_memories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.context_snapshots ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.tool_execution_events ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_project_memories_tenant ON public.project_memories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_department_memories_tenant ON public.department_memories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_tenant ON public.user_memories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_context_snapshots_tenant ON public.context_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tool_execution_events_tenant ON public.tool_execution_events(tenant_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
