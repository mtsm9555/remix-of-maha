
CREATE TABLE IF NOT EXISTS public.enterprise_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  logic TEXT NOT NULL CHECK (logic IN ('AND', 'OR')),
  action TEXT NOT NULL CHECK (action IN ('ALLOW', 'DENY', 'REQUIRE_APPROVAL')),
  priority INTEGER NOT NULL DEFAULT 0,
  department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT ALL ON public.enterprise_policies TO service_role;
ALTER TABLE public.enterprise_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role manages enterprise_policies" ON public.enterprise_policies FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_policies_active ON public.enterprise_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_policies_priority ON public.enterprise_policies(priority DESC);
CREATE INDEX IF NOT EXISTS idx_policies_dept ON public.enterprise_policies(department);

CREATE TRIGGER trg_enterprise_policies_updated_at
  BEFORE UPDATE ON public.enterprise_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.agent_reputation_scores (
  agent_id TEXT PRIMARY KEY,
  score REAL NOT NULL DEFAULT 0.5 CHECK (score BETWEEN 0.0 AND 1.0),
  total_tasks INTEGER NOT NULL DEFAULT 0,
  successful_tasks INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT ALL ON public.agent_reputation_scores TO service_role;
ALTER TABLE public.agent_reputation_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role manages agent_reputation_scores" ON public.agent_reputation_scores FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.enterprise_policies (name, description, conditions, logic, action, priority, department) VALUES
(
  'No Friday Deployments',
  'Prevents production deployments after 4 PM on Fridays to avoid weekend incidents.',
  '[{"field": "toolName", "operator": "eq", "value": "deploy_to_production"}, {"field": "context.time.day", "operator": "eq", "value": 5}, {"field": "context.time.hour", "operator": "gte", "value": 16}]'::jsonb,
  'AND', 'DENY', 100, 'development'
),
(
  'High Reputation Auto-Approve',
  'Allows highly trusted agents (reputation > 0.9) to bypass approval for medium-risk tools.',
  '[{"field": "agentReputationScore", "operator": "gt", "value": 0.9}, {"field": "estimatedCostUSD", "operator": "lt", "value": 50}]'::jsonb,
  'AND', 'ALLOW', 90, NULL
),
(
  'Block External Database Access',
  'Strictly forbids any agent from querying external database endpoints.',
  '[{"field": "payload.endpoint", "operator": "regex", "value": "^(?!.*company\\.internal).*$"}]'::jsonb,
  'AND', 'DENY', 100, NULL
);
