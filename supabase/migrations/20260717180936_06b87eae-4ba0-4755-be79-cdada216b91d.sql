
-- Pipelines first (deals reference it)
CREATE TABLE public.crm_pipelines (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  stages JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  total_deals INTEGER DEFAULT 0,
  total_value REAL DEFAULT 0,
  average_deal_size REAL DEFAULT 0,
  win_rate REAL DEFAULT 0,
  average_days_in_pipeline INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_pipelines TO authenticated;
GRANT ALL ON public.crm_pipelines TO service_role;
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_pipelines tenant access" ON public.crm_pipelines FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));
CREATE INDEX idx_crm_pipelines_tenant ON public.crm_pipelines(tenant_id, is_active);

-- Companies
CREATE TABLE public.crm_companies (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT CHECK (size IN ('startup','small','medium','enterprise')),
  annual_revenue REAL,
  funding_stage TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address JSONB DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('prospect','customer','partner','churned')),
  account_tier TEXT CHECK (account_tier IN ('bronze','silver','gold','platinum')),
  total_contacts INTEGER DEFAULT 0,
  total_deals INTEGER DEFAULT 0,
  total_revenue REAL DEFAULT 0,
  lifetime_value REAL,
  tags TEXT[] DEFAULT '{}',
  segments TEXT[] DEFAULT '{}',
  assigned_to TEXT,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, domain)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_companies TO authenticated;
GRANT ALL ON public.crm_companies TO service_role;
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_companies tenant access" ON public.crm_companies FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));
CREATE INDEX idx_crm_companies_tenant ON public.crm_companies(tenant_id, status);
CREATE INDEX idx_crm_companies_industry ON public.crm_companies(tenant_id, industry);
CREATE INDEX idx_crm_companies_tags ON public.crm_companies USING gin (tags);

-- Contacts
CREATE TABLE public.crm_contacts (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  title TEXT,
  company_id TEXT REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('lead','prospect','customer','churned','inactive')),
  lead_score INTEGER DEFAULT 0,
  lifecycle_stage TEXT,
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email','phone','sms')),
  timezone TEXT,
  language TEXT,
  linkedin_url TEXT,
  twitter_handle TEXT,
  website TEXT,
  address JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  segments TEXT[] DEFAULT '{}',
  consent_given BOOLEAN DEFAULT FALSE,
  consent_date TIMESTAMPTZ,
  do_not_contact BOOLEAN DEFAULT FALSE,
  source TEXT,
  assigned_to TEXT,
  last_activity_at TIMESTAMPTZ,
  next_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, email)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_contacts TO authenticated;
GRANT ALL ON public.crm_contacts TO service_role;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_contacts tenant access" ON public.crm_contacts FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));
CREATE INDEX idx_crm_contacts_tenant ON public.crm_contacts(tenant_id, status);
CREATE INDEX idx_crm_contacts_company ON public.crm_contacts(tenant_id, company_id);
CREATE INDEX idx_crm_contacts_tags ON public.crm_contacts USING gin (tags);

-- Deals
CREATE TABLE public.crm_deals (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  value REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  expected_close_date TIMESTAMPTZ,
  stage TEXT NOT NULL CHECK (stage IN ('qualification','proposal','negotiation','closed_won','closed_lost')),
  probability INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL CHECK (priority IN ('low','medium','high','critical')),
  company_id TEXT REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  contact_ids TEXT[] DEFAULT '{}',
  assigned_to TEXT,
  team_ids TEXT[] DEFAULT '{}',
  closed_at TIMESTAMPTZ,
  lost_reason TEXT,
  pipeline_id TEXT NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE RESTRICT,
  stage_entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tags TEXT[] DEFAULT '{}',
  source TEXT,
  campaign_id TEXT,
  forecast_category TEXT CHECK (forecast_category IN ('pipeline','best_case','commit','closed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_deals TO authenticated;
GRANT ALL ON public.crm_deals TO service_role;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_deals tenant access" ON public.crm_deals FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));
CREATE INDEX idx_crm_deals_tenant ON public.crm_deals(tenant_id, stage);
CREATE INDEX idx_crm_deals_company ON public.crm_deals(tenant_id, company_id);
CREATE INDEX idx_crm_deals_pipeline ON public.crm_deals(tenant_id, pipeline_id);
CREATE INDEX idx_crm_deals_value ON public.crm_deals(tenant_id, value DESC);

-- Activities
CREATE TABLE public.crm_activities (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call','email','meeting','note','task','demo','follow_up')),
  subject TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  status TEXT NOT NULL CHECK (status IN ('scheduled','completed','cancelled','overdue')),
  contact_ids TEXT[] DEFAULT '{}',
  company_id TEXT REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  deal_id TEXT REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  assigned_to TEXT,
  created_by TEXT NOT NULL,
  outcome TEXT,
  next_steps TEXT,
  tags TEXT[] DEFAULT '{}',
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_activities TO authenticated;
GRANT ALL ON public.crm_activities TO service_role;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_activities tenant access" ON public.crm_activities FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));
CREATE INDEX idx_crm_activities_tenant ON public.crm_activities(tenant_id, type, created_at DESC);
CREATE INDEX idx_crm_activities_status ON public.crm_activities(tenant_id, status);
CREATE INDEX idx_crm_activities_deal ON public.crm_activities(tenant_id, deal_id);
CREATE INDEX idx_crm_activities_contact ON public.crm_activities USING gin (contact_ids);

-- updated_at triggers
CREATE TRIGGER trg_crm_pipelines_updated BEFORE UPDATE ON public.crm_pipelines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_companies_updated BEFORE UPDATE ON public.crm_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_contacts_updated BEFORE UPDATE ON public.crm_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_deals_updated BEFORE UPDATE ON public.crm_deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_activities_updated BEFORE UPDATE ON public.crm_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
