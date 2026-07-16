
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.department_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('procedural', 'episodic', 'semantic')),
  content TEXT NOT NULL,
  embedding vector(1536),
  importance_score REAL NOT NULL DEFAULT 0.5 CHECK (importance_score BETWEEN 0 AND 1),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_count INTEGER NOT NULL DEFAULT 0
);

GRANT ALL ON public.department_memories TO service_role;

ALTER TABLE public.department_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.department_memories
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_dept_memories_dept ON public.department_memories(department_id);
CREATE INDEX IF NOT EXISTS idx_dept_memories_type ON public.department_memories(type);
CREATE INDEX IF NOT EXISTS idx_dept_memories_importance ON public.department_memories(importance_score DESC);

CREATE OR REPLACE FUNCTION public.match_department_memories(
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
  importance_score REAL,
  metadata JSONB,
  similarity REAL
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dm.id,
    dm.department_id,
    dm.type,
    dm.content,
    dm.importance_score,
    dm.metadata,
    1 - (dm.embedding <=> query_embedding) AS similarity
  FROM public.department_memories dm
  WHERE dm.department_id = query_department
    AND dm.type = ANY(filter_types)
    AND dm.embedding IS NOT NULL
    AND 1 - (dm.embedding <=> query_embedding) > match_threshold
  ORDER BY dm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.decay_stale_memories(days_threshold INT, decay_factor REAL)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.department_memories
  SET importance_score = importance_score * decay_factor,
      last_accessed_at = NOW()
  WHERE last_accessed_at < NOW() - (INTERVAL '1 day' * days_threshold)
    AND importance_score > 0.1;
END;
$$;

CREATE OR REPLACE FUNCTION public.boost_memory_importance(memory_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.department_memories
  SET importance_score = LEAST(1.0, importance_score + 0.05),
      last_accessed_at = NOW(),
      access_count = access_count + 1
  WHERE id = ANY(memory_ids);
END;
$$;
