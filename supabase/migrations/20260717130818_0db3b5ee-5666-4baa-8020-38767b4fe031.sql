
CREATE TABLE IF NOT EXISTS public.queues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('critical','normal','background','batch','scheduled')),
  description TEXT,
  max_concurrent_tasks INTEGER NOT NULL DEFAULT 10,
  default_timeout_ms INTEGER NOT NULL DEFAULT 300000,
  default_max_retries INTEGER NOT NULL DEFAULT 3,
  default_retry_strategy TEXT NOT NULL DEFAULT 'exponential_backoff',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  current_depth INTEGER NOT NULL DEFAULT 0,
  processing_rate REAL NOT NULL DEFAULT 0,
  failure_rate REAL NOT NULL DEFAULT 0,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_queues_name_tenant ON public.queues(name, COALESCE(tenant_id::text,''));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.queues TO authenticated;
GRANT ALL ON public.queues TO service_role;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage queues" ON public.queues FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Tenant members read queues" ON public.queues FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR public.is_tenant_member(tenant_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.orchestrated_tasks (
  id TEXT PRIMARY KEY,
  queue_id TEXT NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id UUID,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','queued','processing','completed','failed','dead_letter','cancelled','blocked')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  queued_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  timeout_ms INTEGER NOT NULL DEFAULT 300000,
  retry_strategy TEXT NOT NULL DEFAULT 'exponential_backoff',
  retry_delay_ms INTEGER NOT NULL DEFAULT 2000,
  next_retry_at TIMESTAMPTZ,
  result JSONB,
  error TEXT,
  error_code TEXT,
  depends_on JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  correlation_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_orchestrated_tasks_queue_state ON public.orchestrated_tasks(queue_id, state);
CREATE INDEX IF NOT EXISTS idx_orchestrated_tasks_tenant ON public.orchestrated_tasks(tenant_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orchestrated_tasks TO authenticated;
GRANT ALL ON public.orchestrated_tasks TO service_role;
ALTER TABLE public.orchestrated_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage orchestrated_tasks" ON public.orchestrated_tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Tenant members read orchestrated_tasks" ON public.orchestrated_tasks FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES public.orchestrated_tasks(id) ON DELETE CASCADE,
  depends_on_task_id TEXT NOT NULL REFERENCES public.orchestrated_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'blocking' CHECK (dependency_type IN ('blocking','optional','conditional')),
  condition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_task_deps_task ON public.task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_depends_on ON public.task_dependencies(depends_on_task_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_dependencies TO authenticated;
GRANT ALL ON public.task_dependencies TO service_role;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage task_dependencies" ON public.task_dependencies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.dead_letter_queue (
  id TEXT PRIMARY KEY,
  original_task_id TEXT NOT NULL,
  queue_id TEXT NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  priority INTEGER NOT NULL,
  attempts INTEGER NOT NULL,
  last_error TEXT NOT NULL,
  last_error_code TEXT NOT NULL,
  failed_at TIMESTAMPTZ NOT NULL,
  can_retry BOOLEAN NOT NULL DEFAULT TRUE,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_manual_retries INTEGER NOT NULL DEFAULT 3,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dlq_tenant ON public.dead_letter_queue(tenant_id, failed_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dead_letter_queue TO authenticated;
GRANT ALL ON public.dead_letter_queue TO service_role;
ALTER TABLE public.dead_letter_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage dlq" ON public.dead_letter_queue FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Tenant members read dlq" ON public.dead_letter_queue FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.queue_metrics (
  id TEXT PRIMARY KEY,
  queue_id TEXT NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  pending_tasks INTEGER NOT NULL DEFAULT 0,
  processing_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  failed_tasks INTEGER NOT NULL DEFAULT 0,
  dead_letter_tasks INTEGER NOT NULL DEFAULT 0,
  avg_processing_time_ms REAL NOT NULL DEFAULT 0,
  p95_processing_time_ms REAL NOT NULL DEFAULT 0,
  p99_processing_time_ms REAL NOT NULL DEFAULT 0,
  tasks_per_minute REAL NOT NULL DEFAULT 0,
  success_rate REAL NOT NULL DEFAULT 0,
  failure_rate REAL NOT NULL DEFAULT 0,
  avg_wait_time_ms REAL NOT NULL DEFAULT 0,
  oldest_pending_task_age INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_queue_metrics_queue ON public.queue_metrics(queue_id, timestamp DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.queue_metrics TO authenticated;
GRANT ALL ON public.queue_metrics TO service_role;
ALTER TABLE public.queue_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage queue_metrics" ON public.queue_metrics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
