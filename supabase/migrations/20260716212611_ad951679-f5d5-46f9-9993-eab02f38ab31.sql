
-- Reputation system tables
DROP TABLE IF EXISTS public.agent_reputation_scores CASCADE;

CREATE TABLE public.agent_reputation_metrics (
  agent_id TEXT PRIMARY KEY,
  success_rate REAL NOT NULL DEFAULT 0.5,
  average_qa_score REAL NOT NULL DEFAULT 0.5,
  human_override_rate REAL NOT NULL DEFAULT 0.0,
  budget_adherence REAL NOT NULL DEFAULT 1.0,
  sla_compliance REAL NOT NULL DEFAULT 1.0,
  self_correction_rate REAL NOT NULL DEFAULT 0.5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agent_reputation_metrics TO authenticated;
GRANT ALL ON public.agent_reputation_metrics TO service_role;
ALTER TABLE public.agent_reputation_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read reputation metrics" ON public.agent_reputation_metrics FOR SELECT TO authenticated USING (true);

CREATE TABLE public.agent_reputation_scores (
  agent_id TEXT PRIMARY KEY,
  department TEXT NOT NULL,
  composite_score REAL NOT NULL DEFAULT 0.5,
  trust_level TEXT NOT NULL CHECK (trust_level IN ('UNTRUSTED','NOVICE','TRUSTED','ELITE','SUSPENDED')),
  trend TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('rising','stable','falling')),
  total_tasks_evaluated INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agent_reputation_scores TO authenticated;
GRANT ALL ON public.agent_reputation_scores TO service_role;
ALTER TABLE public.agent_reputation_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read reputation scores" ON public.agent_reputation_scores FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_rep_scores_level ON public.agent_reputation_scores(trust_level);

CREATE TABLE public.reputation_events (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  score_impact REAL NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reputation_events TO authenticated;
GRANT ALL ON public.reputation_events TO service_role;
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read reputation events" ON public.reputation_events FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_rep_events_agent ON public.reputation_events(agent_id, created_at DESC);
