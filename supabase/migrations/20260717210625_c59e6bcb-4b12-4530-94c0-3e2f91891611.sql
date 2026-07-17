
CREATE TABLE IF NOT EXISTS public.analytics_metrics (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('crm','projects','meetings','documents','knowledge','financial','sales','marketing')),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('count','sum','average','min','max','rate','ratio')),
  source_table TEXT NOT NULL,
  source_field TEXT NOT NULL,
  aggregation TEXT NOT NULL,
  filters JSONB DEFAULT '[]',
  current_value REAL DEFAULT 0,
  previous_value REAL,
  change_percent REAL,
  trend TEXT DEFAULT 'stable' CHECK (trend IN ('up','down','stable')),
  unit TEXT,
  format TEXT NOT NULL CHECK (format IN ('number','currency','percentage','duration')),
  historical_data JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_tenant ON public.analytics_metrics(tenant_id, module);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_metrics TO authenticated;
GRANT ALL ON public.analytics_metrics TO service_role;
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage metrics" ON public.analytics_metrics FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_analytics_metrics_updated BEFORE UPDATE ON public.analytics_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.analytics_reports (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  metrics TEXT[] NOT NULL DEFAULT '{}',
  dimensions TEXT[] DEFAULT '{}',
  filters JSONB DEFAULT '[]',
  time_range JSONB NOT NULL,
  charts JSONB DEFAULT '[]',
  layout JSONB DEFAULT '{"columns":12,"rowHeight":80,"pageSize":"A4","orientation":"portrait"}',
  is_scheduled BOOLEAN DEFAULT FALSE,
  schedule_cron TEXT,
  recipients TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','completed','failed')),
  last_generated_at TIMESTAMPTZ,
  next_scheduled_at TIMESTAMPTZ,
  data JSONB,
  insights JSONB DEFAULT '[]',
  owner_id TEXT NOT NULL,
  shared_with TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_tenant ON public.analytics_reports(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_owner ON public.analytics_reports(tenant_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_status ON public.analytics_reports(tenant_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_reports TO authenticated;
GRANT ALL ON public.analytics_reports TO service_role;
ALTER TABLE public.analytics_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage reports" ON public.analytics_reports FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_analytics_reports_updated BEFORE UPDATE ON public.analytics_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.analytics_insights (
  id TEXT PRIMARY KEY,
  report_id TEXT REFERENCES public.analytics_reports(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('growth','efficiency','risk','opportunity','anomaly')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_level TEXT NOT NULL CHECK (impact_level IN ('low','medium','high','critical')),
  confidence INTEGER NOT NULL,
  related_metrics TEXT[] DEFAULT '{}',
  supporting_data JSONB DEFAULT '{}',
  recommended_action TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low','medium','high','urgent')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','actioned','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_insights_tenant ON public.analytics_insights(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_analytics_insights_status ON public.analytics_insights(tenant_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_insights TO authenticated;
GRANT ALL ON public.analytics_insights TO service_role;
ALTER TABLE public.analytics_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage insights" ON public.analytics_insights FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.cohort_analyses (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cohort_by TEXT NOT NULL,
  cohort_period TEXT NOT NULL CHECK (cohort_period IN ('hourly','daily','weekly','monthly','quarterly','yearly')),
  metric_to_track TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  cohorts JSONB DEFAULT '[]',
  retention_matrix JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cohort_analyses_tenant ON public.cohort_analyses(tenant_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cohort_analyses TO authenticated;
GRANT ALL ON public.cohort_analyses TO service_role;
ALTER TABLE public.cohort_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage cohorts" ON public.cohort_analyses FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.funnel_analyses (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  total_entrants INTEGER NOT NULL DEFAULT 0,
  conversion_rate REAL NOT NULL DEFAULT 0,
  step_conversions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_funnel_analyses_tenant ON public.funnel_analyses(tenant_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funnel_analyses TO authenticated;
GRANT ALL ON public.funnel_analyses TO service_role;
ALTER TABLE public.funnel_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage funnels" ON public.funnel_analyses FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.predictive_forecasts (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  metric_id TEXT NOT NULL REFERENCES public.analytics_metrics(id) ON DELETE CASCADE,
  forecast_period TEXT NOT NULL CHECK (forecast_period IN ('hourly','daily','weekly','monthly','quarterly','yearly')),
  forecast_horizon INTEGER NOT NULL,
  model_type TEXT NOT NULL CHECK (model_type IN ('linear','exponential','arima','prophet')),
  model_confidence REAL NOT NULL,
  historical_data JSONB DEFAULT '[]',
  forecast_data JSONB DEFAULT '[]',
  mape REAL NOT NULL DEFAULT 0,
  rmse REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_predictive_forecasts_tenant ON public.predictive_forecasts(tenant_id, metric_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictive_forecasts TO authenticated;
GRANT ALL ON public.predictive_forecasts TO service_role;
ALTER TABLE public.predictive_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage forecasts" ON public.predictive_forecasts FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
