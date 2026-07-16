
CREATE TABLE public.sandbox_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL,
  tool_version TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  exit_code INTEGER NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  memory_used_mb INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  stderr TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sandbox_exec_tool ON public.sandbox_executions(tool_name, created_at DESC);

GRANT SELECT ON public.sandbox_executions TO authenticated;
GRANT ALL ON public.sandbox_executions TO service_role;
ALTER TABLE public.sandbox_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read sandbox executions" ON public.sandbox_executions FOR SELECT TO authenticated USING (true);

CREATE TABLE public.sandbox_security_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES public.sandbox_executions(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  violation_type TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sandbox_violations_type ON public.sandbox_security_violations(violation_type, created_at DESC);

GRANT SELECT ON public.sandbox_security_violations TO authenticated;
GRANT ALL ON public.sandbox_security_violations TO service_role;
ALTER TABLE public.sandbox_security_violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read sandbox violations" ON public.sandbox_security_violations FOR SELECT TO authenticated USING (true);
