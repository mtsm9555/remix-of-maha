
CREATE TABLE IF NOT EXISTS public.tool_execution_events (
  id TEXT PRIMARY KEY,
  tool_name TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  department TEXT NOT NULL,
  latency_ms REAL NOT NULL,
  success BOOLEAN NOT NULL,
  error_code TEXT,
  cost_usd REAL NOT NULL DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  payload_size_bytes INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tool_events_time ON public.tool_execution_events(tool_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tool_events_success ON public.tool_execution_events(success, timestamp DESC);

GRANT SELECT ON public.tool_execution_events TO authenticated;
GRANT ALL ON public.tool_execution_events TO service_role;
ALTER TABLE public.tool_execution_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read tool events" ON public.tool_execution_events FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.tool_metric_rollups (
  tool_name TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_executions INTEGER NOT NULL,
  success_rate REAL NOT NULL,
  avg_latency_ms REAL NOT NULL,
  p95_latency_ms REAL NOT NULL,
  p99_latency_ms REAL NOT NULL,
  total_cost_usd REAL NOT NULL,
  total_tokens_used INTEGER NOT NULL,
  error_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tool_name, period_start)
);
CREATE INDEX IF NOT EXISTS idx_tool_rollups_time ON public.tool_metric_rollups(period_start DESC);

GRANT SELECT ON public.tool_metric_rollups TO authenticated;
GRANT ALL ON public.tool_metric_rollups TO service_role;
ALTER TABLE public.tool_metric_rollups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read tool rollups" ON public.tool_metric_rollups FOR SELECT TO authenticated USING (true);
