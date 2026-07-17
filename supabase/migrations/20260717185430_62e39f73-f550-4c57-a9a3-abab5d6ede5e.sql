
CREATE TABLE IF NOT EXISTS public.executive_dashboards (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('CEO','CFO','COO','CTO','CMO','CRO')),
  is_default BOOLEAN DEFAULT TRUE,
  financial_health JSONB DEFAULT '{}',
  growth_metrics JSONB DEFAULT '{}',
  operational_metrics JSONB DEFAULT '{}',
  market_metrics JSONB DEFAULT '{}',
  insights JSONB DEFAULT '[]',
  risks JSONB DEFAULT '[]',
  opportunities JSONB DEFAULT '[]',
  okrs JSONB DEFAULT '[]',
  briefing_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (briefing_frequency IN ('daily','weekly','monthly','quarterly')),
  last_briefing_at TIMESTAMPTZ,
  next_briefing_at TIMESTAMPTZ,
  owner_id TEXT NOT NULL,
  shared_with TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exec_dashboards_tenant ON public.executive_dashboards(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_exec_dashboards_owner ON public.executive_dashboards(tenant_id, owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.executive_dashboards TO authenticated;
GRANT ALL ON public.executive_dashboards TO service_role;
ALTER TABLE public.executive_dashboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members manage exec dashboards" ON public.executive_dashboards FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.executive_kpis (
  id TEXT PRIMARY KEY,
  dashboard_id TEXT NOT NULL REFERENCES public.executive_dashboards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('financial','growth','operational','customer','market')),
  description TEXT NOT NULL,
  current_value REAL NOT NULL,
  target_value REAL NOT NULL,
  previous_value REAL,
  status TEXT NOT NULL CHECK (status IN ('exceeding','on_track','at_risk','critical')),
  trend TEXT NOT NULL CHECK (trend IN ('strong_up','up','stable','down','strong_down')),
  change_percent REAL NOT NULL,
  unit TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('number','currency','percentage','duration')),
  period TEXT NOT NULL CHECK (period IN ('daily','weekly','monthly','quarterly','yearly')),
  historical_data JSONB DEFAULT '[]',
  alert_thresholds JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exec_kpis_dashboard ON public.executive_kpis(dashboard_id, category);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.executive_kpis TO authenticated;
GRANT ALL ON public.executive_kpis TO service_role;
ALTER TABLE public.executive_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members manage exec kpis" ON public.executive_kpis FOR ALL TO authenticated
  USING (dashboard_id IN (SELECT id FROM public.executive_dashboards WHERE tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())))
  WITH CHECK (dashboard_id IN (SELECT id FROM public.executive_dashboards WHERE tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())));

CREATE TABLE IF NOT EXISTS public.executive_insights (
  id TEXT PRIMARY KEY,
  dashboard_id TEXT NOT NULL REFERENCES public.executive_dashboards(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('opportunity','risk','anomaly','recommendation')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_level TEXT NOT NULL CHECK (impact_level IN ('low','medium','high','critical')),
  confidence INTEGER NOT NULL,
  related_kpis TEXT[] DEFAULT '{}',
  supporting_data JSONB DEFAULT '{}',
  recommended_action TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low','medium','high','urgent')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','actioned','dismissed')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exec_insights_dashboard ON public.executive_insights(dashboard_id, type, priority);
CREATE INDEX IF NOT EXISTS idx_exec_insights_status ON public.executive_insights(dashboard_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.executive_insights TO authenticated;
GRANT ALL ON public.executive_insights TO service_role;
ALTER TABLE public.executive_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members manage exec insights" ON public.executive_insights FOR ALL TO authenticated
  USING (dashboard_id IN (SELECT id FROM public.executive_dashboards WHERE tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())))
  WITH CHECK (dashboard_id IN (SELECT id FROM public.executive_dashboards WHERE tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())));

CREATE TABLE IF NOT EXISTS public.executive_risks (
  id TEXT PRIMARY KEY,
  dashboard_id TEXT NOT NULL REFERENCES public.executive_dashboards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('financial','operational','market','competitive','regulatory')),
  probability TEXT NOT NULL CHECK (probability IN ('low','medium','high')),
  impact TEXT NOT NULL CHECK (impact IN ('low','medium','high','critical')),
  risk_score INTEGER NOT NULL,
  mitigation_plan TEXT,
  owner TEXT,
  status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified','monitoring','mitigated','occurred')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exec_risks_dashboard ON public.executive_risks(dashboard_id, risk_score DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.executive_risks TO authenticated;
GRANT ALL ON public.executive_risks TO service_role;
ALTER TABLE public.executive_risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members manage exec risks" ON public.executive_risks FOR ALL TO authenticated
  USING (dashboard_id IN (SELECT id FROM public.executive_dashboards WHERE tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())))
  WITH CHECK (dashboard_id IN (SELECT id FROM public.executive_dashboards WHERE tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())));

CREATE TABLE IF NOT EXISTS public.executive_opportunities (
  id TEXT PRIMARY KEY,
  dashboard_id TEXT NOT NULL REFERENCES public.executive_dashboards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('market','product','partnership','acquisition','expansion','growth')),
  estimated_value REAL,
  probability INTEGER,
  time_horizon TEXT NOT NULL CHECK (time_horizon IN ('short','medium','long')),
  investment_required REAL,
  resources_needed TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified','evaluating','pursuing','captured','rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exec_opps_dashboard ON public.executive_opportunities(dashboard_id, estimated_value DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.executive_opportunities TO authenticated;
GRANT ALL ON public.executive_opportunities TO service_role;
ALTER TABLE public.executive_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members manage exec opps" ON public.executive_opportunities FOR ALL TO authenticated
  USING (dashboard_id IN (SELECT id FROM public.executive_dashboards WHERE tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())))
  WITH CHECK (dashboard_id IN (SELECT id FROM public.executive_dashboards WHERE tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid())));

CREATE TABLE IF NOT EXISTS public.executive_briefings (
  id TEXT PRIMARY KEY,
  dashboard_id TEXT NOT NULL REFERENCES public.executive_dashboards(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  period TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','quarterly')),
  executive_summary TEXT NOT NULL,
  key_highlights TEXT[] DEFAULT '{}',
  critical_issues TEXT[] DEFAULT '{}',
  strategic_recommendations TEXT[] DEFAULT '{}',
  kpi_snapshot JSONB DEFAULT '{}',
  financial_snapshot JSONB DEFAULT '{}',
  top_insights JSONB DEFAULT '[]',
  top_risks JSONB DEFAULT '[]',
  top_opportunities JSONB DEFAULT '[]',
  generated_at TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  delivered_to TEXT[] DEFAULT '{}',
  reviewed_by TEXT,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exec_briefings_dashboard ON public.executive_briefings(dashboard_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_exec_briefings_tenant ON public.executive_briefings(tenant_id, generated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.executive_briefings TO authenticated;
GRANT ALL ON public.executive_briefings TO service_role;
ALTER TABLE public.executive_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members manage exec briefings" ON public.executive_briefings FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));

CREATE TRIGGER trg_exec_dashboards_updated BEFORE UPDATE ON public.executive_dashboards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_exec_kpis_updated BEFORE UPDATE ON public.executive_kpis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_exec_risks_updated BEFORE UPDATE ON public.executive_risks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_exec_opps_updated BEFORE UPDATE ON public.executive_opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
