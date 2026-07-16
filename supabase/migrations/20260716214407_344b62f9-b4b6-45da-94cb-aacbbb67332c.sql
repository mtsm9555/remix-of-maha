
CREATE TABLE IF NOT EXISTS public.mcp_server_connections (
  server_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  transport_type TEXT NOT NULL CHECK (transport_type IN ('sse','http')),
  endpoint TEXT NOT NULL,
  api_key_secret_name TEXT,
  allowed_tools TEXT[] NOT NULL DEFAULT '{}',
  exposed_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  exposed_resources JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('connected','disconnected','error')),
  error_message TEXT,
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mcp_server_connections TO authenticated;
GRANT ALL ON public.mcp_server_connections TO service_role;
ALTER TABLE public.mcp_server_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read mcp connections"
  ON public.mcp_server_connections FOR SELECT
  TO authenticated USING (true);

CREATE TRIGGER trg_mcp_conn_updated
  BEFORE UPDATE ON public.mcp_server_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.mcp_tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  arguments JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_summary TEXT,
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  agent_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mcp_tool_executions TO authenticated;
GRANT ALL ON public.mcp_tool_executions TO service_role;
ALTER TABLE public.mcp_tool_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read mcp executions"
  ON public.mcp_tool_executions FOR SELECT
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_mcp_executions_server
  ON public.mcp_tool_executions(server_id, created_at DESC);
