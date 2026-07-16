
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.agent_performance_metrics (
  agent_id TEXT PRIMARY KEY,
  success_rate REAL NOT NULL DEFAULT 0.0,
  average_qa_score REAL NOT NULL DEFAULT 0.0,
  human_override_rate REAL NOT NULL DEFAULT 0.0,
  total_tasks INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agent_performance_metrics TO authenticated;
GRANT ALL ON public.agent_performance_metrics TO service_role;
ALTER TABLE public.agent_performance_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read performance metrics" ON public.agent_performance_metrics FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.agent_capability_embeddings (
  agent_type TEXT PRIMARY KEY,
  department TEXT NOT NULL,
  supported_tools TEXT[] NOT NULL DEFAULT '{}',
  capability_embedding vector(1536) NOT NULL,
  cost_per_task_usd REAL NOT NULL DEFAULT 0.01,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_capability_embeddings ON public.agent_capability_embeddings USING ivfflat (capability_embedding vector_cosine_ops) WITH (lists = 100);
GRANT SELECT ON public.agent_capability_embeddings TO authenticated;
GRANT ALL ON public.agent_capability_embeddings TO service_role;
ALTER TABLE public.agent_capability_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read capability embeddings" ON public.agent_capability_embeddings FOR SELECT TO authenticated USING (true);
