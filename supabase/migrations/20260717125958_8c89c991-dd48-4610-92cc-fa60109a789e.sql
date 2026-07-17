
CREATE TABLE IF NOT EXISTS public.scaling_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  target_resource_type TEXT NOT NULL CHECK (target_resource_type IN ('worker_nodes','api_servers','database_replicas','cache_nodes','custom')),
  target_resource_id TEXT NOT NULL,
  min_instances INTEGER NOT NULL DEFAULT 1,
  max_instances INTEGER NOT NULL DEFAULT 100,
  current_instances INTEGER NOT NULL DEFAULT 1,
  desired_instances INTEGER NOT NULL DEFAULT 1,
  triggers TEXT[] NOT NULL DEFAULT '{}',
  trigger_configs JSONB NOT NULL DEFAULT '{}',
  scale_up_cooldown_seconds INTEGER NOT NULL DEFAULT 300,
  scale_down_cooldown_seconds INTEGER NOT NULL DEFAULT 600,
  stabilization_window_seconds INTEGER NOT NULL DEFAULT 300,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','disabled')),
  cloud_provider TEXT NOT NULL CHECK (cloud_provider IN ('aws','gcp','azure','kubernetes','custom')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_scaled_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_scaling_policies_status ON public.scaling_policies(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scaling_policies TO authenticated;
GRANT ALL ON public.scaling_policies TO service_role;
ALTER TABLE public.scaling_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage scaling_policies" ON public.scaling_policies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.scaling_metrics (
  id TEXT PRIMARY KEY,
  policy_id TEXT NOT NULL REFERENCES public.scaling_policies(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  cpu_usage_percent REAL NOT NULL,
  memory_usage_percent REAL NOT NULL,
  queue_depth INTEGER NOT NULL DEFAULT 0,
  requests_per_second REAL NOT NULL DEFAULT 0,
  custom_metrics JSONB NOT NULL DEFAULT '{}',
  current_instances INTEGER NOT NULL,
  desired_instances INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scaling_metrics_policy ON public.scaling_metrics(policy_id, timestamp DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scaling_metrics TO authenticated;
GRANT ALL ON public.scaling_metrics TO service_role;
ALTER TABLE public.scaling_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage scaling_metrics" ON public.scaling_metrics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.scaling_events (
  id TEXT PRIMARY KEY,
  policy_id TEXT NOT NULL REFERENCES public.scaling_policies(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('scale_up','scale_down','no_change')),
  trigger TEXT NOT NULL,
  instances_before INTEGER NOT NULL,
  instances_after INTEGER NOT NULL,
  reason TEXT NOT NULL,
  metric_value REAL NOT NULL,
  threshold_value REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('initiated','in_progress','completed','failed','rolled_back')),
  initiated_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  error TEXT,
  estimated_cost_change_usd REAL,
  metadata JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_scaling_events_policy ON public.scaling_events(policy_id, initiated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scaling_events TO authenticated;
GRANT ALL ON public.scaling_events TO service_role;
ALTER TABLE public.scaling_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage scaling_events" ON public.scaling_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.scaling_predictions (
  id TEXT PRIMARY KEY,
  policy_id TEXT NOT NULL REFERENCES public.scaling_policies(id) ON DELETE CASCADE,
  predicted_timestamp TIMESTAMPTZ NOT NULL,
  predicted_metric_value REAL NOT NULL,
  predicted_instances_needed INTEGER NOT NULL,
  confidence_score REAL NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scaling_predictions_policy ON public.scaling_predictions(policy_id, generated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scaling_predictions TO authenticated;
GRANT ALL ON public.scaling_predictions TO service_role;
ALTER TABLE public.scaling_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage scaling_predictions" ON public.scaling_predictions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
