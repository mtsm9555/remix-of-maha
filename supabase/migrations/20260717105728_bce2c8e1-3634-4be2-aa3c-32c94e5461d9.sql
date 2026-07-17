CREATE TABLE IF NOT EXISTS public.retrieval_events (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('project','department','user','shared')),
  query_text TEXT NOT NULL,
  latency_ms REAL NOT NULL,
  results_returned INTEGER NOT NULL,
  tokens_consumed INTEGER NOT NULL,
  estimated_cost_usd REAL NOT NULL,
  avg_relevance_score REAL NOT NULL DEFAULT 0.0,
  memory_ids_fetched TEXT[] NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_retrieval_events_time ON public.retrieval_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_retrieval_events_source ON public.retrieval_events(source, timestamp DESC);

GRANT SELECT ON public.retrieval_events TO authenticated;
GRANT ALL ON public.retrieval_events TO service_role;
ALTER TABLE public.retrieval_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read retrieval events"
  ON public.retrieval_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.calculate_memory_health_stats()
RETURNS TABLE (
  memory_id TEXT,
  source TEXT,
  total_retrievals BIGINT,
  avg_relevance REAL,
  last_retrieved TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    unnested.memory_id,
    re.source,
    COUNT(*)::BIGINT AS total_retrievals,
    AVG(re.avg_relevance_score)::REAL AS avg_relevance,
    MAX(re.timestamp) AS last_retrieved
  FROM public.retrieval_events re,
       LATERAL unnest(re.memory_ids_fetched) AS unnested(memory_id)
  WHERE re.timestamp > now() - INTERVAL '30 days'
  GROUP BY unnested.memory_id, re.source
  HAVING COUNT(*) > 0;
END;
$$;