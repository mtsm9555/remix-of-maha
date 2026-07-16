
CREATE TABLE IF NOT EXISTS public.budget_transactions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  department TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('llm_tokens', 'tool_execution', 'api_calls', 'financial')),
  amount REAL NOT NULL,
  cost_usd REAL NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT ALL ON public.budget_transactions TO service_role;
ALTER TABLE public.budget_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role manages budget_transactions" ON public.budget_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_budget_txn_agent ON public.budget_transactions(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_txn_dept ON public.budget_transactions(department, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_txn_type ON public.budget_transactions(resource_type);

CREATE TABLE IF NOT EXISTS public.daily_budget_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  department TEXT NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  llm_tokens REAL DEFAULT 0,
  llm_cost_usd REAL DEFAULT 0,
  tool_executions REAL DEFAULT 0,
  tool_cost_usd REAL DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  UNIQUE(agent_id, usage_date)
);
GRANT ALL ON public.daily_budget_usage TO service_role;
ALTER TABLE public.daily_budget_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role manages daily_budget_usage" ON public.daily_budget_usage FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.upsert_daily_usage(
  p_agent_id TEXT,
  p_department TEXT,
  p_llm_tokens REAL,
  p_llm_cost_usd REAL,
  p_tool_executions REAL,
  p_tool_cost_usd REAL,
  p_total_cost_usd REAL
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.daily_budget_usage (agent_id, department, llm_tokens, llm_cost_usd, tool_executions, tool_cost_usd, total_cost_usd)
  VALUES (p_agent_id, p_department, p_llm_tokens, p_llm_cost_usd, p_tool_executions, p_tool_cost_usd, p_total_cost_usd)
  ON CONFLICT (agent_id, usage_date)
  DO UPDATE SET
    llm_tokens = public.daily_budget_usage.llm_tokens + EXCLUDED.llm_tokens,
    llm_cost_usd = public.daily_budget_usage.llm_cost_usd + EXCLUDED.llm_cost_usd,
    tool_executions = public.daily_budget_usage.tool_executions + EXCLUDED.tool_executions,
    tool_cost_usd = public.daily_budget_usage.tool_cost_usd + EXCLUDED.tool_cost_usd,
    total_cost_usd = public.daily_budget_usage.total_cost_usd + EXCLUDED.total_cost_usd;
END;
$$;
