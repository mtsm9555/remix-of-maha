
-- Ensure pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Agent Messages (conversation history)
-- ============================================
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  is_consolidated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_messages_session ON public.agent_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_messages_unconsolidated ON public.agent_messages(user_id, is_consolidated) WHERE is_consolidated = FALSE;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_messages TO authenticated;
GRANT ALL ON public.agent_messages TO service_role;

ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_messages_select_own" ON public.agent_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "agent_messages_insert_own" ON public.agent_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "agent_messages_update_own" ON public.agent_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "agent_messages_delete_own" ON public.agent_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- Consolidated Memories (long-term memory + embeddings)
-- ============================================
CREATE TABLE IF NOT EXISTS public.consolidated_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  entities TEXT[] NOT NULL DEFAULT '{}',
  relationships JSONB NOT NULL DEFAULT '[]',
  importance_score REAL NOT NULL DEFAULT 0.5 CHECK (importance_score BETWEEN 0 AND 1),
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_consolidated_memories_user ON public.consolidated_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_consolidated_memories_embedding ON public.consolidated_memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.consolidated_memories TO authenticated;
GRANT ALL ON public.consolidated_memories TO service_role;

ALTER TABLE public.consolidated_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consolidated_memories_select_own" ON public.consolidated_memories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "consolidated_memories_insert_own" ON public.consolidated_memories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "consolidated_memories_update_own" ON public.consolidated_memories FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "consolidated_memories_delete_own" ON public.consolidated_memories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- Knowledge Graph Nodes
-- ============================================
CREATE TABLE IF NOT EXISTS public.graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'ENTITY',
  embedding vector(1536),
  properties JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_user ON public.graph_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_embedding ON public.graph_nodes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.graph_nodes TO authenticated;
GRANT ALL ON public.graph_nodes TO service_role;

ALTER TABLE public.graph_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "graph_nodes_select_own" ON public.graph_nodes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "graph_nodes_insert_own" ON public.graph_nodes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "graph_nodes_update_own" ON public.graph_nodes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "graph_nodes_delete_own" ON public.graph_nodes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- Knowledge Graph Edges
-- ============================================
CREATE TABLE IF NOT EXISTS public.graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  relation TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, source_id, target_id, relation)
);
CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON public.graph_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON public.graph_edges(target_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.graph_edges TO authenticated;
GRANT ALL ON public.graph_edges TO service_role;

ALTER TABLE public.graph_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "graph_edges_select_own" ON public.graph_edges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "graph_edges_insert_own" ON public.graph_edges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "graph_edges_update_own" ON public.graph_edges FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "graph_edges_delete_own" ON public.graph_edges FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- Vector search function for memories
-- ============================================
CREATE OR REPLACE FUNCTION public.match_memories(
  query_embedding vector(1536),
  target_user_id UUID,
  match_threshold REAL DEFAULT 0.7,
  match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  summary TEXT,
  similarity REAL
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id,
    cm.summary,
    (1 - (cm.embedding <=> query_embedding))::REAL AS similarity
  FROM public.consolidated_memories cm
  WHERE cm.user_id = target_user_id
    AND cm.embedding IS NOT NULL
    AND 1 - (cm.embedding <=> query_embedding) > match_threshold
  ORDER BY cm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
