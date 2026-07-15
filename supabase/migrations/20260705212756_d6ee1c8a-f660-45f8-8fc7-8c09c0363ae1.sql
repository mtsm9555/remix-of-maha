CREATE TABLE IF NOT EXISTS public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES public.tools(id) ON DELETE SET NULL,
  status TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT ON public.logs TO anon, authenticated;
GRANT ALL ON public.logs TO service_role;

ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read on logs" ON public.logs
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS logs_created_at_idx ON public.logs (created_at DESC);
CREATE INDEX IF NOT EXISTS logs_task_id_idx ON public.logs (task_id);
CREATE INDEX IF NOT EXISTS logs_tool_id_idx ON public.logs (tool_id);