CREATE TABLE public.tool_executions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_name text NOT NULL,
  agent_name text,
  user_id uuid,
  session_id text,
  args jsonb,
  result jsonb,
  execution_time_ms integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.tool_executions TO authenticated;
GRANT ALL ON public.tool_executions TO service_role;

ALTER TABLE public.tool_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own tool executions"
  ON public.tool_executions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tool executions"
  ON public.tool_executions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_tool_executions_user_created ON public.tool_executions (user_id, created_at DESC);
CREATE INDEX idx_tool_executions_tool_name ON public.tool_executions (tool_name);