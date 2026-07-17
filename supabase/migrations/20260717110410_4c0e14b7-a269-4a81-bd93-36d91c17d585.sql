
CREATE TABLE IF NOT EXISTS public.knowledge_versions (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project_memory','department_memory','user_memory','shared_memory')),
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}',
  author_id TEXT NOT NULL,
  author_type TEXT NOT NULL CHECK (author_type IN ('human','agent','system')),
  change_summary TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('created','updated','synthesized','promoted','restored')),
  parent_version_id TEXT,
  is_current_version BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_id, entity_type, version_number)
);

CREATE INDEX IF NOT EXISTS idx_versions_entity ON public.knowledge_versions(entity_id, entity_type, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_versions_current ON public.knowledge_versions(entity_id, entity_type) WHERE is_current_version = TRUE;
CREATE INDEX IF NOT EXISTS idx_versions_author ON public.knowledge_versions(author_id, created_at DESC);

GRANT SELECT ON public.knowledge_versions TO authenticated;
GRANT ALL ON public.knowledge_versions TO service_role;

ALTER TABLE public.knowledge_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all versions"
  ON public.knowledge_versions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own authored versions"
  ON public.knowledge_versions FOR SELECT TO authenticated
  USING (author_id = auth.uid()::text
     OR (entity_type = 'user_memory' AND metadata->>'userId' = auth.uid()::text));
