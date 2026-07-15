CREATE TABLE IF NOT EXISTS public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  url TEXT,
  command_example TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT ON public.tools TO anon, authenticated;
GRANT ALL ON public.tools TO service_role;

ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read on tools" ON public.tools
  FOR SELECT USING (true);

CREATE TRIGGER update_tools_updated_at
BEFORE UPDATE ON public.tools
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();