
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.agent_capability_maps (
  agent_id TEXT PRIMARY KEY,
  agent_type TEXT NOT NULL,
  department TEXT NOT NULL,
  input_modalities TEXT[] NOT NULL DEFAULT '{}',
  output_modalities TEXT[] NOT NULL DEFAULT '{}',
  tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  primary_model JSONB NOT NULL DEFAULT '{}'::jsonb,
  expertise JSONB NOT NULL DEFAULT '[]'::jsonb,
  capability_embedding vector(1536),
  version TEXT NOT NULL DEFAULT '1.0.0',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_capability_dept ON public.agent_capability_maps(department);
CREATE INDEX IF NOT EXISTS idx_capability_tools ON public.agent_capability_maps USING gin (tools jsonb_path_ops);
GRANT SELECT ON public.agent_capability_maps TO authenticated;
GRANT ALL ON public.agent_capability_maps TO service_role;
ALTER TABLE public.agent_capability_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read capability maps" ON public.agent_capability_maps FOR SELECT TO authenticated USING (true);
