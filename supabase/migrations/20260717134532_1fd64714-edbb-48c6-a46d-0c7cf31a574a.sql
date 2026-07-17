
CREATE TABLE IF NOT EXISTS public.dr_regions (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  region_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('primary','secondary','dr_standby','failed')),
  database_endpoint TEXT NOT NULL,
  cache_endpoint TEXT NOT NULL,
  storage_endpoint TEXT NOT NULL,
  api_endpoint TEXT NOT NULL,
  is_healthy BOOLEAN DEFAULT TRUE,
  last_health_check_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  health_score INTEGER NOT NULL DEFAULT 100,
  replication_status TEXT NOT NULL DEFAULT 'active' CHECK (replication_status IN ('active','lagging','paused','failed')),
  replication_lag_seconds INTEGER NOT NULL DEFAULT 0,
  last_replicated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cpu_utilization REAL NOT NULL DEFAULT 0,
  memory_utilization REAL NOT NULL DEFAULT 0,
  storage_utilization REAL NOT NULL DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  failover_priority INTEGER NOT NULL DEFAULT 10,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, region_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dr_regions TO authenticated;
GRANT ALL ON public.dr_regions TO service_role;
ALTER TABLE public.dr_regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage dr_regions" ON public.dr_regions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tenant members view dr_regions" ON public.dr_regions FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE INDEX idx_dr_regions_tenant ON public.dr_regions(tenant_id);
CREATE INDEX idx_dr_regions_primary ON public.dr_regions(tenant_id, is_primary);

CREATE TABLE IF NOT EXISTS public.failover_plans (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  source_region_id TEXT NOT NULL REFERENCES public.dr_regions(id),
  target_region_id TEXT NOT NULL REFERENCES public.dr_regions(id),
  failover_type TEXT NOT NULL CHECK (failover_type IN ('automatic','manual')),
  triggers JSONB DEFAULT '[]'::jsonb,
  rto_seconds INTEGER NOT NULL,
  rpo_seconds INTEGER NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  last_tested_at TIMESTAMPTZ,
  last_failover_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.failover_plans TO authenticated;
GRANT ALL ON public.failover_plans TO service_role;
ALTER TABLE public.failover_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage failover_plans" ON public.failover_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tenant members view failover_plans" ON public.failover_plans FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE INDEX idx_failover_plans_tenant ON public.failover_plans(tenant_id, is_active);

CREATE TABLE IF NOT EXISTS public.failover_events (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.failover_plans(id),
  trigger_type TEXT NOT NULL,
  trigger_reason TEXT NOT NULL,
  source_region_id TEXT NOT NULL REFERENCES public.dr_regions(id),
  target_region_id TEXT NOT NULL REFERENCES public.dr_regions(id),
  status TEXT NOT NULL CHECK (status IN ('idle','initiated','in_progress','completed','failed','rolled_back')),
  current_step_id TEXT,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  actual_rto_seconds REAL,
  actual_rpo_seconds REAL,
  steps_completed INTEGER NOT NULL DEFAULT 0,
  steps_failed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  rolled_back BOOLEAN DEFAULT FALSE,
  rollback_at TIMESTAMPTZ,
  rollback_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.failover_events TO authenticated;
GRANT ALL ON public.failover_events TO service_role;
ALTER TABLE public.failover_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage failover_events" ON public.failover_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tenant members view failover_events" ON public.failover_events FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE INDEX idx_failover_events_tenant ON public.failover_events(tenant_id, initiated_at DESC);
CREATE INDEX idx_failover_events_status ON public.failover_events(tenant_id, status);

CREATE TABLE IF NOT EXISTS public.dr_tests (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.failover_plans(id),
  test_name TEXT NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('full_failover','partial_failover','replication_test','restore_test')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('scheduled','in_progress','passed','failed','cancelled')),
  passed_steps INTEGER NOT NULL DEFAULT 0,
  failed_steps INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL DEFAULT 0,
  actual_rto_seconds REAL,
  actual_rpo_seconds REAL,
  target_rto_seconds INTEGER NOT NULL,
  target_rpo_seconds INTEGER NOT NULL,
  rto_met BOOLEAN DEFAULT FALSE,
  rpo_met BOOLEAN DEFAULT FALSE,
  test_results JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  recommendations TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dr_tests TO authenticated;
GRANT ALL ON public.dr_tests TO service_role;
ALTER TABLE public.dr_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage dr_tests" ON public.dr_tests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tenant members view dr_tests" ON public.dr_tests FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE INDEX idx_dr_tests_tenant ON public.dr_tests(tenant_id, created_at DESC);
CREATE INDEX idx_dr_tests_scheduled ON public.dr_tests(scheduled_at, status);

CREATE TRIGGER trg_dr_regions_updated BEFORE UPDATE ON public.dr_regions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_failover_plans_updated BEFORE UPDATE ON public.failover_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_failover_events_updated BEFORE UPDATE ON public.failover_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_dr_tests_updated BEFORE UPDATE ON public.dr_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
