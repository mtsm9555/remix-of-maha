-- Drop overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow read on logs" ON public.logs;
DROP POLICY IF EXISTS "Allow read on tools" ON public.tools;

-- Revoke public/anon/authenticated privileges; keep service_role only.
REVOKE ALL ON public.tasks FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.logs  FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.tools FROM anon, authenticated, PUBLIC;

GRANT ALL ON public.tasks TO service_role;
GRANT ALL ON public.logs  TO service_role;
GRANT ALL ON public.tools TO service_role;

-- RLS stays enabled; no policies = no access for anon/authenticated.
-- The server uses service_role which bypasses RLS.
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;