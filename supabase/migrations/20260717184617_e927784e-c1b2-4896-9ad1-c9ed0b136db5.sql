
CREATE TABLE IF NOT EXISTS public.dashboards (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  view TEXT NOT NULL CHECK (view IN ('executive','manager','team_member','custom')),
  is_default BOOLEAN DEFAULT FALSE,
  widgets JSONB DEFAULT '[]',
  layout JSONB NOT NULL DEFAULT '{"columns":12,"rowHeight":80,"breakpoints":{"lg":1200,"md":996,"sm":768,"xs":480}}',
  default_time_range TEXT NOT NULL DEFAULT 'month' CHECK (default_time_range IN ('today','week','month','quarter','year','custom')),
  default_filters JSONB DEFAULT '[]',
  owner_id UUID NOT NULL,
  shared_with UUID[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  last_viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dashboards_tenant ON public.dashboards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_owner ON public.dashboards(tenant_id, owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboards TO authenticated;
GRANT ALL ON public.dashboards TO service_role;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dashboards_select" ON public.dashboards FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id) AND (owner_id = auth.uid() OR is_public OR auth.uid() = ANY(shared_with)));
CREATE POLICY "dashboards_insert" ON public.dashboards FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id) AND owner_id = auth.uid());
CREATE POLICY "dashboards_update" ON public.dashboards FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "dashboards_delete" ON public.dashboards FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE TRIGGER dashboards_updated_at BEFORE UPDATE ON public.dashboards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.dashboard_views (
  id TEXT PRIMARY KEY,
  dashboard_id TEXT NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  session_id TEXT,
  time_range TEXT,
  filters JSONB DEFAULT '{}',
  session_duration_seconds INTEGER DEFAULT 0,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dashboard_views_dashboard ON public.dashboard_views(dashboard_id, viewed_at DESC);

GRANT SELECT, INSERT ON public.dashboard_views TO authenticated;
GRANT ALL ON public.dashboard_views TO service_role;
ALTER TABLE public.dashboard_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dashboard_views_select" ON public.dashboard_views FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "dashboard_views_insert" ON public.dashboard_views FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
