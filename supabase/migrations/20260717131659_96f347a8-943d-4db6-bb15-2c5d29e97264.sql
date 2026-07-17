
-- 1. AI Models
CREATE TABLE public.ai_models (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  max_context_tokens INTEGER NOT NULL,
  max_output_tokens INTEGER NOT NULL,
  supports_streaming BOOLEAN DEFAULT FALSE,
  supports_vision BOOLEAN DEFAULT FALSE,
  supports_function_calling BOOLEAN DEFAULT FALSE,
  average_latency_ms INTEGER NOT NULL DEFAULT 0,
  p95_latency_ms INTEGER NOT NULL DEFAULT 0,
  throughput_tokens_per_second INTEGER NOT NULL DEFAULT 0,
  cost_per_input_token_usd REAL NOT NULL DEFAULT 0,
  cost_per_output_token_usd REAL NOT NULL DEFAULT 0,
  cost_per_request_usd REAL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_available BOOLEAN DEFAULT TRUE,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 100,
  current_load REAL NOT NULL DEFAULT 0,
  version TEXT NOT NULL,
  released_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deprecated_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, model_name)
);
GRANT SELECT ON public.ai_models TO authenticated;
GRANT ALL ON public.ai_models TO service_role;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Models readable by authenticated" ON public.ai_models FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage models" ON public.ai_models FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_models_provider ON public.ai_models(provider);
CREATE INDEX idx_models_active ON public.ai_models(is_active, is_available);
CREATE INDEX idx_models_capabilities ON public.ai_models USING gin (capabilities);

-- 2. Routing Rules
CREATE TABLE public.model_routing_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '[]',
  logic TEXT NOT NULL DEFAULT 'AND' CHECK (logic IN ('AND','OR')),
  primary_model_id TEXT NOT NULL REFERENCES public.ai_models(id),
  fallback_model_ids TEXT[] DEFAULT '{}',
  fallback_strategy TEXT NOT NULL DEFAULT 'sequential' CHECK (fallback_strategy IN ('sequential','parallel','circuit_breaker')),
  max_cost_per_request_usd REAL,
  max_latency_ms INTEGER,
  min_confidence_score REAL,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.model_routing_rules TO authenticated;
GRANT ALL ON public.model_routing_rules TO service_role;
ALTER TABLE public.model_routing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View routing rules" ON public.model_routing_rules FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "Admins manage routing rules" ON public.model_routing_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_routing_rules_priority ON public.model_routing_rules(priority DESC);
CREATE INDEX idx_routing_rules_tenant ON public.model_routing_rules(tenant_id);

-- 3. Routing Decisions
CREATE TABLE public.model_routing_decisions (
  id TEXT PRIMARY KEY,
  selected_model_id TEXT NOT NULL REFERENCES public.ai_models(id),
  routing_rule_id TEXT REFERENCES public.model_routing_rules(id),
  strategy TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  score REAL NOT NULL,
  estimated_cost_usd REAL NOT NULL,
  estimated_latency_ms INTEGER NOT NULL,
  processing_time_ms INTEGER NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  task_complexity TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.model_routing_decisions TO authenticated;
GRANT ALL ON public.model_routing_decisions TO service_role;
ALTER TABLE public.model_routing_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View decisions" ON public.model_routing_decisions FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "Admins manage decisions" ON public.model_routing_decisions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_routing_decisions_tenant ON public.model_routing_decisions(tenant_id, timestamp DESC);
CREATE INDEX idx_routing_decisions_model ON public.model_routing_decisions(selected_model_id);

-- 4. Fallback Events
CREATE TABLE public.model_fallback_events (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  original_model_id TEXT NOT NULL REFERENCES public.ai_models(id),
  fallback_model_id TEXT NOT NULL REFERENCES public.ai_models(id),
  reason TEXT NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  success BOOLEAN NOT NULL
);
GRANT SELECT ON public.model_fallback_events TO authenticated;
GRANT ALL ON public.model_fallback_events TO service_role;
ALTER TABLE public.model_fallback_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage fallback events" ON public.model_fallback_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_fallback_events_request ON public.model_fallback_events(request_id);
CREATE INDEX idx_fallback_events_time ON public.model_fallback_events(triggered_at DESC);

-- 5. Cost Records
CREATE TABLE public.model_cost_records (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  model_id TEXT NOT NULL REFERENCES public.ai_models(id),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  input_cost_usd REAL NOT NULL,
  output_cost_usd REAL NOT NULL,
  total_cost_usd REAL NOT NULL,
  latency_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.model_cost_records TO authenticated;
GRANT ALL ON public.model_cost_records TO service_role;
ALTER TABLE public.model_cost_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View cost records" ON public.model_cost_records FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "Admins manage cost records" ON public.model_cost_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_cost_records_tenant ON public.model_cost_records(tenant_id, timestamp DESC);
CREATE INDEX idx_cost_records_model ON public.model_cost_records(model_id);
CREATE INDEX idx_cost_records_time ON public.model_cost_records(timestamp DESC);

-- updated_at triggers
CREATE TRIGGER trg_ai_models_updated BEFORE UPDATE ON public.ai_models FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_model_routing_rules_updated BEFORE UPDATE ON public.model_routing_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
