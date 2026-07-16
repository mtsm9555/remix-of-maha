
CREATE TABLE public.agent_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  system_prompt TEXT NOT NULL,
  few_shot_examples TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('stable','canary','archived')),
  performance_metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  replaced_at TIMESTAMPTZ
);
CREATE INDEX idx_prompt_versions_agent ON public.agent_prompt_versions(agent_id, status);

GRANT SELECT ON public.agent_prompt_versions TO authenticated;
GRANT ALL ON public.agent_prompt_versions TO service_role;
ALTER TABLE public.agent_prompt_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read prompt versions" ON public.agent_prompt_versions FOR SELECT TO authenticated USING (true);

CREATE TABLE public.learning_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  trigger TEXT NOT NULL CHECK (trigger IN ('scheduled','performance_drop','manual')),
  previous_version_id UUID,
  proposed_version_id UUID,
  status TEXT NOT NULL CHECK (status IN ('analyzing','optimizing','pending_approval','deployed','rolled_back')),
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_learning_cycles_agent ON public.learning_cycles(agent_id, created_at DESC);

GRANT SELECT ON public.learning_cycles TO authenticated;
GRANT ALL ON public.learning_cycles TO service_role;
ALTER TABLE public.learning_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read learning cycles" ON public.learning_cycles FOR SELECT TO authenticated USING (true);
