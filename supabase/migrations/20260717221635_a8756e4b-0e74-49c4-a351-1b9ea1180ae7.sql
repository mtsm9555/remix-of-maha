
CREATE TABLE IF NOT EXISTS public.pipelines (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  repository_url TEXT NOT NULL,
  branch TEXT NOT NULL DEFAULT 'main',
  definition JSONB NOT NULL,
  variables JSONB DEFAULT '{}',
  secrets TEXT[] DEFAULT '{}',
  triggers JSONB DEFAULT '[]',
  timeout_minutes INTEGER DEFAULT 60,
  concurrency_limit INTEGER DEFAULT 1,
  auto_cancel_on_new_push BOOLEAN DEFAULT FALSE,
  created_by TEXT NOT NULL,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('idle','running','success','failed','cancelled','paused')),
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pipelines_tenant ON public.pipelines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_repo ON public.pipelines(tenant_id, repository_url);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipelines TO authenticated;
GRANT ALL ON public.pipelines TO service_role;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pipelines tenant" ON public.pipelines FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.pipeline_runs (
  id TEXT PRIMARY KEY,
  pipeline_id TEXT NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  triggered_by TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('push','pull_request','tag','schedule','manual','webhook')),
  commit_hash TEXT,
  commit_message TEXT,
  branch TEXT,
  tag TEXT,
  status TEXT NOT NULL CHECK (status IN ('idle','running','success','failed','cancelled','paused')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  stages JSONB DEFAULT '[]',
  artifacts JSONB DEFAULT '[]',
  environment TEXT,
  variables JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_pipeline ON public.pipeline_runs(pipeline_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_tenant ON public.pipeline_runs(tenant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON public.pipeline_runs(tenant_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_runs TO authenticated;
GRANT ALL ON public.pipeline_runs TO service_role;
ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pipeline_runs tenant" ON public.pipeline_runs FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.artifacts (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES public.pipeline_runs(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  checksum TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  downloaded_at TIMESTAMPTZ,
  downloaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_artifacts_run ON public.artifacts(run_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_tenant ON public.artifacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_expires ON public.artifacts(expires_at) WHERE expires_at IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artifacts TO authenticated;
GRANT ALL ON public.artifacts TO service_role;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artifacts tenant" ON public.artifacts FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.environments (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('development','staging','production','custom')),
  description TEXT,
  url TEXT,
  variables JSONB DEFAULT '{}',
  secrets TEXT[] DEFAULT '{}',
  deployment_strategy TEXT NOT NULL DEFAULT 'rolling' CHECK (deployment_strategy IN ('rolling','blue_green','canary','recreate')),
  auto_deploy_on_success BOOLEAN DEFAULT FALSE,
  require_approval BOOLEAN DEFAULT FALSE,
  approvers TEXT[],
  is_protected BOOLEAN DEFAULT FALSE,
  allowed_branches TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
CREATE INDEX IF NOT EXISTS idx_environments_tenant ON public.environments(tenant_id, type);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.environments TO authenticated;
GRANT ALL ON public.environments TO service_role;
ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "environments tenant" ON public.environments FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.deployments (
  id TEXT PRIMARY KEY,
  environment_id TEXT NOT NULL REFERENCES public.environments(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL REFERENCES public.pipeline_runs(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  commit_hash TEXT,
  strategy TEXT NOT NULL CHECK (strategy IN ('rolling','blue_green','canary','recreate')),
  status TEXT NOT NULL CHECK (status IN ('pending','deploying','success','failed','rolled_back')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  deployed_by TEXT NOT NULL,
  approved_by TEXT,
  previous_deployment_id TEXT,
  rollback_reason TEXT,
  health_check_passed BOOLEAN DEFAULT FALSE,
  health_check_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deployments_environment ON public.deployments(environment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployments_run ON public.deployments(run_id);
CREATE INDEX IF NOT EXISTS idx_deployments_tenant ON public.deployments(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON public.deployments(tenant_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deployments TO authenticated;
GRANT ALL ON public.deployments TO service_role;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deployments tenant" ON public.deployments FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.webhook_configs (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github','gitlab','bitbucket','custom')),
  repository_url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_tenant ON public.webhook_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_repo ON public.webhook_configs(tenant_id, repository_url);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_configs TO authenticated;
GRANT ALL ON public.webhook_configs TO service_role;
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_configs tenant" ON public.webhook_configs FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
