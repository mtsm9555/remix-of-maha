CREATE TABLE IF NOT EXISTS public.context_snapshots (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  department TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  full_prompt_text TEXT NOT NULL,
  chunk_metadata JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_tokens INTEGER NOT NULL,
  estimated_cost_usd REAL NOT NULL,
  llm_model_used TEXT NOT NULL,
  llm_temperature REAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_snapshots_task ON public.context_snapshots(task_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_agent ON public.context_snapshots(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_hash ON public.context_snapshots(prompt_hash);

GRANT SELECT ON public.context_snapshots TO authenticated;
GRANT ALL ON public.context_snapshots TO service_role;
ALTER TABLE public.context_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all snapshots"
  ON public.context_snapshots FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents read own snapshots"
  ON public.context_snapshots FOR SELECT TO authenticated
  USING (agent_id = auth.uid()::text);

CREATE POLICY "Admins delete snapshots"
  ON public.context_snapshots FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));