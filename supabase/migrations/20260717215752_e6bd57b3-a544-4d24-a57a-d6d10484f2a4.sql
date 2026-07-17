
CREATE TABLE IF NOT EXISTS public.system_documentation (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  version TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('architecture','deployment','developer','operations','security','user_guide','integration','api_reference')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','deprecated')),
  access_level TEXT NOT NULL DEFAULT 'internal' CHECK (access_level IN ('public','internal','restricted','confidential')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  parent_id TEXT,
  child_ids TEXT[] DEFAULT '{}',
  related_doc_ids TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  diagrams JSONB DEFAULT '[]',
  revision INTEGER NOT NULL DEFAULT 1,
  last_edited_by TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_system_docs_tenant ON public.system_documentation(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_system_docs_status ON public.system_documentation(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_system_docs_tags ON public.system_documentation USING gin (tags);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_documentation TO authenticated;
GRANT SELECT ON public.system_documentation TO anon;
GRANT ALL ON public.system_documentation TO service_role;
ALTER TABLE public.system_documentation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage system_documentation" ON public.system_documentation
  FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Public read published system_documentation" ON public.system_documentation
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND access_level = 'public');

CREATE TABLE IF NOT EXISTS public.doc_versions_sys (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES public.system_documentation(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  revision INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  diagrams JSONB DEFAULT '[]',
  is_latest BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ NOT NULL,
  published_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doc_versions_sys_doc ON public.doc_versions_sys(doc_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_versions_sys_latest ON public.doc_versions_sys(doc_id, is_latest);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_versions_sys TO authenticated;
GRANT ALL ON public.doc_versions_sys TO service_role;
ALTER TABLE public.doc_versions_sys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage doc_versions_sys" ON public.doc_versions_sys
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.system_documentation sd WHERE sd.id = doc_versions_sys.doc_id AND public.is_tenant_member(auth.uid(), sd.tenant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.system_documentation sd WHERE sd.id = doc_versions_sys.doc_id AND public.is_tenant_member(auth.uid(), sd.tenant_id)));

CREATE TABLE IF NOT EXISTS public.doc_feedback (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES public.system_documentation(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doc_feedback_doc ON public.doc_feedback(doc_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_feedback_user ON public.doc_feedback(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_feedback TO authenticated;
GRANT ALL ON public.doc_feedback TO service_role;
ALTER TABLE public.doc_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage doc_feedback" ON public.doc_feedback
  FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.doc_search_logs_sys (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doc_search_logs_sys_tenant ON public.doc_search_logs_sys(tenant_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_search_logs_sys TO authenticated;
GRANT ALL ON public.doc_search_logs_sys TO service_role;
ALTER TABLE public.doc_search_logs_sys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage doc_search_logs_sys" ON public.doc_search_logs_sys
  FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
