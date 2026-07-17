
-- Meetings Intelligence Module
CREATE TABLE public.meetings (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  meeting_url TEXT,
  is_virtual BOOLEAN DEFAULT FALSE,
  organizer_id TEXT NOT NULL,
  participant_ids TEXT[] DEFAULT '{}',
  external_participants JSONB DEFAULT '[]',
  project_id TEXT,
  deal_id TEXT,
  contact_id TEXT,
  calendar_event_id TEXT,
  is_recorded BOOLEAN DEFAULT FALSE,
  recording_url TEXT,
  recording_duration_seconds INTEGER,
  transcript_status TEXT DEFAULT 'pending',
  transcript_id TEXT,
  summary_id TEXT,
  ai_processed BOOLEAN DEFAULT FALSE,
  action_item_count INTEGER DEFAULT 0,
  decision_count INTEGER DEFAULT 0,
  follow_up_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_meetings_tenant ON public.meetings(tenant_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meetings tenant" ON public.meetings FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.meeting_transcripts (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  full_transcript TEXT DEFAULT '',
  segments JSONB DEFAULT '[]',
  word_count INTEGER DEFAULT 0,
  speaker_count INTEGER DEFAULT 0,
  language TEXT DEFAULT 'en',
  confidence REAL DEFAULT 0,
  processed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_transcripts TO authenticated;
GRANT ALL ON public.meeting_transcripts TO service_role;
ALTER TABLE public.meeting_transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meeting_transcripts tenant" ON public.meeting_transcripts FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.meeting_summaries (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  executive_summary TEXT DEFAULT '',
  key_points JSONB DEFAULT '[]',
  topics JSONB DEFAULT '[]',
  sentiment TEXT DEFAULT 'neutral',
  word_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 0,
  ai_confidence REAL DEFAULT 0,
  human_reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_summaries TO authenticated;
GRANT ALL ON public.meeting_summaries TO service_role;
ALTER TABLE public.meeting_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meeting_summaries tenant" ON public.meeting_summaries FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.meeting_action_items (
  id TEXT PRIMARY KEY,
  summary_id TEXT,
  meeting_id TEXT NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  assignee_id TEXT,
  assignee_name TEXT,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  mentioned_at INTEGER,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_meeting_action_items_meeting ON public.meeting_action_items(meeting_id);
CREATE INDEX idx_meeting_action_items_assignee ON public.meeting_action_items(tenant_id, assignee_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_action_items TO authenticated;
GRANT ALL ON public.meeting_action_items TO service_role;
ALTER TABLE public.meeting_action_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meeting_action_items tenant" ON public.meeting_action_items FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.meeting_decisions (
  id TEXT PRIMARY KEY,
  summary_id TEXT,
  meeting_id TEXT NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'proposed',
  rationale TEXT,
  alternatives JSONB DEFAULT '[]',
  decided_by TEXT[] DEFAULT '{}',
  mentioned_at INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_decisions TO authenticated;
GRANT ALL ON public.meeting_decisions TO service_role;
ALTER TABLE public.meeting_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meeting_decisions tenant" ON public.meeting_decisions FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.meeting_follow_ups (
  id TEXT PRIMARY KEY,
  summary_id TEXT,
  meeting_id TEXT NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  responsible_id TEXT,
  responsible_name TEXT,
  due_date TIMESTAMPTZ,
  type TEXT DEFAULT 'task',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_follow_ups TO authenticated;
GRANT ALL ON public.meeting_follow_ups TO service_role;
ALTER TABLE public.meeting_follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meeting_follow_ups tenant" ON public.meeting_follow_ups FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

-- Documents Module
CREATE TABLE public.doc_folders (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  parent_id TEXT REFERENCES public.doc_folders(id),
  child_ids TEXT[] DEFAULT '{}',
  level INTEGER DEFAULT 0,
  path TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  access_level TEXT NOT NULL DEFAULT 'private',
  allowed_roles TEXT[],
  allowed_user_ids TEXT[],
  document_count INTEGER DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_folders TO authenticated;
GRANT ALL ON public.doc_folders TO service_role;
ALTER TABLE public.doc_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_folders tenant" ON public.doc_folders FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.doc_documents (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_provider TEXT NOT NULL DEFAULT 'local',
  folder_id TEXT REFERENCES public.doc_folders(id),
  tags TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  project_id TEXT,
  task_id TEXT,
  contact_id TEXT,
  deal_id TEXT,
  article_id TEXT,
  owner_id TEXT NOT NULL,
  team_id TEXT,
  current_version_id TEXT,
  version_count INTEGER NOT NULL DEFAULT 1,
  access_level TEXT NOT NULL DEFAULT 'private',
  is_encrypted BOOLEAN DEFAULT FALSE,
  ai_processed BOOLEAN DEFAULT FALSE,
  extracted_text TEXT,
  ai_tags TEXT[] DEFAULT '{}',
  ai_category TEXT,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  custom_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_doc_documents_tenant ON public.doc_documents(tenant_id, status);
CREATE INDEX idx_doc_documents_folder ON public.doc_documents(tenant_id, folder_id);
CREATE INDEX idx_doc_documents_owner ON public.doc_documents(tenant_id, owner_id);
CREATE INDEX idx_doc_documents_tags ON public.doc_documents USING gin(tags);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_documents TO authenticated;
GRANT ALL ON public.doc_documents TO service_role;
ALTER TABLE public.doc_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_documents tenant" ON public.doc_documents FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.doc_versions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES public.doc_documents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  status TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  change_summary TEXT,
  changed_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_doc_versions_document ON public.doc_versions(document_id, version DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_versions TO authenticated;
GRANT ALL ON public.doc_versions TO service_role;
ALTER TABLE public.doc_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_versions tenant" ON public.doc_versions FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.doc_metadata (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES public.doc_documents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT,
  author TEXT,
  subject TEXT,
  keywords TEXT[] DEFAULT '{}',
  page_count INTEGER,
  word_count INTEGER,
  language TEXT,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  created_date TIMESTAMPTZ,
  modified_date TIMESTAMPTZ,
  summary TEXT,
  entities JSONB DEFAULT '[]',
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_metadata TO authenticated;
GRANT ALL ON public.doc_metadata TO service_role;
ALTER TABLE public.doc_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_metadata tenant" ON public.doc_metadata FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.doc_shares (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES public.doc_documents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL,
  target_user_id TEXT,
  target_team_id TEXT,
  public_link_id TEXT,
  permissions TEXT[] NOT NULL DEFAULT '{view}',
  expires_at TIMESTAMPTZ,
  max_downloads INTEGER,
  current_downloads INTEGER DEFAULT 0,
  password_hash TEXT,
  require_login BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  shared_by TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_shares TO authenticated;
GRANT ALL ON public.doc_shares TO service_role;
ALTER TABLE public.doc_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_shares tenant" ON public.doc_shares FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TABLE public.doc_activities (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES public.doc_documents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_doc_activities_doc ON public.doc_activities(document_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_activities TO authenticated;
GRANT ALL ON public.doc_activities TO service_role;
ALTER TABLE public.doc_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_activities tenant" ON public.doc_activities FOR ALL TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TRIGGER trg_meetings_touch BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.pm_touch_updated_at();
CREATE TRIGGER trg_meeting_summaries_touch BEFORE UPDATE ON public.meeting_summaries FOR EACH ROW EXECUTE FUNCTION public.pm_touch_updated_at();
CREATE TRIGGER trg_meeting_action_items_touch BEFORE UPDATE ON public.meeting_action_items FOR EACH ROW EXECUTE FUNCTION public.pm_touch_updated_at();
CREATE TRIGGER trg_doc_folders_touch BEFORE UPDATE ON public.doc_folders FOR EACH ROW EXECUTE FUNCTION public.pm_touch_updated_at();
CREATE TRIGGER trg_doc_documents_touch BEFORE UPDATE ON public.doc_documents FOR EACH ROW EXECUTE FUNCTION public.pm_touch_updated_at();
