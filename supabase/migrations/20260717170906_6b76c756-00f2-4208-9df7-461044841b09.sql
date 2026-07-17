
CREATE TABLE IF NOT EXISTS public.approval_policies (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  action TEXT NOT NULL,
  conditions JSONB DEFAULT '[]',
  approval_type TEXT NOT NULL CHECK (approval_type IN ('single','multi','hierarchical','quorum')),
  required_approvers INTEGER NOT NULL DEFAULT 1,
  approver_roles TEXT[] DEFAULT '{}',
  approver_users TEXT[] DEFAULT '{}',
  approver_hierarchy TEXT[],
  timeout_minutes INTEGER NOT NULL DEFAULT 1440,
  auto_reject_on_timeout BOOLEAN DEFAULT TRUE,
  notify_approvers BOOLEAN DEFAULT TRUE,
  notify_requester BOOLEAN DEFAULT TRUE,
  notification_channels TEXT[] DEFAULT '{email,in_app}',
  is_active BOOLEAN DEFAULT TRUE,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_approval_policies_tenant ON public.approval_policies(tenant_id, action);
CREATE INDEX IF NOT EXISTS idx_approval_policies_active ON public.approval_policies(tenant_id, is_active);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_policies TO authenticated;
GRANT ALL ON public.approval_policies TO service_role;
ALTER TABLE public.approval_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage approval_policies" ON public.approval_policies
  FOR ALL TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id TEXT,
  policy_id TEXT NOT NULL REFERENCES public.approval_policies(id),
  action TEXT NOT NULL,
  priority TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL,
  target_resource_type TEXT,
  target_resource_id TEXT,
  target_resource_name TEXT,
  request_data JSONB NOT NULL DEFAULT '{}',
  justification TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected','expired','cancelled')),
  assigned_approvers JSONB DEFAULT '[]',
  current_approver_index INTEGER DEFAULT 0,
  decisions JSONB DEFAULT '[]',
  expires_at TIMESTAMPTZ NOT NULL,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  executed_by TEXT,
  execution_result JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_approval_requests_tenant ON public.approval_requests(tenant_id, status, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_requests_approver ON public.approval_requests USING gin (assigned_approvers);
CREATE INDEX IF NOT EXISTS idx_approval_requests_expires ON public.approval_requests(expires_at, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_requests TO authenticated;
GRANT ALL ON public.approval_requests TO service_role;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage approval_requests" ON public.approval_requests
  FOR ALL TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE IF NOT EXISTS public.approval_assignments (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  approver_id TEXT NOT NULL,
  approver_role TEXT,
  assigned_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected','skipped')),
  decision JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_approval_assignments_request ON public.approval_assignments(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_assignments_approver ON public.approval_assignments(approver_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_assignments TO authenticated;
GRANT ALL ON public.approval_assignments TO service_role;
ALTER TABLE public.approval_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage approval_assignments" ON public.approval_assignments
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.approval_requests r WHERE r.id = request_id AND public.is_tenant_member(auth.uid(), r.tenant_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.approval_requests r WHERE r.id = request_id AND public.is_tenant_member(auth.uid(), r.tenant_id))
  );

CREATE TABLE IF NOT EXISTS public.approval_decisions (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  approver_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved','rejected')),
  comments TEXT,
  decided_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_approval_decisions_request ON public.approval_decisions(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_decisions_approver ON public.approval_decisions(approver_id, decided_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_decisions TO authenticated;
GRANT ALL ON public.approval_decisions TO service_role;
ALTER TABLE public.approval_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage approval_decisions" ON public.approval_decisions
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.approval_requests r WHERE r.id = request_id AND public.is_tenant_member(auth.uid(), r.tenant_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.approval_requests r WHERE r.id = request_id AND public.is_tenant_member(auth.uid(), r.tenant_id))
  );

CREATE TABLE IF NOT EXISTS public.approval_notifications (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL,
  type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','slack','in_app')),
  sent_at TIMESTAMPTZ NOT NULL,
  read_at TIMESTAMPTZ,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_approval_notifications_recipient ON public.approval_notifications(recipient_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_notifications_read ON public.approval_notifications(recipient_id, read_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_notifications TO authenticated;
GRANT ALL ON public.approval_notifications TO service_role;
ALTER TABLE public.approval_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own approval notifications" ON public.approval_notifications
  FOR SELECT TO authenticated USING (recipient_id = auth.uid()::text);
CREATE POLICY "Users update own approval notifications" ON public.approval_notifications
  FOR UPDATE TO authenticated USING (recipient_id = auth.uid()::text) WITH CHECK (recipient_id = auth.uid()::text);

CREATE TABLE IF NOT EXISTS public.approval_executions (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('pending','executing','completed','failed')),
  executed_at TIMESTAMPTZ,
  executed_by TEXT,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_approval_executions_request ON public.approval_executions(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_executions_status ON public.approval_executions(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_executions TO authenticated;
GRANT ALL ON public.approval_executions TO service_role;
ALTER TABLE public.approval_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members manage approval_executions" ON public.approval_executions
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.approval_requests r WHERE r.id = request_id AND public.is_tenant_member(auth.uid(), r.tenant_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.approval_requests r WHERE r.id = request_id AND public.is_tenant_member(auth.uid(), r.tenant_id))
  );
