
CREATE TABLE public.worker_nodes (
  id TEXT PRIMARY KEY,
  hostname TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  region TEXT NOT NULL,
  zone TEXT NOT NULL,
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  max_concurrent_tasks INTEGER NOT NULL DEFAULT 10,
  current_task_count INTEGER NOT NULL DEFAULT 0,
  cpu_cores INTEGER NOT NULL DEFAULT 1,
  memory_gb INTEGER NOT NULL DEFAULT 1,
  disk_gb INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL CHECK (status IN ('initializing','idle','busy','draining','offline','failed')),
  load_average REAL NOT NULL DEFAULT 0,
  cpu_usage REAL NOT NULL DEFAULT 0,
  memory_usage REAL NOT NULL DEFAULT 0,
  version TEXT NOT NULL DEFAULT '1.0.0',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_workers_status ON public.worker_nodes(status);
CREATE INDEX idx_workers_region ON public.worker_nodes(region);
CREATE INDEX idx_workers_heartbeat ON public.worker_nodes(last_heartbeat_at);
CREATE INDEX idx_workers_capabilities ON public.worker_nodes USING gin(capabilities);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.worker_nodes TO authenticated;
GRANT ALL ON public.worker_nodes TO service_role;
ALTER TABLE public.worker_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage workers" ON public.worker_nodes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.cluster_tasks (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('critical','high','normal','low')),
  required_capabilities TEXT[] NOT NULL DEFAULT '{}',
  preferred_region TEXT,
  preferred_worker_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('pending','queued','running','completed','failed','cancelled')),
  assigned_worker_id TEXT REFERENCES public.worker_nodes(id) ON DELETE SET NULL,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  timeout_ms INTEGER NOT NULL DEFAULT 300000,
  result JSONB,
  error TEXT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_status ON public.cluster_tasks(status);
CREATE INDEX idx_tasks_worker ON public.cluster_tasks(assigned_worker_id);
CREATE INDEX idx_tasks_priority ON public.cluster_tasks(priority);
CREATE INDEX idx_tasks_tenant ON public.cluster_tasks(tenant_id);
CREATE INDEX idx_tasks_queued ON public.cluster_tasks(queued_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cluster_tasks TO authenticated;
GRANT ALL ON public.cluster_tasks TO service_role;
ALTER TABLE public.cluster_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view tasks" ON public.cluster_tasks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenant_members tm WHERE tm.tenant_id = cluster_tasks.tenant_id AND tm.user_id = auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage tasks" ON public.cluster_tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.worker_health_checks (
  id TEXT PRIMARY KEY,
  worker_id TEXT NOT NULL REFERENCES public.worker_nodes(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  cpu_usage REAL NOT NULL,
  memory_usage REAL NOT NULL,
  disk_usage REAL NOT NULL,
  network_latency_ms REAL NOT NULL DEFAULT 0,
  active_tasks INTEGER NOT NULL DEFAULT 0,
  errors TEXT[] DEFAULT '{}'
);
CREATE INDEX idx_health_worker ON public.worker_health_checks(worker_id, timestamp DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.worker_health_checks TO authenticated;
GRANT ALL ON public.worker_health_checks TO service_role;
ALTER TABLE public.worker_health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view health" ON public.worker_health_checks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER update_worker_nodes_updated_at BEFORE UPDATE ON public.worker_nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
