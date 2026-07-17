
-- Project Management module tables (pm_ prefix to avoid conflict with existing projects/tasks)

CREATE TABLE public.pm_projects (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planning','active','on_hold','completed','cancelled')),
  priority TEXT NOT NULL CHECK (priority IN ('low','medium','high','critical')),
  phase TEXT NOT NULL CHECK (phase IN ('initiation','planning','execution','monitoring','closure')),
  category TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  actual_start_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  budget_usd REAL,
  spent_usd REAL DEFAULT 0,
  remaining_usd REAL,
  company_id TEXT,
  deal_id TEXT,
  workspace_id TEXT,
  project_manager_id TEXT,
  team_ids TEXT[] DEFAULT '{}',
  member_ids TEXT[] DEFAULT '{}',
  progress INTEGER DEFAULT 0,
  health_score INTEGER DEFAULT 100,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  overdue_tasks INTEGER DEFAULT 0,
  total_milestones INTEGER DEFAULT 0,
  completed_milestones INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pm_projects TO authenticated;
GRANT ALL ON public.pm_projects TO service_role;
ALTER TABLE public.pm_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_projects tenant access" ON public.pm_projects FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));
CREATE INDEX idx_pm_projects_tenant ON public.pm_projects(tenant_id, status);
CREATE INDEX idx_pm_projects_company ON public.pm_projects(tenant_id, company_id);
CREATE INDEX idx_pm_projects_manager ON public.pm_projects(tenant_id, project_manager_id);
CREATE INDEX idx_pm_projects_tags ON public.pm_projects USING gin (tags);

CREATE TABLE public.pm_tasks (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES public.pm_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_number TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('task','bug','feature','improvement','documentation')),
  status TEXT NOT NULL CHECK (status IN ('todo','in_progress','in_review','blocked','completed','cancelled')),
  priority TEXT NOT NULL CHECK (priority IN ('low','medium','high','urgent')),
  parent_task_id TEXT REFERENCES public.pm_tasks(id),
  subtask_ids TEXT[] DEFAULT '{}',
  assignee_id TEXT,
  reporter_id TEXT NOT NULL,
  team_id TEXT,
  estimated_hours REAL,
  actual_hours REAL DEFAULT 0,
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  depends_on TEXT[] DEFAULT '{}',
  blocked_by TEXT[] DEFAULT '{}',
  progress INTEGER DEFAULT 0,
  milestone_id TEXT,
  sprint_id TEXT,
  tags TEXT[] DEFAULT '{}',
  attachments TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, task_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pm_tasks TO authenticated;
GRANT ALL ON public.pm_tasks TO service_role;
ALTER TABLE public.pm_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_tasks tenant access" ON public.pm_tasks FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));
CREATE INDEX idx_pm_tasks_project ON public.pm_tasks(tenant_id, project_id);
CREATE INDEX idx_pm_tasks_status ON public.pm_tasks(tenant_id, status);
CREATE INDEX idx_pm_tasks_assignee ON public.pm_tasks(tenant_id, assignee_id);
CREATE INDEX idx_pm_tasks_due ON public.pm_tasks(tenant_id, due_date);
CREATE INDEX idx_pm_tasks_tags ON public.pm_tasks USING gin (tags);

CREATE TABLE public.pm_milestones (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES public.pm_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('upcoming','in_progress','completed','overdue')),
  progress INTEGER DEFAULT 0,
  deliverables JSONB DEFAULT '[]',
  task_ids TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pm_milestones TO authenticated;
GRANT ALL ON public.pm_milestones TO service_role;
ALTER TABLE public.pm_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_milestones tenant access" ON public.pm_milestones FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));
CREATE INDEX idx_pm_milestones_project ON public.pm_milestones(tenant_id, project_id);
CREATE INDEX idx_pm_milestones_due ON public.pm_milestones(tenant_id, due_date);

CREATE TABLE public.pm_sprints (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES public.pm_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planning','active','completed')),
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  completed_points INTEGER DEFAULT 0,
  task_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pm_sprints TO authenticated;
GRANT ALL ON public.pm_sprints TO service_role;
ALTER TABLE public.pm_sprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_sprints tenant access" ON public.pm_sprints FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));
CREATE INDEX idx_pm_sprints_project ON public.pm_sprints(tenant_id, project_id);

CREATE TABLE public.pm_resources (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('human','equipment','budget','software')),
  description TEXT,
  total_capacity REAL NOT NULL,
  allocated_capacity REAL DEFAULT 0,
  available_capacity REAL,
  hourly_rate_usd REAL,
  user_id TEXT,
  project_id TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  unavailable_from TIMESTAMPTZ,
  unavailable_to TIMESTAMPTZ,
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pm_resources TO authenticated;
GRANT ALL ON public.pm_resources TO service_role;
ALTER TABLE public.pm_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_resources tenant access" ON public.pm_resources FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));
CREATE INDEX idx_pm_resources_tenant ON public.pm_resources(tenant_id, type);
CREATE INDEX idx_pm_resources_user ON public.pm_resources(tenant_id, user_id);

CREATE TABLE public.pm_time_entries (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  task_id TEXT,
  project_id TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_hours REAL NOT NULL,
  description TEXT NOT NULL,
  billable BOOLEAN DEFAULT TRUE,
  status TEXT NOT NULL CHECK (status IN ('draft','submitted','approved','rejected')),
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  hourly_rate_usd REAL,
  total_cost_usd REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pm_time_entries TO authenticated;
GRANT ALL ON public.pm_time_entries TO service_role;
ALTER TABLE public.pm_time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_time_entries tenant access" ON public.pm_time_entries FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()));
CREATE INDEX idx_pm_time_entries_user ON public.pm_time_entries(tenant_id, user_id, date DESC);
CREATE INDEX idx_pm_time_entries_project ON public.pm_time_entries(tenant_id, project_id);
CREATE INDEX idx_pm_time_entries_task ON public.pm_time_entries(tenant_id, task_id);
CREATE INDEX idx_pm_time_entries_status ON public.pm_time_entries(tenant_id, status);

CREATE OR REPLACE FUNCTION public.pm_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER pm_projects_touch BEFORE UPDATE ON public.pm_projects FOR EACH ROW EXECUTE FUNCTION public.pm_touch_updated_at();
CREATE TRIGGER pm_tasks_touch BEFORE UPDATE ON public.pm_tasks FOR EACH ROW EXECUTE FUNCTION public.pm_touch_updated_at();
CREATE TRIGGER pm_milestones_touch BEFORE UPDATE ON public.pm_milestones FOR EACH ROW EXECUTE FUNCTION public.pm_touch_updated_at();
CREATE TRIGGER pm_sprints_touch BEFORE UPDATE ON public.pm_sprints FOR EACH ROW EXECUTE FUNCTION public.pm_touch_updated_at();
CREATE TRIGGER pm_resources_touch BEFORE UPDATE ON public.pm_resources FOR EACH ROW EXECUTE FUNCTION public.pm_touch_updated_at();
CREATE TRIGGER pm_time_entries_touch BEFORE UPDATE ON public.pm_time_entries FOR EACH ROW EXECUTE FUNCTION public.pm_touch_updated_at();
