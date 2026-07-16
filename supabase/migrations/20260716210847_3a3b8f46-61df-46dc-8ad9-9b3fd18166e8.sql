
CREATE TABLE IF NOT EXISTS public.agent_lifecycle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id TEXT NOT NULL,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  reason TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lifecycle_logs_instance ON public.agent_lifecycle_logs(instance_id, timestamp DESC);
GRANT SELECT ON public.agent_lifecycle_logs TO authenticated;
GRANT ALL ON public.agent_lifecycle_logs TO service_role;
ALTER TABLE public.agent_lifecycle_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read lifecycle logs" ON public.agent_lifecycle_logs FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.agent_instances_registry (
  instance_id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  department TEXT NOT NULL,
  state TEXT NOT NULL,
  current_task_id TEXT,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  consecutive_errors INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agent_instances_registry TO authenticated;
GRANT ALL ON public.agent_instances_registry TO service_role;
ALTER TABLE public.agent_instances_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read instances registry" ON public.agent_instances_registry FOR SELECT TO authenticated USING (true);
