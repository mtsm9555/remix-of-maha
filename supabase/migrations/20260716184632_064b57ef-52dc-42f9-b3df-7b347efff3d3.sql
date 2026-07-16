
CREATE TABLE IF NOT EXISTS public.tool_permissions (
  id TEXT PRIMARY KEY,
  tool_name TEXT NOT NULL,
  allowed_departments TEXT[] NOT NULL DEFAULT '{}',
  level TEXT NOT NULL CHECK (level IN ('allow', 'deny', 'require_approval')),
  parameter_constraints JSONB NOT NULL DEFAULT '[]',
  max_executions_per_hour INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tool_permissions TO authenticated;
GRANT ALL ON public.tool_permissions TO service_role;

ALTER TABLE public.tool_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tool permissions"
  ON public.tool_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tool_permissions_updated_at
  BEFORE UPDATE ON public.tool_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.tool_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  department TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  arguments JSONB NOT NULL DEFAULT '{}',
  decision TEXT NOT NULL CHECK (decision IN ('allowed', 'denied', 'approval_required')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT ALL ON public.tool_access_logs TO service_role;

ALTER TABLE public.tool_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_tool_logs"
  ON public.tool_access_logs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_tool_access_logs_dept ON public.tool_access_logs(department);
CREATE INDEX IF NOT EXISTS idx_tool_access_logs_tool ON public.tool_access_logs(tool_name);
