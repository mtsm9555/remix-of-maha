
CREATE TABLE public.collaboration_sessions (
  id TEXT PRIMARY KEY,
  initiator_id TEXT NOT NULL,
  participants TEXT[] NOT NULL DEFAULT '{}',
  objective TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('negotiating','active','completed','failed')),
  blackboard_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT SELECT ON public.collaboration_sessions TO authenticated;
GRANT ALL ON public.collaboration_sessions TO service_role;
ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read collab sessions" ON public.collaboration_sessions FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_collab_sessions_status ON public.collaboration_sessions(status);

CREATE TABLE public.collaboration_blackboards (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.collaboration_blackboards TO authenticated;
GRANT ALL ON public.collaboration_blackboards TO service_role;
ALTER TABLE public.collaboration_blackboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read blackboards" ON public.collaboration_blackboards FOR SELECT TO authenticated USING (true);

CREATE TABLE public.blackboard_artifacts (
  id TEXT PRIMARY KEY,
  collaboration_id TEXT NOT NULL REFERENCES public.collaboration_blackboards(id) ON DELETE CASCADE,
  owner_agent_id TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  locked_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blackboard_artifacts TO authenticated;
GRANT ALL ON public.blackboard_artifacts TO service_role;
ALTER TABLE public.blackboard_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read artifacts" ON public.blackboard_artifacts FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_artifacts_collab ON public.blackboard_artifacts(collaboration_id);

CREATE TABLE public.agent_message_logs (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_dept TEXT,
  receiver_id TEXT,
  receiver_dept TEXT,
  intent TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  collaboration_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agent_message_logs TO authenticated;
GRANT ALL ON public.agent_message_logs TO service_role;
ALTER TABLE public.agent_message_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read message logs" ON public.agent_message_logs FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_msg_logs_collab ON public.agent_message_logs(collaboration_id);
