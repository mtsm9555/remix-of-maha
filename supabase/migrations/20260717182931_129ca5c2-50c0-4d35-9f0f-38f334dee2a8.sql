
CREATE TABLE public.kb_categories (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  parent_id TEXT REFERENCES public.kb_categories(id),
  child_ids TEXT[] DEFAULT '{}',
  level INTEGER DEFAULT 0,
  path TEXT NOT NULL,
  icon TEXT, color TEXT,
  article_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  access_level TEXT NOT NULL DEFAULT 'internal' CHECK (access_level IN ('public','internal','restricted','confidential')),
  allowed_roles TEXT[],
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_categories TO authenticated;
GRANT ALL ON public.kb_categories TO service_role;
ALTER TABLE public.kb_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_categories tenant access" ON public.kb_categories FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.kb_articles (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'markdown' CHECK (content_type IN ('text','markdown','html','video','interactive')),
  type TEXT NOT NULL CHECK (type IN ('how_to','faq','guide','reference','tutorial','policy','announcement')),
  status TEXT NOT NULL CHECK (status IN ('draft','review','published','archived')),
  access_level TEXT NOT NULL DEFAULT 'internal' CHECK (access_level IN ('public','internal','restricted','confidential')),
  category_id TEXT REFERENCES public.kb_categories(id),
  tags TEXT[] DEFAULT '{}',
  related_article_ids TEXT[] DEFAULT '{}',
  author_id TEXT NOT NULL,
  reviewer_id TEXT,
  last_edited_by TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id TEXT,
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  average_rating REAL DEFAULT 0,
  meta_description TEXT,
  keywords TEXT[] DEFAULT '{}',
  ai_generated BOOLEAN DEFAULT FALSE,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);
CREATE INDEX idx_kb_articles_tenant ON public.kb_articles(tenant_id, status);
CREATE INDEX idx_kb_articles_category ON public.kb_articles(tenant_id, category_id);
CREATE INDEX idx_kb_articles_tags ON public.kb_articles USING gin (tags);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_articles TO authenticated;
GRANT ALL ON public.kb_articles TO service_role;
ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_articles tenant access" ON public.kb_articles FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.kb_article_versions (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES public.kb_articles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  edited_by TEXT NOT NULL,
  edited_at TIMESTAMPTZ NOT NULL,
  change_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_kb_versions_article ON public.kb_article_versions(article_id, version DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_article_versions TO authenticated;
GRANT ALL ON public.kb_article_versions TO service_role;
ALTER TABLE public.kb_article_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_versions tenant access" ON public.kb_article_versions FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.kb_tags (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT,
  article_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_tags TO authenticated;
GRANT ALL ON public.kb_tags TO service_role;
ALTER TABLE public.kb_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_tags tenant access" ON public.kb_tags FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.kb_article_feedback (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES public.kb_articles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('helpful','not_helpful','outdated','inaccurate','incomplete')),
  comment TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_kb_feedback_article ON public.kb_article_feedback(article_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_article_feedback TO authenticated;
GRANT ALL ON public.kb_article_feedback TO service_role;
ALTER TABLE public.kb_article_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_feedback tenant access" ON public.kb_article_feedback FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.kb_article_views (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES public.kb_articles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id TEXT,
  session_id TEXT,
  referrer TEXT,
  search_query TEXT,
  time_spent_seconds INTEGER DEFAULT 0,
  scroll_depth INTEGER DEFAULT 0,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_kb_views_article ON public.kb_article_views(article_id, viewed_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_article_views TO authenticated;
GRANT ALL ON public.kb_article_views TO service_role;
ALTER TABLE public.kb_article_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_views tenant access" ON public.kb_article_views FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.kb_knowledge_gaps (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  source TEXT NOT NULL CHECK (source IN ('user_request','search_miss','agent_feedback','manual')),
  request_count INTEGER DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('identified','in_progress','resolved','rejected')),
  assigned_to TEXT,
  related_search_queries TEXT[] DEFAULT '{}',
  related_articles TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_knowledge_gaps TO authenticated;
GRANT ALL ON public.kb_knowledge_gaps TO service_role;
ALTER TABLE public.kb_knowledge_gaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_gaps tenant access" ON public.kb_knowledge_gaps FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.kb_search_logs (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_kb_search_logs_tenant ON public.kb_search_logs(tenant_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_search_logs TO authenticated;
GRANT ALL ON public.kb_search_logs TO service_role;
ALTER TABLE public.kb_search_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_search_logs tenant access" ON public.kb_search_logs FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TRIGGER kb_categories_updated_at BEFORE UPDATE ON public.kb_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER kb_articles_updated_at BEFORE UPDATE ON public.kb_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER kb_gaps_updated_at BEFORE UPDATE ON public.kb_knowledge_gaps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
