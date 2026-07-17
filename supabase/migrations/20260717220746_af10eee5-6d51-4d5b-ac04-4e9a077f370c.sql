
CREATE TABLE IF NOT EXISTS public.test_suites (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('unit','integration','agent','workflow','performance','e2e')),
  tags TEXT[] DEFAULT '{}',
  test_cases JSONB DEFAULT '[]',
  setup_script TEXT,
  teardown_script TEXT,
  parallel_execution BOOLEAN DEFAULT FALSE,
  timeout_ms INTEGER DEFAULT 30000,
  retry_count INTEGER DEFAULT 0,
  created_by TEXT NOT NULL,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('pending','running','passed','failed','skipped','error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_test_suites_tenant ON public.test_suites(tenant_id, type);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_suites TO authenticated;
GRANT ALL ON public.test_suites TO service_role;
ALTER TABLE public.test_suites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members test_suites" ON public.test_suites FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.test_runs (
  id TEXT PRIMARY KEY,
  suite_id TEXT NOT NULL REFERENCES public.test_suites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  triggered_by TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('development','staging','production')),
  status TEXT NOT NULL CHECK (status IN ('pending','running','passed','failed','skipped','error')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER DEFAULT 0,
  total_tests INTEGER NOT NULL DEFAULT 0,
  passed_tests INTEGER NOT NULL DEFAULT 0,
  failed_tests INTEGER NOT NULL DEFAULT 0,
  skipped_tests INTEGER NOT NULL DEFAULT 0,
  results JSONB DEFAULT '[]',
  commit_hash TEXT,
  branch TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_test_runs_suite ON public.test_runs(suite_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_runs_tenant ON public.test_runs(tenant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_runs_status ON public.test_runs(tenant_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_runs TO authenticated;
GRANT ALL ON public.test_runs TO service_role;
ALTER TABLE public.test_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members test_runs" ON public.test_runs FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.golden_datasets (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  entries JSONB DEFAULT '[]',
  entry_count INTEGER NOT NULL DEFAULT 0,
  last_evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_golden_datasets_tenant ON public.golden_datasets(tenant_id, category);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.golden_datasets TO authenticated;
GRANT ALL ON public.golden_datasets TO service_role;
ALTER TABLE public.golden_datasets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members golden_datasets" ON public.golden_datasets FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.agent_evaluations (
  id TEXT PRIMARY KEY,
  test_case_id TEXT NOT NULL,
  run_id TEXT NOT NULL REFERENCES public.test_runs(id) ON DELETE CASCADE,
  metrics JSONB NOT NULL DEFAULT '{}',
  overall_score REAL NOT NULL,
  judge_model TEXT NOT NULL,
  judge_reasoning TEXT,
  expected_output JSONB,
  actual_output JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_evaluations_run ON public.agent_evaluations(run_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_evaluations TO authenticated;
GRANT ALL ON public.agent_evaluations TO service_role;
ALTER TABLE public.agent_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members agent_evaluations" ON public.agent_evaluations FOR ALL TO authenticated
  USING (run_id IN (SELECT id FROM public.test_runs WHERE public.is_tenant_member(auth.uid(), tenant_id)))
  WITH CHECK (run_id IN (SELECT id FROM public.test_runs WHERE public.is_tenant_member(auth.uid(), tenant_id)));

CREATE TABLE IF NOT EXISTS public.test_reports (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES public.test_runs(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  summary JSONB NOT NULL,
  by_type JSONB DEFAULT '{}',
  by_priority JSONB DEFAULT '{}',
  failed_tests JSONB DEFAULT '[]',
  slowest_tests JSONB DEFAULT '[]',
  format TEXT NOT NULL CHECK (format IN ('json','html','junit')),
  file_url TEXT,
  generated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_test_reports_run ON public.test_reports(run_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_reports_tenant ON public.test_reports(tenant_id, generated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_reports TO authenticated;
GRANT ALL ON public.test_reports TO service_role;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members test_reports" ON public.test_reports FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
