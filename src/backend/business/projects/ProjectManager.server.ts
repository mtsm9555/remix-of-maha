import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Project, ProjectStatus, ProjectPriority } from "./ProjectManagementTypes";

const db = supabaseAdmin as any;

function mapToProject(data: any): Project {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    name: data.name,
    description: data.description ?? undefined,
    key: data.key,
    status: data.status,
    priority: data.priority,
    phase: data.phase,
    category: data.category ?? undefined,
    startDate: new Date(data.start_date),
    endDate: data.end_date ? new Date(data.end_date) : undefined,
    actualStartDate: data.actual_start_date ? new Date(data.actual_start_date) : undefined,
    actualEndDate: data.actual_end_date ? new Date(data.actual_end_date) : undefined,
    budgetUSD: data.budget_usd ?? undefined,
    spentUSD: data.spent_usd ?? 0,
    remainingUSD: data.remaining_usd ?? 0,
    companyId: data.company_id ?? undefined,
    dealId: data.deal_id ?? undefined,
    workspaceId: data.workspace_id ?? undefined,
    projectManagerId: data.project_manager_id ?? undefined,
    teamIds: data.team_ids || [],
    memberIds: data.member_ids || [],
    progress: data.progress ?? 0,
    healthScore: data.health_score ?? 100,
    totalTasks: data.total_tasks ?? 0,
    completedTasks: data.completed_tasks ?? 0,
    overdueTasks: data.overdue_tasks ?? 0,
    totalMilestones: data.total_milestones ?? 0,
    completedMilestones: data.completed_milestones ?? 0,
    tags: data.tags || [],
    metadata: data.metadata || {},
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export class ProjectManager {
  static async createProject(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      startDate: Date;
      endDate?: Date;
      budgetUSD?: number;
      priority?: ProjectPriority;
      companyId?: string;
      dealId?: string;
      projectManagerId?: string;
      teamIds?: string[];
      tags?: string[];
    },
    createdBy: string,
  ): Promise<Project> {
    const key = await this.generateProjectKey(tenantId, data.name);
    const id = `project_${crypto.randomUUID()}`;
    const row = {
      id,
      tenant_id: tenantId,
      name: data.name,
      description: data.description,
      key,
      status: 'planning',
      priority: data.priority || 'medium',
      phase: 'initiation',
      start_date: data.startDate.toISOString(),
      end_date: data.endDate?.toISOString(),
      budget_usd: data.budgetUSD,
      spent_usd: 0,
      remaining_usd: data.budgetUSD || 0,
      company_id: data.companyId,
      deal_id: data.dealId,
      project_manager_id: data.projectManagerId,
      team_ids: data.teamIds || [],
      member_ids: [createdBy],
      tags: data.tags || [],
      metadata: {},
    };
    const { data: inserted, error } = await db.from('pm_projects').insert(row).select('*').single();
    if (error) throw error;
    return mapToProject(inserted);
  }

  private static async generateProjectKey(tenantId: string, projectName: string): Promise<string> {
    const prefix = projectName.substring(0, 3).toUpperCase().padEnd(3, 'X');
    const { count } = await db
      .from('pm_projects')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .like('key', `${prefix}-%`);
    const number = (count || 0) + 1;
    return `${prefix}-${number.toString().padStart(3, '0')}`;
  }

  static async updateStatus(
    projectId: string,
    tenantId: string,
    status: ProjectStatus,
    _updatedBy: string,
  ): Promise<Project> {
    const updates: Record<string, any> = { status };
    if (status === 'active') {
      updates.actual_start_date = new Date().toISOString();
      updates.phase = 'execution';
    } else if (status === 'completed') {
      updates.actual_end_date = new Date().toISOString();
      updates.phase = 'closure';
      updates.progress = 100;
    }
    const { data, error } = await db
      .from('pm_projects')
      .update(updates)
      .eq('id', projectId)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();
    if (error) throw error;
    return mapToProject(data);
  }

  static async updateProgress(projectId: string, tenantId: string): Promise<void> {
    const { data: tasks } = await db
      .from('pm_tasks')
      .select('status, due_date')
      .eq('tenant_id', tenantId)
      .eq('project_id', projectId);
    const list = tasks || [];
    const totalTasks = list.length;
    const completedTasks = list.filter((t: any) => t.status === 'completed').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const overdueTasks = list.filter(
      (t: any) => t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date(),
    ).length;
    const healthScore = Math.max(0, 100 - overdueTasks * 10);
    await db
      .from('pm_projects')
      .update({
        progress,
        health_score: healthScore,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        overdue_tasks: overdueTasks,
      })
      .eq('id', projectId);
  }

  static async getProjects(
    tenantId: string,
    filters: {
      status?: ProjectStatus;
      priority?: ProjectPriority;
      companyId?: string;
      projectManagerId?: string;
      tags?: string[];
      limit?: number;
    } = {},
  ): Promise<Project[]> {
    let query = db
      .from('pm_projects')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false });
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.priority) query = query.eq('priority', filters.priority);
    if (filters.companyId) query = query.eq('company_id', filters.companyId);
    if (filters.projectManagerId) query = query.eq('project_manager_id', filters.projectManagerId);
    if (filters.tags?.length) query = query.overlaps('tags', filters.tags);
    if (filters.limit) query = query.limit(filters.limit);
    const { data } = await query;
    return (data || []).map(mapToProject);
  }
}