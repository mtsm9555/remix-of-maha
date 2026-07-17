
CREATE TABLE public.compliance_controls (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  framework TEXT NOT NULL CHECK (framework IN ('GDPR','CCPA','SOC2','ISO27001','HIPAA','PCI_DSS','FedRAMP','custom')),
  control_id TEXT NOT NULL,
  control_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  requirement TEXT NOT NULL,
  implementation_guidance TEXT,
  status TEXT NOT NULL CHECK (status IN ('compliant','non_compliant','partial','not_applicable','not_assessed')),
  last_assessed_at TIMESTAMPTZ,
  assessed_by TEXT,
  evidence_collected INTEGER NOT NULL DEFAULT 0,
  last_evidence_at TIMESTAMPTZ,
  auto_monitorable BOOLEAN DEFAULT FALSE,
  monitoring_query TEXT,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low','medium','high','critical')),
  gap_severity TEXT CHECK (gap_severity IN ('minor','major','critical')),
  remediation_plan TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, framework, control_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_controls TO authenticated;
GRANT ALL ON public.compliance_controls TO service_role;
ALTER TABLE public.compliance_controls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compliance_controls tenant access" ON public.compliance_controls FOR ALL TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE INDEX idx_controls_tenant ON public.compliance_controls(tenant_id, framework);
CREATE INDEX idx_controls_status ON public.compliance_controls(tenant_id, status);

CREATE TABLE public.compliance_evidence (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  control_id TEXT NOT NULL REFERENCES public.compliance_controls(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('automated','manual','document','screenshot','log_export','configuration')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  file_size_bytes BIGINT,
  collected_at TIMESTAMPTZ NOT NULL,
  collected_by TEXT NOT NULL,
  collection_method TEXT NOT NULL CHECK (collection_method IN ('automated','manual','api')),
  is_valid BOOLEAN DEFAULT FALSE,
  validation_notes TEXT,
  validated_at TIMESTAMPTZ,
  validated_by TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_evidence TO authenticated;
GRANT ALL ON public.compliance_evidence TO service_role;
ALTER TABLE public.compliance_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compliance_evidence tenant access" ON public.compliance_evidence FOR ALL TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE INDEX idx_evidence_tenant ON public.compliance_evidence(tenant_id, control_id);
CREATE INDEX idx_evidence_collected ON public.compliance_evidence(tenant_id, collected_at DESC);
CREATE INDEX idx_evidence_expires ON public.compliance_evidence(expires_at) WHERE expires_at IS NOT NULL;

CREATE TABLE public.compliance_reports (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('assessment','gap_analysis','audit_ready','certification')),
  title TEXT NOT NULL,
  description TEXT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  overall_score INTEGER NOT NULL,
  total_controls INTEGER NOT NULL,
  compliant_controls INTEGER NOT NULL,
  non_compliant_controls INTEGER NOT NULL,
  partial_controls INTEGER NOT NULL,
  not_applicable_controls INTEGER NOT NULL,
  critical_gaps INTEGER NOT NULL DEFAULT 0,
  major_gaps INTEGER NOT NULL DEFAULT 0,
  minor_gaps INTEGER NOT NULL DEFAULT 0,
  total_evidence INTEGER NOT NULL,
  automated_evidence INTEGER NOT NULL,
  manual_evidence INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','in_progress','completed','approved','published')),
  generated_at TIMESTAMPTZ NOT NULL,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  findings JSONB DEFAULT '[]',
  recommendations TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_reports TO authenticated;
GRANT ALL ON public.compliance_reports TO service_role;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compliance_reports tenant access" ON public.compliance_reports FOR ALL TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE INDEX idx_reports_tenant ON public.compliance_reports(tenant_id, framework);
CREATE INDEX idx_reports_generated ON public.compliance_reports(tenant_id, generated_at DESC);

CREATE TABLE public.compliance_certifications (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,
  certification_name TEXT NOT NULL,
  certifying_body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('certified','pending','expired','revoked','in_progress')),
  certification_number TEXT,
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_audit_at TIMESTAMPTZ,
  next_audit_at TIMESTAMPTZ,
  scope TEXT NOT NULL,
  locations TEXT[] DEFAULT '{}',
  audit_report_url TEXT,
  certificate_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_certifications TO authenticated;
GRANT ALL ON public.compliance_certifications TO service_role;
ALTER TABLE public.compliance_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compliance_certifications tenant access" ON public.compliance_certifications FOR ALL TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE INDEX idx_certifications_tenant ON public.compliance_certifications(tenant_id, framework);
CREATE INDEX idx_certifications_status ON public.compliance_certifications(tenant_id, status);
CREATE INDEX idx_certifications_expires ON public.compliance_certifications(expires_at) WHERE expires_at IS NOT NULL;

CREATE TABLE public.data_residency_policies (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  requirement TEXT NOT NULL CHECK (requirement IN ('eu_only','us_only','specific_countries','no_restrictions')),
  allowed_countries TEXT[] DEFAULT '{}',
  allowed_regions TEXT[] DEFAULT '{}',
  enforce_on_create BOOLEAN DEFAULT TRUE,
  enforce_on_update BOOLEAN DEFAULT TRUE,
  block_non_compliant BOOLEAN DEFAULT FALSE,
  monitor_continuously BOOLEAN DEFAULT TRUE,
  alert_on_violation BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  violations INTEGER NOT NULL DEFAULT 0,
  last_violation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_residency_policies TO authenticated;
GRANT ALL ON public.data_residency_policies TO service_role;
ALTER TABLE public.data_residency_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "data_residency_policies tenant access" ON public.data_residency_policies FOR ALL TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE INDEX idx_residency_tenant ON public.data_residency_policies(tenant_id, is_active);

CREATE TABLE public.consent_records (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  consent_text TEXT,
  granted_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  withdrawn_by TEXT,
  proof_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consent_records TO authenticated;
GRANT ALL ON public.consent_records TO service_role;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consent_records self view" ON public.consent_records FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "consent_records tenant manage" ON public.consent_records FOR INSERT TO authenticated WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id) OR user_id = auth.uid());
CREATE POLICY "consent_records tenant update" ON public.consent_records FOR UPDATE TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "consent_records tenant delete" ON public.consent_records FOR DELETE TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE INDEX idx_consent_tenant ON public.consent_records(tenant_id, user_id);
CREATE INDEX idx_consent_purpose ON public.consent_records(tenant_id, purpose);
CREATE INDEX idx_consent_granted ON public.consent_records(tenant_id, granted, withdrawn_at);

CREATE TRIGGER trg_compliance_controls_updated BEFORE UPDATE ON public.compliance_controls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_compliance_reports_updated BEFORE UPDATE ON public.compliance_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_compliance_certifications_updated BEFORE UPDATE ON public.compliance_certifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_data_residency_policies_updated BEFORE UPDATE ON public.data_residency_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_consent_records_updated BEFORE UPDATE ON public.consent_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
