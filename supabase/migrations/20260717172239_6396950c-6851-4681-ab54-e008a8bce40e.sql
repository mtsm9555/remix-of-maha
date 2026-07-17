
CREATE TABLE IF NOT EXISTS public.security_events (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id TEXT,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info','low','medium','high','critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user','agent','api_key','system','unknown')),
  actor_email TEXT,
  actor_name TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  session_id TEXT,
  correlation_id TEXT,
  country TEXT,
  city TEXT,
  latitude REAL,
  longitude REAL,
  detection_method TEXT NOT NULL CHECK (detection_method IN ('rule','anomaly','ml_model','manual','threat_intel')),
  confidence_score REAL NOT NULL DEFAULT 1.0,
  rule_id TEXT,
  related_event_ids TEXT[] DEFAULT '{}',
  event_count INTEGER NOT NULL DEFAULT 1,
  risk_score INTEGER NOT NULL DEFAULT 0,
  potential_impact TEXT,
  recommended_action TEXT,
  details JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('detected','investigating','confirmed','mitigated','resolved','false_positive')),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  mitigated_at TIMESTAMPTZ,
  mitigated_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  detected_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_security_events_tenant ON public.security_events(tenant_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(tenant_id, event_type, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_actor ON public.security_events(tenant_id, actor_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON public.security_events(tenant_id, ip_address, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_status ON public.security_events(tenant_id, status, detected_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sec_events_tenant" ON public.security_events FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_security_events_updated BEFORE UPDATE ON public.security_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.security_rules (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info','low','medium','high','critical')),
  conditions JSONB DEFAULT '[]',
  logic TEXT NOT NULL DEFAULT 'AND' CHECK (logic IN ('AND','OR')),
  time_window_minutes INTEGER NOT NULL DEFAULT 60,
  threshold INTEGER NOT NULL DEFAULT 5,
  auto_acknowledge BOOLEAN DEFAULT FALSE,
  auto_mitigate BOOLEAN DEFAULT FALSE,
  mitigation_action TEXT,
  notify_channels TEXT[] DEFAULT ARRAY['email'],
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_security_rules_tenant ON public.security_rules(tenant_id, is_active);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_rules TO authenticated;
GRANT ALL ON public.security_rules TO service_role;
ALTER TABLE public.security_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sec_rules_tenant" ON public.security_rules FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_security_rules_updated BEFORE UPDATE ON public.security_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.security_incidents (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info','low','medium','high','critical')),
  category TEXT NOT NULL,
  related_event_ids TEXT[] DEFAULT '{}',
  event_count INTEGER NOT NULL DEFAULT 0,
  assigned_to TEXT,
  assigned_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('open','investigating','contained','resolved','closed')),
  priority TEXT NOT NULL CHECK (priority IN ('low','medium','high','critical')),
  detected_at TIMESTAMPTZ NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  contained_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  root_cause TEXT,
  lessons_learned TEXT,
  affected_users INTEGER,
  affected_resources TEXT[] DEFAULT '{}',
  data_compromised BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_security_incidents_tenant ON public.security_incidents(tenant_id, detected_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_incidents TO authenticated;
GRANT ALL ON public.security_incidents TO service_role;
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sec_incidents_tenant" ON public.security_incidents FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_security_incidents_updated BEFORE UPDATE ON public.security_incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.security_alerts (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info','low','medium','high','critical')),
  category TEXT NOT NULL,
  trigger_event_id TEXT,
  trigger_rule_id TEXT,
  related_event_ids TEXT[] DEFAULT '{}',
  notification_channels TEXT[] DEFAULT '{}',
  notified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('active','acknowledged','resolved','false_positive')),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_security_alerts_tenant ON public.security_alerts(tenant_id, status, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_alerts TO authenticated;
GRANT ALL ON public.security_alerts TO service_role;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sec_alerts_tenant" ON public.security_alerts FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_security_alerts_updated BEFORE UPDATE ON public.security_alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.incident_response_actions (
  id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL REFERENCES public.security_incidents(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB DEFAULT '{}',
  result TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incident_actions ON public.incident_response_actions(incident_id, performed_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incident_response_actions TO authenticated;
GRANT ALL ON public.incident_response_actions TO service_role;
ALTER TABLE public.incident_response_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sec_incident_actions_tenant" ON public.incident_response_actions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.security_incidents i WHERE i.id = incident_id AND public.is_tenant_member(auth.uid(), i.tenant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.security_incidents i WHERE i.id = incident_id AND public.is_tenant_member(auth.uid(), i.tenant_id)));

CREATE TABLE IF NOT EXISTS public.threat_intelligence (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('ip','domain','hash','user_agent','behavior_pattern')),
  value TEXT NOT NULL,
  threat_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info','low','medium','high','critical')),
  confidence REAL NOT NULL DEFAULT 1.0,
  source TEXT NOT NULL,
  source_url TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_threat_intel_lookup ON public.threat_intelligence(type, value, is_active);
GRANT SELECT ON public.threat_intelligence TO authenticated;
GRANT ALL ON public.threat_intelligence TO service_role;
ALTER TABLE public.threat_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "threat_intel_read" ON public.threat_intelligence FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_threat_intel_updated BEFORE UPDATE ON public.threat_intelligence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
