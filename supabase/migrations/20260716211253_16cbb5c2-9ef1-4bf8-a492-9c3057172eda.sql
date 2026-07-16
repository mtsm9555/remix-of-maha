
CREATE TABLE IF NOT EXISTS public.agent_registry_persistent (
  instance_id TEXT PRIMARY KEY,
  agent_type TEXT NOT NULL,
  department TEXT NOT NULL,
  network_host TEXT NOT NULL,
  network_port INTEGER NOT NULL,
  network_protocol TEXT NOT NULL DEFAULT 'http',
  execution_endpoint TEXT NOT NULL DEFAULT '/api/v1/execute',
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_load NUMERIC NOT NULL DEFAULT 0,
  max_concurrent_tasks INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('healthy','degraded','unreachable','offline')),
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT now(),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_registry_dept ON public.agent_registry_persistent(department, status);
CREATE INDEX IF NOT EXISTS idx_registry_type ON public.agent_registry_persistent(agent_type);
CREATE INDEX IF NOT EXISTS idx_registry_heartbeat ON public.agent_registry_persistent(last_heartbeat DESC);
GRANT SELECT ON public.agent_registry_persistent TO authenticated;
GRANT ALL ON public.agent_registry_persistent TO service_role;
ALTER TABLE public.agent_registry_persistent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read registry" ON public.agent_registry_persistent FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.agent_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  routing_latency_ms INTEGER,
  execution_latency_ms INTEGER,
  success BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_execution_logs_instance ON public.agent_execution_logs(instance_id, created_at DESC);
GRANT SELECT ON public.agent_execution_logs TO authenticated;
GRANT ALL ON public.agent_execution_logs TO service_role;
ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read execution logs" ON public.agent_execution_logs FOR SELECT TO authenticated USING (true);
