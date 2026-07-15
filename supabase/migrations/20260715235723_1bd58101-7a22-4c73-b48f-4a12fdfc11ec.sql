
CREATE TABLE public.workflow_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  nodes_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_definitions TO authenticated;
GRANT ALL ON public.workflow_definitions TO service_role;
ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workflow definitions" ON public.workflow_definitions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_workflow_definitions_updated_at
  BEFORE UPDATE ON public.workflow_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.workflow_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  input JSONB,
  node_outputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_runs TO authenticated;
GRANT ALL ON public.workflow_runs TO service_role;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workflow runs" ON public.workflow_runs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX workflow_runs_workflow_id_idx ON public.workflow_runs(workflow_id);
CREATE INDEX workflow_runs_user_id_idx ON public.workflow_runs(user_id);
CREATE TRIGGER update_workflow_runs_updated_at
  BEFORE UPDATE ON public.workflow_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
