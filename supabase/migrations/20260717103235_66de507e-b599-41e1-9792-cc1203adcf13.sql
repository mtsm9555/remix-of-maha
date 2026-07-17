
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  active_phase TEXT NOT NULL DEFAULT 'initiation' CHECK (active_phase IN ('initiation','execution','review','archived')),
  summary TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'contributor',
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;
GRANT ALL ON public.project_members TO service_role;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS project_members_user_idx ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS project_members_project_idx ON public.project_members(project_id);

CREATE TABLE IF NOT EXISTS public.project_memories (
  id TEXT PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_memories TO authenticated;
GRANT ALL ON public.project_memories TO service_role;
ALTER TABLE public.project_memories ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS project_memories_project_idx ON public.project_memories(project_id);
CREATE INDEX IF NOT EXISTS project_memories_type_idx ON public.project_memories(type);

-- Access-control helper: does this auth user belong to the project?
CREATE OR REPLACE FUNCTION public.is_project_member(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = _project_id
      AND user_id = _user_id::text
  );
$$;

-- RLS policies
CREATE POLICY "Members can view projects"
  ON public.projects FOR SELECT TO authenticated
  USING (public.is_project_member(id, auth.uid()) OR created_by = auth.uid());
CREATE POLICY "Authenticated can create projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Members can update projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (public.is_project_member(id, auth.uid()));

CREATE POLICY "Members can view membership"
  ON public.project_members FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text OR public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can manage membership"
  ON public.project_members FOR ALL TO authenticated
  USING (public.is_project_member(project_id, auth.uid()))
  WITH CHECK (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Members can view project memories"
  ON public.project_memories FOR SELECT TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can insert project memories"
  ON public.project_memories FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can update project memories"
  ON public.project_memories FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members can delete project memories"
  ON public.project_memories FOR DELETE TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

-- Vector search RPC
CREATE OR REPLACE FUNCTION public.match_project_memories(
  query_embedding vector(1536),
  query_project_id UUID,
  match_threshold REAL,
  match_count INT,
  filter_types TEXT[]
)
RETURNS TABLE (
  id TEXT,
  project_id UUID,
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
    pm.id, pm.project_id, pm.type, pm.content, pm.metadata,
    (1 - (pm.embedding <=> query_embedding))::REAL AS similarity
  FROM public.project_memories pm
  WHERE pm.project_id = query_project_id
    AND (filter_types IS NULL OR pm.type = ANY(filter_types))
    AND pm.embedding IS NOT NULL
    AND 1 - (pm.embedding <=> query_embedding) > match_threshold
  ORDER BY pm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_project_memories_updated_at BEFORE UPDATE ON public.project_memories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
