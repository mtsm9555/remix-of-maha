
CREATE TABLE IF NOT EXISTS public.plugin_configs (
  plugin_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activated_at TIMESTAMPTZ,
  last_deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (plugin_id, tenant_id)
);
CREATE INDEX IF NOT EXISTS idx_plugin_configs_tenant ON public.plugin_configs(tenant_id, is_active);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_configs TO authenticated;
GRANT ALL ON public.plugin_configs TO service_role;
ALTER TABLE public.plugin_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plugin_configs tenant access" ON public.plugin_configs FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_plugin_configs_updated_at BEFORE UPDATE ON public.plugin_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.plugin_tools (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  parameters JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plugin_id, tenant_id, name)
);
CREATE INDEX IF NOT EXISTS idx_plugin_tools_plugin ON public.plugin_tools(plugin_id, tenant_id, is_active);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_tools TO authenticated;
GRANT ALL ON public.plugin_tools TO service_role;
ALTER TABLE public.plugin_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plugin_tools tenant access" ON public.plugin_tools FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.plugin_storage (
  plugin_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (plugin_id, tenant_id, key)
);
CREATE INDEX IF NOT EXISTS idx_plugin_storage_plugin ON public.plugin_storage(plugin_id, tenant_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_storage TO authenticated;
GRANT ALL ON public.plugin_storage TO service_role;
ALTER TABLE public.plugin_storage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plugin_storage tenant access" ON public.plugin_storage FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_plugin_storage_updated_at BEFORE UPDATE ON public.plugin_storage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.plugin_logs (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('debug','info','warn','error')),
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_plugin_logs_plugin ON public.plugin_logs(plugin_id, tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plugin_logs_level ON public.plugin_logs(plugin_id, tenant_id, level, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_logs TO authenticated;
GRANT ALL ON public.plugin_logs TO service_role;
ALTER TABLE public.plugin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plugin_logs tenant access" ON public.plugin_logs FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.plugin_webhooks (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_plugin_webhooks_plugin ON public.plugin_webhooks(plugin_id, tenant_id, is_active);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_webhooks TO authenticated;
GRANT ALL ON public.plugin_webhooks TO service_role;
ALTER TABLE public.plugin_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plugin_webhooks tenant access" ON public.plugin_webhooks FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
