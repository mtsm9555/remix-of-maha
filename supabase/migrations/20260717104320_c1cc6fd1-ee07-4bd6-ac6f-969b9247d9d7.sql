
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'employee' CHECK (category IN ('admin','employee','client','prospect')),
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS communication_style TEXT NOT NULL DEFAULT 'formal' CHECK (communication_style IN ('formal','casual','technical','executive_brief')),
  ADD COLUMN IF NOT EXISTS active_hours_start INTEGER NOT NULL DEFAULT 9,
  ADD COLUMN IF NOT EXISTS active_hours_end INTEGER NOT NULL DEFAULT 17;

CREATE TABLE IF NOT EXISTS public.user_memories (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('explicit_preference','implicit_pattern','biographical_fact','interaction_summary')),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_memories TO authenticated;
GRANT ALL ON public.user_memories TO service_role;

ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_memories_user ON public.user_memories(user_id);

CREATE POLICY "Users can view own memories"
  ON public.user_memories FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own memories"
  ON public.user_memories FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own memories"
  ON public.user_memories FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own memories"
  ON public.user_memories FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE TRIGGER update_user_memories_updated_at
  BEFORE UPDATE ON public.user_memories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.match_user_memories(
  query_embedding vector(1536),
  query_user_id UUID,
  match_threshold REAL,
  match_count INT
)
RETURNS TABLE (
  id TEXT,
  user_id UUID,
  type TEXT,
  content TEXT,
  metadata JSONB,
  similarity REAL
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    um.id, um.user_id, um.type, um.content, um.metadata,
    (1 - (um.embedding <=> query_embedding))::REAL AS similarity
  FROM public.user_memories um
  WHERE um.user_id = query_user_id
    AND um.embedding IS NOT NULL
    AND 1 - (um.embedding <=> query_embedding) > match_threshold
  ORDER BY um.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
