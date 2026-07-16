
CREATE TABLE public.tool_pricing_models (
  tool_name TEXT PRIMARY KEY,
  model_type TEXT NOT NULL CHECK (model_type IN ('fixed_per_call','variable_compute','token_based','external_api_passthrough')),
  base_cost_usd REAL NOT NULL DEFAULT 0,
  cost_per_cpu_second_usd REAL NOT NULL DEFAULT 0,
  cost_per_memory_mb_second_usd REAL NOT NULL DEFAULT 0,
  cost_per_input_token_usd REAL NOT NULL DEFAULT 0,
  cost_per_output_token_usd REAL NOT NULL DEFAULT 0,
  external_api_cost_multiplier REAL NOT NULL DEFAULT 1.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT ON public.tool_pricing_models TO authenticated;
GRANT ALL ON public.tool_pricing_models TO service_role;
ALTER TABLE public.tool_pricing_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read pricing" ON public.tool_pricing_models FOR SELECT TO authenticated USING (true);

CREATE TABLE public.tool_cost_events (
  id TEXT PRIMARY KEY,
  tool_name TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  department TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  memory_used_mb REAL NOT NULL,
  tokens_used JSONB,
  total_cost_usd REAL NOT NULL,
  cost_breakdown JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cost_events_dept_time ON public.tool_cost_events(department, timestamp DESC);
CREATE INDEX idx_cost_events_agent_time ON public.tool_cost_events(agent_id, timestamp DESC);
GRANT SELECT ON public.tool_cost_events TO authenticated;
GRANT ALL ON public.tool_cost_events TO service_role;
ALTER TABLE public.tool_cost_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read cost events" ON public.tool_cost_events FOR SELECT TO authenticated USING (true);

CREATE TABLE public.cost_attribution_rollups (
  department TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  total_cost_usd REAL NOT NULL,
  total_executions INTEGER NOT NULL,
  PRIMARY KEY (department, tool_name, period_start)
);
GRANT SELECT ON public.cost_attribution_rollups TO authenticated;
GRANT ALL ON public.cost_attribution_rollups TO service_role;
ALTER TABLE public.cost_attribution_rollups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read cost rollups" ON public.cost_attribution_rollups FOR SELECT TO authenticated USING (true);
