
CREATE TABLE IF NOT EXISTS public.raw_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('task_output','chat_transcript','tool_execution','incident_log')),
  content TEXT NOT NULL,
  is_consolidated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.raw_memories TO authenticated;
GRANT ALL ON public.raw_memories TO service_role;
ALTER TABLE public.raw_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read raw_memories" ON public.raw_memories FOR SELECT TO authenticated USING (true);
CREATE POLICY "service manages raw_memories" ON public.raw_memories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_raw_memories_unconsolidated ON public.raw_memories(department, created_at) WHERE is_consolidated = FALSE;

ALTER TABLE public.graph_nodes ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.graph_edges ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.graph_edges ADD COLUMN IF NOT EXISTS source_name TEXT;
ALTER TABLE public.graph_edges ADD COLUMN IF NOT EXISTS target_name TEXT;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='graph_nodes_name_department_unique') THEN
    ALTER TABLE public.graph_nodes ADD CONSTRAINT graph_nodes_name_department_unique UNIQUE (name, department);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='graph_edges_name_relation_department_unique') THEN
    ALTER TABLE public.graph_edges ADD CONSTRAINT graph_edges_name_relation_department_unique UNIQUE (source_name, target_name, relation, department);
  END IF;
END $$;
