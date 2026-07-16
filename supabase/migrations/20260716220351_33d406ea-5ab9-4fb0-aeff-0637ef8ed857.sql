
CREATE TABLE IF NOT EXISTS public.tool_versions (
  id TEXT PRIMARY KEY,
  tool_name TEXT NOT NULL,
  version TEXT NOT NULL,
  major INTEGER NOT NULL,
  minor INTEGER NOT NULL,
  patch INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','deprecated','archived','rolling_back')),
  manifest JSONB NOT NULL,
  changelog TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deprecated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  UNIQUE(tool_name, version)
);
CREATE INDEX IF NOT EXISTS idx_tool_versions_active ON public.tool_versions(tool_name, status) WHERE status = 'active';

GRANT SELECT ON public.tool_versions TO authenticated;
GRANT ALL ON public.tool_versions TO service_role;
ALTER TABLE public.tool_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read tool_versions" ON public.tool_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage tool_versions" ON public.tool_versions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.agent_tool_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  pinned_version TEXT NOT NULL,
  reason TEXT,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agent_id, tool_name)
);

GRANT SELECT ON public.agent_tool_pins TO authenticated;
GRANT ALL ON public.agent_tool_pins TO service_role;
ALTER TABLE public.agent_tool_pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read agent_tool_pins" ON public.agent_tool_pins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage agent_tool_pins" ON public.agent_tool_pins FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
