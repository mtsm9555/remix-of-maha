
CREATE TABLE IF NOT EXISTS public.graph_expansion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  duplicates_merged INTEGER NOT NULL DEFAULT 0,
  new_relationships INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT ON public.graph_expansion_logs TO authenticated;
GRANT ALL ON public.graph_expansion_logs TO service_role;
ALTER TABLE public.graph_expansion_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read graph_expansion_logs" ON public.graph_expansion_logs FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.transfer_edges(source_dup TEXT, target_primary TEXT, is_reverse BOOLEAN DEFAULT FALSE)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF is_reverse THEN
    UPDATE public.graph_edges SET target_name = target_primary WHERE source_name = source_dup;
  ELSE
    UPDATE public.graph_edges SET source_name = target_primary WHERE target_name = source_dup;
  END IF;
END;
$$;
