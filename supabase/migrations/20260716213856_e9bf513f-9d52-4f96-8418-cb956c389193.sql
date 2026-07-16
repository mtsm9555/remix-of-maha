
CREATE TABLE public.agent_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id TEXT NOT NULL,
  cpu_usage REAL NOT NULL DEFAULT 0,
  memory_usage_mb REAL NOT NULL DEFAULT 0,
  llm_latency_ms REAL NOT NULL DEFAULT 0,
  llm_error_rate REAL NOT NULL DEFAULT 0,
  success_rate REAL NOT NULL DEFAULT 1.0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agent_health_metrics TO authenticated;
GRANT ALL ON public.agent_health_metrics TO service_role;
ALTER TABLE public.agent_health_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read health metrics" ON public.agent_health_metrics FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_health_metrics_time ON public.agent_health_metrics(instance_id, recorded_at DESC);

CREATE TABLE public.health_anomalies (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  current_value REAL NOT NULL,
  expected_baseline REAL NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warning','critical')),
  description TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.health_anomalies TO authenticated;
GRANT ALL ON public.health_anomalies TO service_role;
ALTER TABLE public.health_anomalies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read anomalies" ON public.health_anomalies FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_anomalies_instance ON public.health_anomalies(instance_id, detected_at DESC);
CREATE INDEX idx_anomalies_severity ON public.health_anomalies(severity, detected_at DESC);
