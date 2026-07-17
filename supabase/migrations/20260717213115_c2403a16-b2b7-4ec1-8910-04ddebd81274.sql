
CREATE TABLE IF NOT EXISTS public.agent_registrations (
  id TEXT PRIMARY KEY,
  manifest_id TEXT NOT NULL,
  manifest JSONB DEFAULT '{}'::jsonb,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id TEXT,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle','working','waiting','error','offline')),
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (manifest_id, tenant_id, workspace_id)
);
CREATE INDEX IF NOT EXISTS idx_agent_registrations_tenant ON public.agent_registrations(tenant_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_registrations TO authenticated;
GRANT ALL ON public.agent_registrations TO service_role;
ALTER TABLE public.agent_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_registrations tenant access" ON public.agent_registrations FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_agent_registrations_updated_at BEFORE UPDATE ON public.agent_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.agent_sdk_messages (
  id TEXT PRIMARY KEY,
  from_agent_id TEXT NOT NULL,
  to_agent_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('request','response','notification','help')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_sdk_messages_from ON public.agent_sdk_messages(from_agent_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_sdk_messages_to ON public.agent_sdk_messages(to_agent_id, timestamp DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_sdk_messages TO authenticated;
GRANT ALL ON public.agent_sdk_messages TO service_role;
ALTER TABLE public.agent_sdk_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_sdk_messages tenant access" ON public.agent_sdk_messages FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.agent_logs (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('debug','info','warn','error')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent ON public.agent_logs(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_level ON public.agent_logs(agent_id, level, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_logs TO authenticated;
GRANT ALL ON public.agent_logs TO service_role;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_logs tenant access" ON public.agent_logs FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
