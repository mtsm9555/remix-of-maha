
CREATE TABLE public.tool_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'department', 'agent', 'task')),
  target_tool_name TEXT NOT NULL,
  target_department TEXT,
  target_agent_id TEXT,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  logic TEXT NOT NULL CHECK (logic IN ('AND', 'OR')),
  action TEXT NOT NULL CHECK (action IN ('ALLOW','DENY','MASK_PAYLOAD','THROTTLE','REQUIRE_APPROVAL')),
  action_config JSONB DEFAULT '{}'::jsonb,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tool_policies_active ON public.tool_policies(is_active, priority DESC);

GRANT SELECT ON public.tool_policies TO authenticated;
GRANT ALL ON public.tool_policies TO service_role;
ALTER TABLE public.tool_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read tool policies" ON public.tool_policies FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_tool_policies_updated_at BEFORE UPDATE ON public.tool_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tool_policy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  department TEXT NOT NULL,
  policy_id TEXT,
  action TEXT NOT NULL,
  allowed BOOLEAN NOT NULL,
  reason TEXT,
  latency_ms INTEGER NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_policy_logs_time ON public.tool_policy_logs(evaluated_at DESC);
CREATE INDEX idx_policy_logs_action ON public.tool_policy_logs(action, evaluated_at DESC);

GRANT SELECT ON public.tool_policy_logs TO authenticated;
GRANT ALL ON public.tool_policy_logs TO service_role;
ALTER TABLE public.tool_policy_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read policy logs" ON public.tool_policy_logs FOR SELECT TO authenticated USING (true);
