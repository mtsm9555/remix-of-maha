
CREATE TABLE public.organization_members (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','suspended','deactivated')),
  team_ids TEXT[] NOT NULL DEFAULT '{}',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(tenant_id, user_id)
);
CREATE INDEX idx_org_members_tenant ON public.organization_members(tenant_id);
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view org members" ON public.organization_members FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Owners/admins manage org members" ON public.organization_members FOR ALL TO authenticated
  USING (public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin'))
  WITH CHECK (public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin'));

CREATE TABLE public.organization_roles (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);
CREATE INDEX idx_org_roles_tenant ON public.organization_roles(tenant_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_roles TO authenticated;
GRANT ALL ON public.organization_roles TO service_role;
ALTER TABLE public.organization_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view roles" ON public.organization_roles FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Owners/admins manage roles" ON public.organization_roles FOR ALL TO authenticated
  USING (public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin'))
  WITH CHECK (public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin'));

CREATE TABLE public.member_invites (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  team_ids TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','revoked')),
  invited_by TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);
CREATE INDEX idx_invites_tenant ON public.member_invites(tenant_id);
CREATE INDEX idx_invites_token ON public.member_invites(token);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_invites TO authenticated;
GRANT ALL ON public.member_invites TO service_role;
ALTER TABLE public.member_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners/admins manage invites" ON public.member_invites FOR ALL TO authenticated
  USING (public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin'))
  WITH CHECK (public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin'));

CREATE TABLE public.organization_teams (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  department_id TEXT,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);
CREATE INDEX idx_teams_tenant ON public.organization_teams(tenant_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_teams TO authenticated;
GRANT ALL ON public.organization_teams TO service_role;
ALTER TABLE public.organization_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view teams" ON public.organization_teams FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Owners/admins manage teams" ON public.organization_teams FOR ALL TO authenticated
  USING (public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin'))
  WITH CHECK (public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin'));

CREATE TABLE public.api_keys (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  created_by TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_api_keys_tenant ON public.api_keys(tenant_id);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners/admins manage api keys" ON public.api_keys FOR ALL TO authenticated
  USING (public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin'))
  WITH CHECK (public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin'));

CREATE TABLE public.organization_settings (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  logo_url TEXT,
  default_role TEXT NOT NULL DEFAULT 'member',
  require_email_verification BOOLEAN NOT NULL DEFAULT TRUE,
  allow_member_invites BOOLEAN NOT NULL DEFAULT TRUE,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 60,
  ip_allowlist TEXT[] NOT NULL DEFAULT '{}',
  custom_domains TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_settings TO authenticated;
GRANT ALL ON public.organization_settings TO service_role;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view settings" ON public.organization_settings FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Owners/admins manage settings" ON public.organization_settings FOR ALL TO authenticated
  USING (public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin'))
  WITH CHECK (public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin'));
