
CREATE TABLE IF NOT EXISTS public.workflow_registrations (
  id TEXT PRIMARY KEY,
  manifest_id TEXT NOT NULL,
  manifest JSONB DEFAULT '{}'::jsonb,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','paused','error','completed')),
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (manifest_id, tenant_id, workspace_id)
);
CREATE INDEX IF NOT EXISTS idx_workflow_registrations_tenant ON public.workflow_registrations(tenant_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_registrations TO authenticated;
GRANT ALL ON public.workflow_registrations TO service_role;
ALTER TABLE public.workflow_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflow_registrations tenant access" ON public.workflow_registrations FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_workflow_registrations_updated_at BEFORE UPDATE ON public.workflow_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','error','cancelled')),
  current_step_id TEXT,
  input JSONB DEFAULT '{}'::jsonb,
  output JSONB DEFAULT '{}'::jsonb,
  state JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  error_step_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON public.workflow_executions(workflow_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_tenant ON public.workflow_executions(tenant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(tenant_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_executions TO authenticated;
GRANT ALL ON public.workflow_executions TO service_role;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflow_executions tenant access" ON public.workflow_executions FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_workflow_executions_updated_at BEFORE UPDATE ON public.workflow_executions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.workflow_step_results (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','running','completed','failed','skipped')),
  result JSONB,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_step_results_execution ON public.workflow_step_results(execution_id, started_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_step_results TO authenticated;
GRANT ALL ON public.workflow_step_results TO service_role;
ALTER TABLE public.workflow_step_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflow_step_results parent access" ON public.workflow_step_results FOR ALL TO authenticated
  USING (execution_id IN (SELECT id FROM public.workflow_executions WHERE public.is_tenant_member(auth.uid(), tenant_id)))
  WITH CHECK (execution_id IN (SELECT id FROM public.workflow_executions WHERE public.is_tenant_member(auth.uid(), tenant_id)));

CREATE TABLE IF NOT EXISTS public.workflow_logs (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  execution_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('debug','info','warn','error')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_execution ON public.workflow_logs(execution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_workflow ON public.workflow_logs(workflow_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_logs TO authenticated;
GRANT ALL ON public.workflow_logs TO service_role;
ALTER TABLE public.workflow_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflow_logs tenant access" ON public.workflow_logs FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
