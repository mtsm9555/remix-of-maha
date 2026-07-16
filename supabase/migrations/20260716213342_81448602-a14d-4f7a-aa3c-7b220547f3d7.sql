
CREATE TABLE public.agent_instance_wallets (
  instance_id TEXT PRIMARY KEY,
  agent_type TEXT NOT NULL,
  department TEXT NOT NULL,
  current_balance_usd REAL NOT NULL DEFAULT 0,
  initial_allocation_usd REAL NOT NULL DEFAULT 0,
  total_spent_usd REAL NOT NULL DEFAULT 0,
  throttle_state TEXT NOT NULL DEFAULT 'NORMAL' CHECK (throttle_state IN ('NORMAL','THROTTLED','PAUSED','INSUFFICIENT_FUNDS')),
  last_topup_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agent_instance_wallets TO authenticated;
GRANT ALL ON public.agent_instance_wallets TO service_role;
ALTER TABLE public.agent_instance_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read wallets" ON public.agent_instance_wallets FOR SELECT TO authenticated USING (true);

CREATE TABLE public.micro_transaction_ledger (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  department TEXT NOT NULL,
  amount_usd REAL NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('llm_tokens','tool_execution','api_call','top_up')),
  reference_id TEXT NOT NULL,
  balance_after REAL NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.micro_transaction_ledger TO authenticated;
GRANT ALL ON public.micro_transaction_ledger TO service_role;
ALTER TABLE public.micro_transaction_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read ledger" ON public.micro_transaction_ledger FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_ledger_instance ON public.micro_transaction_ledger(instance_id, timestamp DESC);
CREATE INDEX idx_ledger_dept ON public.micro_transaction_ledger(department, timestamp DESC);

CREATE TABLE public.budget_topup_requests (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL,
  requested_amount_usd REAL NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','completed')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
GRANT SELECT ON public.budget_topup_requests TO authenticated;
GRANT ALL ON public.budget_topup_requests TO service_role;
ALTER TABLE public.budget_topup_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read topup requests" ON public.budget_topup_requests FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_topup_status ON public.budget_topup_requests(status);
