
-- retention_policies
CREATE TABLE public.retention_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  applies_to JSONB NOT NULL,
  retention_days INTEGER NOT NULL,
  action_after_retention TEXT NOT NULL CHECK (action_after_retention IN ('archive','delete','anonymize')),
  legal_hold_capable BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT ON public.retention_policies TO authenticated;
GRANT ALL ON public.retention_policies TO service_role;
ALTER TABLE public.retention_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view retention policies" ON public.retention_policies
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- dsar_requests
CREATE TABLE public.dsar_requests (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('access','deletion','portability','correction')),
  status TEXT NOT NULL CHECK (status IN ('pending','processing','completed','rejected')),
  scope JSONB NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  processed_by TEXT NOT NULL,
  notes TEXT
);
CREATE INDEX idx_dsar_user ON public.dsar_requests(user_id, requested_at DESC);
GRANT SELECT, INSERT ON public.dsar_requests TO authenticated;
GRANT ALL ON public.dsar_requests TO service_role;
ALTER TABLE public.dsar_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own DSAR" ON public.dsar_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own DSAR" ON public.dsar_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- legal_holds
CREATE TABLE public.legal_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);
GRANT SELECT ON public.legal_holds TO authenticated;
GRANT ALL ON public.legal_holds TO service_role;
ALTER TABLE public.legal_holds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view legal holds" ON public.legal_holds
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- compliance_audit_log (immutable)
CREATE TABLE public.compliance_audit_log (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_id TEXT,
  entity_type TEXT,
  user_id UUID,
  details JSONB NOT NULL DEFAULT '{}',
  performed_by TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_log_time ON public.compliance_audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_event ON public.compliance_audit_log(event_type, timestamp DESC);
CREATE INDEX idx_audit_log_user ON public.compliance_audit_log(user_id, timestamp DESC);
GRANT SELECT ON public.compliance_audit_log TO authenticated;
GRANT ALL ON public.compliance_audit_log TO service_role;
ALTER TABLE public.compliance_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit log" ON public.compliance_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed default retention policies
INSERT INTO public.retention_policies (id, name, description, applies_to, retention_days, action_after_retention) VALUES
  ('policy_chat_90d', 'Chat Transcripts - 90 Days', 'Delete chat transcripts after 90 days',
   '{"dataTypes":["chat_transcript"]}'::jsonb, 90, 'delete'),
  ('policy_user_memory_1y', 'User Memories - 1 Year', 'Anonymize user memories after 1 year',
   '{"dataTypes":["user_memory"]}'::jsonb, 365, 'anonymize');
