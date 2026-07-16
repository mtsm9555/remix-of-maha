
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  downloads INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 0.0,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  manifest_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (name, version)
);
GRANT SELECT ON public.marketplace_listings TO authenticated;
GRANT ALL ON public.marketplace_listings TO service_role;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read marketplace" ON public.marketplace_listings FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON public.marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_tags ON public.marketplace_listings USING gin (tags);
CREATE TRIGGER trg_marketplace_updated BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.installed_tools (
  name TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','disabled','quarantined')),
  mcp_server_id TEXT,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.installed_tools TO authenticated;
GRANT ALL ON public.installed_tools TO service_role;
ALTER TABLE public.installed_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read installed tools" ON public.installed_tools FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_installed_tools_updated BEFORE UPDATE ON public.installed_tools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.tool_security_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL,
  version TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low','medium','high','critical')),
  passed BOOLEAN NOT NULL,
  warnings TEXT[] NOT NULL DEFAULT '{}',
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tool_security_scans TO authenticated;
GRANT ALL ON public.tool_security_scans TO service_role;
ALTER TABLE public.tool_security_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read scans" ON public.tool_security_scans FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_scans_tool ON public.tool_security_scans(tool_name, scanned_at DESC);
