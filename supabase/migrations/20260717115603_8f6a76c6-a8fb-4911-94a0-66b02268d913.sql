
ALTER TABLE public.organization_teams
  ADD COLUMN IF NOT EXISTS parent_team_id TEXT REFERENCES public.organization_teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS path TEXT,
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS resource_quota JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS child_team_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_org_teams_parent ON public.organization_teams(parent_team_id);
CREATE INDEX IF NOT EXISTS idx_org_teams_path ON public.organization_teams(path);

CREATE TABLE public.team_channels (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES public.organization_teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('general','project','announcement','private')),
  description TEXT,
  member_ids UUID[] NOT NULL DEFAULT '{}',
  message_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, name)
);
CREATE INDEX idx_channels_team ON public.team_channels(team_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_channels TO authenticated;
GRANT ALL ON public.team_channels TO service_role;
ALTER TABLE public.team_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view channels" ON public.team_channels FOR SELECT TO authenticated
  USING (team_id IN (
    SELECT id FROM public.organization_teams WHERE public.is_tenant_member(auth.uid(), tenant_id)
  ));
CREATE POLICY "Owners/admins manage channels" ON public.team_channels FOR ALL TO authenticated
  USING (team_id IN (
    SELECT id FROM public.organization_teams
    WHERE public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin')
  ))
  WITH CHECK (team_id IN (
    SELECT id FROM public.organization_teams
    WHERE public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin')
  ));

CREATE TABLE public.team_messages (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES public.team_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT[] NOT NULL DEFAULT '{}',
  mentions UUID[] NOT NULL DEFAULT '{}',
  reply_to_id TEXT REFERENCES public.team_messages(id) ON DELETE SET NULL,
  reactions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ
);
CREATE INDEX idx_messages_channel ON public.team_messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.team_messages(sender_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_messages TO authenticated;
GRANT ALL ON public.team_messages TO service_role;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view messages" ON public.team_messages FOR SELECT TO authenticated
  USING (channel_id IN (
    SELECT c.id FROM public.team_channels c
    JOIN public.organization_teams t ON t.id = c.team_id
    WHERE public.is_tenant_member(auth.uid(), t.tenant_id)
  ));
CREATE POLICY "Members send messages" ON public.team_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND channel_id IN (
      SELECT c.id FROM public.team_channels c
      JOIN public.organization_teams t ON t.id = c.team_id
      WHERE public.is_tenant_member(auth.uid(), t.tenant_id)
    )
  );
CREATE POLICY "Senders update own messages" ON public.team_messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Senders delete own messages" ON public.team_messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

CREATE TABLE public.team_budget_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL REFERENCES public.organization_teams(id) ON DELETE CASCADE,
  amount_usd REAL NOT NULL,
  resource_type TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_budget_usage_team ON public.team_budget_usage(team_id, recorded_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_budget_usage TO authenticated;
GRANT ALL ON public.team_budget_usage TO service_role;
ALTER TABLE public.team_budget_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members view budget" ON public.team_budget_usage FOR SELECT TO authenticated
  USING (team_id IN (
    SELECT id FROM public.organization_teams WHERE public.is_tenant_member(auth.uid(), tenant_id)
  ));
CREATE POLICY "Owners/admins manage budget" ON public.team_budget_usage FOR ALL TO authenticated
  USING (team_id IN (
    SELECT id FROM public.organization_teams
    WHERE public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin')
  ))
  WITH CHECK (team_id IN (
    SELECT id FROM public.organization_teams
    WHERE public.tenant_role(auth.uid(), tenant_id) IN ('owner','admin')
  ));

CREATE OR REPLACE FUNCTION public.increment_team_child_count(_team_id TEXT)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.organization_teams SET child_team_count = child_team_count + 1 WHERE id = _team_id;
END;
$$;
