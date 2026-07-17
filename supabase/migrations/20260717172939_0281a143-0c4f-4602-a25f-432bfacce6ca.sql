
CREATE TABLE IF NOT EXISTS public.indicators_of_compromise (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ip','domain','url','hash_md5','hash_sha256','email','user_agent','wallet_address')),
  value TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('malware','phishing','botnet','ransomware','apt','cryptomining','ddos','data_exfiltration','insider_threat','zero_day')),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  confidence REAL NOT NULL DEFAULT 0.8,
  mitre_tactics TEXT[] DEFAULT '{}',
  mitre_techniques TEXT[] DEFAULT '{}',
  kill_chain_phase TEXT,
  source TEXT NOT NULL CHECK (source IN ('internal','threat_feed','community','manual','ml_detected')),
  source_feed TEXT,
  source_url TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  first_seen_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  expiration_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  hit_count INTEGER NOT NULL DEFAULT 0,
  last_hit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, type, value)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.indicators_of_compromise TO authenticated;
GRANT ALL ON public.indicators_of_compromise TO service_role;
ALTER TABLE public.indicators_of_compromise ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members can access iocs" ON public.indicators_of_compromise FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = indicators_of_compromise.tenant_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = indicators_of_compromise.tenant_id AND user_id = auth.uid()));
CREATE INDEX idx_ioc_tenant ON public.indicators_of_compromise(tenant_id, is_active);
CREATE INDEX idx_ioc_type_value ON public.indicators_of_compromise(tenant_id, type, value);

CREATE TABLE IF NOT EXISTS public.threat_feeds (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  feed_type TEXT NOT NULL CHECK (feed_type IN ('stix','taxii','csv','json','api')),
  feed_url TEXT NOT NULL,
  api_key TEXT,
  refresh_interval_minutes INTEGER NOT NULL DEFAULT 60,
  ioc_types TEXT[] NOT NULL DEFAULT '{}',
  min_confidence REAL NOT NULL DEFAULT 0.7,
  auto_import BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success','failed','partial')),
  total_iocs INTEGER NOT NULL DEFAULT 0,
  new_iocs_last_sync INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.threat_feeds TO authenticated;
GRANT ALL ON public.threat_feeds TO service_role;
ALTER TABLE public.threat_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members can access threat feeds" ON public.threat_feeds FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = threat_feeds.tenant_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = threat_feeds.tenant_id AND user_id = auth.uid()));
CREATE INDEX idx_feeds_tenant ON public.threat_feeds(tenant_id, is_active);

CREATE TABLE IF NOT EXISTS public.behavioral_baselines (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user','agent','api_key','service_account')),
  metrics JSONB NOT NULL DEFAULT '{}',
  hourly_patterns REAL[] NOT NULL DEFAULT '{}',
  day_of_week_patterns REAL[] NOT NULL DEFAULT '{}',
  common_locations TEXT[] DEFAULT '{}',
  common_ips TEXT[] DEFAULT '{}',
  common_user_agents TEXT[] DEFAULT '{}',
  baseline_period JSONB NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.5,
  sample_size INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(tenant_id, entity_id, entity_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.behavioral_baselines TO authenticated;
GRANT ALL ON public.behavioral_baselines TO service_role;
ALTER TABLE public.behavioral_baselines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members can access baselines" ON public.behavioral_baselines FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = behavioral_baselines.tenant_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = behavioral_baselines.tenant_id AND user_id = auth.uid()));
CREATE INDEX idx_baselines_tenant ON public.behavioral_baselines(tenant_id, is_active);

CREATE TABLE IF NOT EXISTS public.behavioral_anomalies (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  baseline_id TEXT NOT NULL REFERENCES public.behavioral_baselines(id),
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  metric TEXT NOT NULL,
  current_value REAL NOT NULL,
  baseline_value REAL NOT NULL,
  deviation_score REAL NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('spike','drop','pattern_break','location_anomaly','temporal_anomaly')),
  context JSONB DEFAULT '{}',
  contributing_factors TEXT[] DEFAULT '{}',
  risk_score INTEGER NOT NULL DEFAULT 0,
  potential_threat TEXT,
  detected_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.behavioral_anomalies TO authenticated;
GRANT ALL ON public.behavioral_anomalies TO service_role;
ALTER TABLE public.behavioral_anomalies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members can access anomalies" ON public.behavioral_anomalies FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = behavioral_anomalies.tenant_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = behavioral_anomalies.tenant_id AND user_id = auth.uid()));
CREATE INDEX idx_anomalies_tenant ON public.behavioral_anomalies(tenant_id, detected_at DESC);

CREATE TABLE IF NOT EXISTS public.attack_chains (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tactics TEXT[] NOT NULL DEFAULT '{}',
  techniques TEXT[] DEFAULT '{}',
  kill_chain_phases TEXT[] NOT NULL DEFAULT '{}',
  related_event_ids TEXT[] NOT NULL DEFAULT '{}',
  event_sequence JSONB NOT NULL DEFAULT '[]',
  confidence REAL NOT NULL DEFAULT 0.5,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  attack_vector TEXT,
  target_resources TEXT[] DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('detected','investigating','confirmed','mitigated')),
  detected_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attack_chains TO authenticated;
GRANT ALL ON public.attack_chains TO service_role;
ALTER TABLE public.attack_chains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members can access attack chains" ON public.attack_chains FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = attack_chains.tenant_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = attack_chains.tenant_id AND user_id = auth.uid()));
CREATE INDEX idx_chains_tenant ON public.attack_chains(tenant_id, detected_at DESC);

CREATE TABLE IF NOT EXISTS public.threat_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user','agent','ip','domain','api_key')),
  overall_risk_score INTEGER NOT NULL,
  behavioral_risk_score INTEGER NOT NULL,
  reputation_risk_score INTEGER NOT NULL,
  ioc_hit_score INTEGER NOT NULL,
  contributing_factors JSONB DEFAULT '[]',
  trend TEXT NOT NULL CHECK (trend IN ('improving','stable','degrading')),
  trend_change REAL NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.threat_scores TO authenticated;
GRANT ALL ON public.threat_scores TO service_role;
ALTER TABLE public.threat_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members can access threat scores" ON public.threat_scores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = threat_scores.tenant_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = threat_scores.tenant_id AND user_id = auth.uid()));
CREATE INDEX idx_scores_tenant ON public.threat_scores(tenant_id, calculated_at DESC);
CREATE INDEX idx_scores_entity ON public.threat_scores(tenant_id, entity_id, entity_type, calculated_at DESC);
