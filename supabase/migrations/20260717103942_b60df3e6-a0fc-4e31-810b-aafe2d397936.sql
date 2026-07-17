
ALTER TABLE public.department_memories 
  ADD COLUMN IF NOT EXISTS source_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS synthesis_state TEXT NOT NULL DEFAULT 'raw' CHECK (synthesis_state IN ('raw','synthesized','deprecated','archived')),
  ADD COLUMN IF NOT EXISTS kpi_impact JSONB;

CREATE OR REPLACE FUNCTION public.match_department_memories_v2(
  query_embedding vector(1536),
  query_department TEXT,
  match_threshold REAL,
  match_count INT,
  filter_types TEXT[]
)
RETURNS TABLE (
  id UUID,
  department_id TEXT,
  type TEXT,
  content TEXT,
  synthesis_state TEXT,
  kpi_impact JSONB,
  importance_score REAL,
  similarity REAL
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dm.id, dm.department_id, dm.type, dm.content,
    dm.synthesis_state, dm.kpi_impact, dm.importance_score,
    (1 - (dm.embedding <=> query_embedding))::REAL AS similarity
  FROM public.department_memories dm
  WHERE dm.department_id = query_department
    AND dm.type = ANY(filter_types)
    AND dm.synthesis_state <> 'deprecated'
    AND dm.embedding IS NOT NULL
    AND 1 - (dm.embedding <=> query_embedding) > match_threshold
  ORDER BY dm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.boost_department_memory_access(memory_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.department_memories
  SET importance_score = LEAST(1.0, importance_score + 0.02),
      last_accessed_at = NOW(),
      access_count = access_count + 1
  WHERE id = ANY(memory_ids);
END;
$$;
