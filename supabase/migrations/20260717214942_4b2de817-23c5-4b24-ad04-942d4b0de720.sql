
CREATE TABLE public.api_documentation (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT NOT NULL,
  servers JSONB NOT NULL DEFAULT '[]'::jsonb,
  auth_methods JSONB NOT NULL DEFAULT '[]'::jsonb,
  endpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  schemas JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}',
  external_docs JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, title, version)
);
CREATE INDEX idx_api_documentation_tenant ON public.api_documentation(tenant_id);

CREATE TABLE public.api_documentation_versions (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES public.api_documentation(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  documentation JSONB NOT NULL,
  is_latest BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_api_doc_versions_doc ON public.api_documentation_versions(doc_id, published_at DESC);
CREATE INDEX idx_api_doc_versions_latest ON public.api_documentation_versions(doc_id, is_latest);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_documentation TO authenticated;
GRANT ALL ON public.api_documentation TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_documentation_versions TO authenticated;
GRANT ALL ON public.api_documentation_versions TO service_role;

ALTER TABLE public.api_documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_documentation_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members manage api_documentation"
  ON public.api_documentation FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "tenant members manage api_documentation_versions"
  ON public.api_documentation_versions FOR ALL TO authenticated
  USING (doc_id IN (SELECT id FROM public.api_documentation WHERE public.is_tenant_member(auth.uid(), tenant_id)))
  WITH CHECK (doc_id IN (SELECT id FROM public.api_documentation WHERE public.is_tenant_member(auth.uid(), tenant_id)));

CREATE TRIGGER update_api_documentation_updated_at
  BEFORE UPDATE ON public.api_documentation
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
