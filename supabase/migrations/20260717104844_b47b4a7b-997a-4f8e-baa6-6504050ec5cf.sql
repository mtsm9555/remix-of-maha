-- Roles infra (needed for admin gating)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Clearance helper (derived from role for now: admin=restricted, moderator=confidential, else internal)
CREATE OR REPLACE FUNCTION public.get_user_clearance(_user_id UUID)
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN public.has_role(_user_id, 'admin') THEN 'restricted'
    WHEN public.has_role(_user_id, 'moderator') THEN 'confidential'
    ELSE 'internal'
  END;
$$;

CREATE OR REPLACE FUNCTION public.clearance_rank(_level TEXT)
RETURNS INT LANGUAGE SQL IMMUTABLE AS $$
  SELECT CASE _level
    WHEN 'public' THEN 1
    WHEN 'internal' THEN 2
    WHEN 'confidential' THEN 3
    WHEN 'restricted' THEN 4
    ELSE 0 END;
$$;

-- Shared memories
CREATE TABLE IF NOT EXISTS public.shared_memories (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536),
  access_level TEXT NOT NULL CHECK (access_level IN ('public','internal','confidential','restricted')),
  category TEXT NOT NULL,
  origin TEXT NOT NULL CHECK (origin IN ('project','department','user','manual')),
  source_memory_id TEXT,
  source_department TEXT,
  author_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_review','approved','rejected')),
  version INTEGER NOT NULL DEFAULT 1,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shared_memories_status ON public.shared_memories(status);
CREATE INDEX IF NOT EXISTS idx_shared_memories_access ON public.shared_memories(access_level);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_memories TO authenticated;
GRANT ALL ON public.shared_memories TO service_role;
ALTER TABLE public.shared_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read shared memories by clearance"
  ON public.shared_memories FOR SELECT TO authenticated
  USING (
    status = 'approved'
    AND public.clearance_rank(access_level) <= public.clearance_rank(public.get_user_clearance(auth.uid()))
  );

CREATE POLICY "Admins read all shared memories"
  ON public.shared_memories FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage shared memories"
  ON public.shared_memories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Memory promotions
CREATE TABLE IF NOT EXISTS public.memory_promotions (
  id TEXT PRIMARY KEY,
  source_memory_id TEXT,
  source_department TEXT,
  proposed_content TEXT NOT NULL,
  proposed_access_level TEXT NOT NULL CHECK (proposed_access_level IN ('public','internal','confidential','restricted')),
  justification TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('draft','pending_review','approved','rejected')),
  requested_by UUID NOT NULL,
  approved_by UUID,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_memory_promotions_status ON public.memory_promotions(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_promotions TO authenticated;
GRANT ALL ON public.memory_promotions TO service_role;
ALTER TABLE public.memory_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requesters read own promotions"
  ON public.memory_promotions FOR SELECT TO authenticated
  USING (auth.uid() = requested_by);
CREATE POLICY "Admins read all promotions"
  ON public.memory_promotions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create promotions"
  ON public.memory_promotions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requested_by);
CREATE POLICY "Admins update promotions"
  ON public.memory_promotions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete promotions"
  ON public.memory_promotions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Vector search RPC (clearance-aware)
CREATE OR REPLACE FUNCTION public.match_shared_memories(
  query_embedding vector(1536),
  requester_clearance TEXT,
  match_threshold REAL,
  match_count INT
)
RETURNS TABLE (
  id TEXT, content TEXT, access_level TEXT, category TEXT,
  origin TEXT, source_department TEXT, similarity REAL
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT sm.id, sm.content, sm.access_level, sm.category, sm.origin, sm.source_department,
         (1 - (sm.embedding <=> query_embedding))::REAL AS similarity
  FROM public.shared_memories sm
  WHERE sm.status = 'approved'
    AND public.clearance_rank(sm.access_level) <= public.clearance_rank(requester_clearance)
    AND (1 - (sm.embedding <=> query_embedding)) > match_threshold
  ORDER BY sm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_shared_memories_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_shared_memories_updated_at ON public.shared_memories;
CREATE TRIGGER trg_shared_memories_updated_at
  BEFORE UPDATE ON public.shared_memories
  FOR EACH ROW EXECUTE FUNCTION public.tg_shared_memories_updated_at();