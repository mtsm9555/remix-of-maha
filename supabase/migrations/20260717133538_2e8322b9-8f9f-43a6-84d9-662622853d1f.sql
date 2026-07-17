
-- Cache entries
CREATE TABLE public.cache_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('L1_MEMORY','L2_REDIS','L3_DATABASE','SEMANTIC')),
  type TEXT NOT NULL CHECK (type IN ('llm_response','api_response','database_query','embedding','computation','static_asset')),
  serialized_value TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  tenant_id UUID,
  workspace_id UUID,
  correlation_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  access_count INTEGER NOT NULL DEFAULT 0,
  invalidation_tags TEXT[] NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  hit_count INTEGER NOT NULL DEFAULT 0,
  miss_count INTEGER NOT NULL DEFAULT 0,
  embedding JSONB,
  similarity_threshold REAL,
  original_cost_usd NUMERIC(12,6),
  saved_cost_usd NUMERIC(12,6) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, key, level)
);
CREATE INDEX idx_cache_entries_expires ON public.cache_entries(expires_at);
CREATE INDEX idx_cache_entries_tags ON public.cache_entries USING GIN(invalidation_tags);
CREATE INDEX idx_cache_entries_tenant ON public.cache_entries(tenant_id, type);
GRANT SELECT ON public.cache_entries TO authenticated;
GRANT ALL ON public.cache_entries TO service_role;
ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view cache entries" ON public.cache_entries FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Cache configs
CREATE TABLE public.cache_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled_levels TEXT[] NOT NULL DEFAULT ARRAY['L1_MEMORY','L3_DATABASE'],
  l1_max_size_mb INTEGER NOT NULL DEFAULT 128,
  l1_default_ttl_seconds INTEGER NOT NULL DEFAULT 300,
  l1_invalidation_policy TEXT NOT NULL DEFAULT 'lru',
  l2_default_ttl_seconds INTEGER NOT NULL DEFAULT 3600,
  l2_invalidation_policy TEXT NOT NULL DEFAULT 'ttl',
  l2_max_memory_mb INTEGER NOT NULL DEFAULT 1024,
  l3_default_ttl_seconds INTEGER NOT NULL DEFAULT 86400,
  l3_invalidation_policy TEXT NOT NULL DEFAULT 'ttl',
  semantic_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  semantic_similarity_threshold REAL NOT NULL DEFAULT 0.92,
  semantic_max_entries INTEGER NOT NULL DEFAULT 10000,
  semantic_default_ttl_seconds INTEGER NOT NULL DEFAULT 86400,
  default_strategy TEXT NOT NULL DEFAULT 'cache_aside',
  track_cost_savings BOOLEAN NOT NULL DEFAULT TRUE,
  min_cost_to_cache_usd NUMERIC(12,6) NOT NULL DEFAULT 0,
  enable_tenant_isolation BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cache_configs TO authenticated;
GRANT ALL ON public.cache_configs TO service_role;
ALTER TABLE public.cache_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage cache configs" ON public.cache_configs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Cache invalidation events
CREATE TABLE public.cache_invalidation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  scope TEXT NOT NULL,
  target TEXT NOT NULL,
  entries_removed INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  triggered_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cache_invalidation_events TO authenticated;
GRANT ALL ON public.cache_invalidation_events TO service_role;
ALTER TABLE public.cache_invalidation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view cache invalidation" ON public.cache_invalidation_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Backup jobs
CREATE TABLE public.backup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('full','incremental','differential')),
  target TEXT NOT NULL CHECK (target IN ('database','files','configurations','complete')),
  storage TEXT NOT NULL CHECK (storage IN ('local','s3','gcs','azure_blob','cross_region')),
  include_tables TEXT[] DEFAULT '{}',
  include_paths TEXT[] DEFAULT '{}',
  exclude_tables TEXT[] DEFAULT '{}',
  exclude_paths TEXT[] DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','failed','verified','expired')),
  progress INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  backup_id TEXT NOT NULL UNIQUE,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  compressed_size_bytes BIGINT NOT NULL DEFAULT 0,
  compression_ratio REAL NOT NULL DEFAULT 0,
  file_count INTEGER NOT NULL DEFAULT 0,
  checksum_sha256 TEXT NOT NULL DEFAULT '',
  storage_path TEXT NOT NULL DEFAULT '',
  storage_region TEXT NOT NULL DEFAULT 'auto',
  encrypted BOOLEAN NOT NULL DEFAULT TRUE,
  encryption_key_id TEXT,
  retention_days INTEGER NOT NULL DEFAULT 30,
  expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verification_status TEXT CHECK (verification_status IN ('pending','passed','failed')),
  verification_details TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_backup_jobs_tenant ON public.backup_jobs(tenant_id, created_at DESC);
CREATE INDEX idx_backup_jobs_status ON public.backup_jobs(status);
GRANT SELECT ON public.backup_jobs TO authenticated;
GRANT ALL ON public.backup_jobs TO service_role;
ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view backup jobs" ON public.backup_jobs FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "Admins manage backup jobs" ON public.backup_jobs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Backup policies
CREATE TABLE public.backup_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('hourly','daily','weekly','monthly')),
  cron_expression TEXT,
  retention_days INTEGER NOT NULL DEFAULT 30,
  max_backups INTEGER NOT NULL DEFAULT 100,
  type TEXT NOT NULL CHECK (type IN ('full','incremental','differential')),
  target TEXT NOT NULL CHECK (target IN ('database','files','configurations','complete')),
  storage TEXT NOT NULL CHECK (storage IN ('local','s3','gcs','azure_blob','cross_region')),
  include_tables TEXT[] DEFAULT '{}',
  include_paths TEXT[] DEFAULT '{}',
  exclude_tables TEXT[] DEFAULT '{}',
  exclude_paths TEXT[] DEFAULT '{}',
  encrypted BOOLEAN NOT NULL DEFAULT TRUE,
  encryption_key_id TEXT,
  compression_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  compression_level INTEGER NOT NULL DEFAULT 6,
  enable_cross_region_replication BOOLEAN NOT NULL DEFAULT FALSE,
  replica_regions TEXT[] DEFAULT '{}',
  auto_verify BOOLEAN NOT NULL DEFAULT TRUE,
  verification_frequency TEXT NOT NULL DEFAULT 'every_backup',
  notify_on_success BOOLEAN NOT NULL DEFAULT FALSE,
  notify_on_failure BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_backup_policies_tenant ON public.backup_policies(tenant_id);
CREATE INDEX idx_backup_policies_next_run ON public.backup_policies(next_run_at) WHERE is_active;
GRANT SELECT ON public.backup_policies TO authenticated;
GRANT ALL ON public.backup_policies TO service_role;
ALTER TABLE public.backup_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view backup policies" ON public.backup_policies FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "Admins manage backup policies" ON public.backup_policies FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Restore jobs
CREATE TABLE public.restore_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  backup_id TEXT NOT NULL,
  target_database TEXT,
  target_path TEXT,
  overwrite_existing BOOLEAN NOT NULL DEFAULT FALSE,
  restore_to_timestamp TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','failed','verified')),
  progress INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  restored_file_count INTEGER NOT NULL DEFAULT 0,
  restored_size_bytes BIGINT NOT NULL DEFAULT 0,
  post_restore_verification BOOLEAN NOT NULL DEFAULT TRUE,
  verification_result TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_restore_jobs_tenant ON public.restore_jobs(tenant_id, created_at DESC);
GRANT SELECT ON public.restore_jobs TO authenticated;
GRANT ALL ON public.restore_jobs TO service_role;
ALTER TABLE public.restore_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view restore jobs" ON public.restore_jobs FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id, auth.uid()));
CREATE POLICY "Admins manage restore jobs" ON public.restore_jobs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Backup verification logs
CREATE TABLE public.backup_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_job_id UUID NOT NULL REFERENCES public.backup_jobs(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  verification_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('passed','failed')),
  checksum_expected TEXT,
  checksum_actual TEXT,
  details TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_backup_verif_job ON public.backup_verification_logs(backup_job_id);
GRANT SELECT ON public.backup_verification_logs TO authenticated;
GRANT ALL ON public.backup_verification_logs TO service_role;
ALTER TABLE public.backup_verification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view verif logs" ON public.backup_verification_logs FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id, auth.uid()));

-- updated_at triggers
CREATE TRIGGER trg_cache_entries_updated BEFORE UPDATE ON public.cache_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cache_configs_updated BEFORE UPDATE ON public.cache_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_backup_jobs_updated BEFORE UPDATE ON public.backup_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_backup_policies_updated BEFORE UPDATE ON public.backup_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_restore_jobs_updated BEFORE UPDATE ON public.restore_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
