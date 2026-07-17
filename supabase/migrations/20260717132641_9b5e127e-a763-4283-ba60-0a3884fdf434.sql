
CREATE TABLE public.gpu_hardware (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL,
  vendor TEXT NOT NULL CHECK (vendor IN ('nvidia','amd','intel')),
  model TEXT NOT NULL,
  vram_gb INTEGER NOT NULL,
  cuda_cores INTEGER NOT NULL DEFAULT 0,
  tensor_cores INTEGER NOT NULL DEFAULT 0,
  memory_bandwidth_gb_ps INTEGER NOT NULL DEFAULT 0,
  tdp_watts INTEGER NOT NULL DEFAULT 0,
  supports_mig BOOLEAN NOT NULL DEFAULT FALSE,
  supports_fp8 BOOLEAN NOT NULL DEFAULT FALSE,
  supports_bf16 BOOLEAN NOT NULL DEFAULT FALSE,
  cuda_compute_capability TEXT NOT NULL DEFAULT '',
  driver_version TEXT NOT NULL DEFAULT '',
  cuda_version TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL CHECK (state IN ('available','allocated','reserved','maintenance','failed')),
  temperature_celsius REAL NOT NULL DEFAULT 0,
  power_usage_watts REAL NOT NULL DEFAULT 0,
  utilization_percent REAL NOT NULL DEFAULT 0,
  memory_used_gb REAL NOT NULL DEFAULT 0,
  memory_free_gb REAL NOT NULL DEFAULT 0,
  current_allocation_id TEXT,
  allocated_to_task_id TEXT,
  mig_instances JSONB NOT NULL DEFAULT '[]'::jsonb,
  pci_bus_id TEXT NOT NULL DEFAULT '',
  uuid TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL DEFAULT '',
  last_health_check_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gpu_hardware_state ON public.gpu_hardware(state);
CREATE INDEX idx_gpu_hardware_model ON public.gpu_hardware(model);
CREATE INDEX idx_gpu_hardware_node ON public.gpu_hardware(node_id);
GRANT SELECT ON public.gpu_hardware TO authenticated;
GRANT ALL ON public.gpu_hardware TO service_role;
ALTER TABLE public.gpu_hardware ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage GPU hardware" ON public.gpu_hardware FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated view GPU hardware" ON public.gpu_hardware FOR SELECT TO authenticated USING (true);

CREATE TABLE public.gpu_allocation_requests (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id UUID,
  required_vram_gb INTEGER NOT NULL,
  required_gpus INTEGER NOT NULL DEFAULT 1,
  preferred_gpu_model TEXT,
  min_cuda_compute_capability TEXT,
  max_cost_per_hour_usd REAL,
  max_latency_ms INTEGER,
  requires_mig BOOLEAN NOT NULL DEFAULT FALSE,
  requires_multi_gpu BOOLEAN NOT NULL DEFAULT FALSE,
  task_type TEXT NOT NULL CHECK (task_type IN ('inference','training','fine_tuning','embedding','custom')),
  estimated_duration_minutes INTEGER NOT NULL DEFAULT 60,
  priority TEXT NOT NULL CHECK (priority IN ('critical','high','normal','low','background')),
  model_name TEXT,
  model_size_gb REAL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gpu_reqs_tenant ON public.gpu_allocation_requests(tenant_id);
CREATE INDEX idx_gpu_reqs_priority ON public.gpu_allocation_requests(priority);
GRANT SELECT, INSERT ON public.gpu_allocation_requests TO authenticated;
GRANT ALL ON public.gpu_allocation_requests TO service_role;
ALTER TABLE public.gpu_allocation_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage GPU requests" ON public.gpu_allocation_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Tenant members view own GPU requests" ON public.gpu_allocation_requests FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.gpu_allocations (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  gpu_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  mig_instance_ids JSONB,
  total_vram_gb INTEGER NOT NULL,
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  estimated_completion_at TIMESTAMPTZ,
  actual_completion_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending','active','completed','failed','cancelled')),
  cost_per_hour_usd REAL NOT NULL DEFAULT 0,
  total_cost_usd REAL,
  average_utilization REAL,
  average_temperature REAL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_gpu_alloc_tenant ON public.gpu_allocations(tenant_id);
CREATE INDEX idx_gpu_alloc_status ON public.gpu_allocations(status);
GRANT SELECT ON public.gpu_allocations TO authenticated;
GRANT ALL ON public.gpu_allocations TO service_role;
ALTER TABLE public.gpu_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage GPU allocations" ON public.gpu_allocations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Tenant members view own GPU allocations" ON public.gpu_allocations FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.gpu_queue (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  priority TEXT NOT NULL,
  score REAL NOT NULL DEFAULT 0,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  estimated_wait_time_minutes INTEGER NOT NULL DEFAULT 0,
  required_vram_gb INTEGER NOT NULL,
  required_gpus INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued','scheduled','cancelled'))
);
CREATE INDEX idx_gpu_queue_score ON public.gpu_queue(score DESC);
CREATE INDEX idx_gpu_queue_status ON public.gpu_queue(status);
GRANT SELECT ON public.gpu_queue TO authenticated;
GRANT ALL ON public.gpu_queue TO service_role;
ALTER TABLE public.gpu_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage GPU queue" ON public.gpu_queue FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated view GPU queue" ON public.gpu_queue FOR SELECT TO authenticated USING (true);

CREATE TABLE public.gpu_health_metrics (
  id BIGSERIAL PRIMARY KEY,
  gpu_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  temperature_celsius REAL NOT NULL DEFAULT 0,
  power_usage_watts REAL NOT NULL DEFAULT 0,
  utilization_percent REAL NOT NULL DEFAULT 0,
  memory_used_gb REAL NOT NULL DEFAULT 0,
  memory_free_gb REAL NOT NULL DEFAULT 0,
  clock_speed_mhz INTEGER NOT NULL DEFAULT 0,
  fan_speed_percent REAL NOT NULL DEFAULT 0,
  ecc_errors INTEGER NOT NULL DEFAULT 0,
  xid_errors INTEGER NOT NULL DEFAULT 0,
  thermal_throttling BOOLEAN NOT NULL DEFAULT FALSE,
  power_throttling BOOLEAN NOT NULL DEFAULT FALSE,
  health_score REAL NOT NULL DEFAULT 100,
  alerts JSONB NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX idx_gpu_health_gpu_ts ON public.gpu_health_metrics(gpu_id, timestamp DESC);
GRANT SELECT ON public.gpu_health_metrics TO authenticated;
GRANT ALL ON public.gpu_health_metrics TO service_role;
ALTER TABLE public.gpu_health_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage GPU health" ON public.gpu_health_metrics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated view GPU health" ON public.gpu_health_metrics FOR SELECT TO authenticated USING (true);

CREATE TABLE public.gpu_scheduling_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  allocation_strategy TEXT NOT NULL CHECK (allocation_strategy IN ('best_fit','first_fit','spread','pack')),
  enable_mig BOOLEAN NOT NULL DEFAULT FALSE,
  enable_gpu_sharing BOOLEAN NOT NULL DEFAULT FALSE,
  max_utilization_threshold REAL NOT NULL DEFAULT 90,
  priority_weights JSONB NOT NULL DEFAULT '{"critical":100,"high":50,"normal":10,"low":5,"background":1}'::jsonb,
  prefer_spot_instances BOOLEAN NOT NULL DEFAULT FALSE,
  max_spot_price_multiplier REAL NOT NULL DEFAULT 1.5,
  reserved_instance_utilization_target REAL NOT NULL DEFAULT 80,
  max_temperature_celsius REAL NOT NULL DEFAULT 85,
  max_power_usage_percent REAL NOT NULL DEFAULT 95,
  enable_automatic_failover BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gpu_scheduling_policies TO authenticated;
GRANT ALL ON public.gpu_scheduling_policies TO service_role;
ALTER TABLE public.gpu_scheduling_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage GPU policies" ON public.gpu_scheduling_policies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated view GPU policies" ON public.gpu_scheduling_policies FOR SELECT TO authenticated USING (true);

CREATE TABLE public.gpu_cost_records (
  id TEXT PRIMARY KEY,
  allocation_id TEXT NOT NULL,
  gpu_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  duration_hours REAL NOT NULL DEFAULT 0,
  utilization_percent REAL NOT NULL DEFAULT 0,
  cost_per_hour_usd REAL NOT NULL DEFAULT 0,
  total_cost_usd REAL NOT NULL DEFAULT 0,
  instance_type TEXT NOT NULL CHECK (instance_type IN ('on_demand','spot','reserved')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gpu_cost_tenant ON public.gpu_cost_records(tenant_id);
CREATE INDEX idx_gpu_cost_alloc ON public.gpu_cost_records(allocation_id);
GRANT SELECT ON public.gpu_cost_records TO authenticated;
GRANT ALL ON public.gpu_cost_records TO service_role;
ALTER TABLE public.gpu_cost_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage GPU cost records" ON public.gpu_cost_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Tenant members view own GPU costs" ON public.gpu_cost_records FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TRIGGER update_gpu_hardware_updated_at BEFORE UPDATE ON public.gpu_hardware
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_gpu_scheduling_policies_updated_at BEFORE UPDATE ON public.gpu_scheduling_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
