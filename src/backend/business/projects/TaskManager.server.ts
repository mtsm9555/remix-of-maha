import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Task, TaskStatus, TaskPriority, TaskType } from "./ProjectManagementTypes";
import { ProjectManager } from "./ProjectManager.server";

const db = supabaseAdmin as any;

function mapToTask(data: any): Task {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    projectId: data.project_id,
    title: data.title,
    description: data.description ?? undefined,
    taskNumber: data.task_number,
    type: data.type,
    status: data.status,
    priority: data.priority,
    parentTaskId: data.parent_task_id ?? undefined,
    subtaskIds: data.subtask_ids || [],
    assigneeId: data.assignee_id ?? undefined,
    reporterId: data.reporter_id,
    teamId: data.team_id ?? undefined,
    estimatedHours: data.estimated_hours ?? undefined,
    actualHours: data.actual_hours ?? 0,
    dueDate: data.due_date ? new Date(data.due_date) : undefined,
    startDate: data.start_date ? new Date(data.start_date) : undefined,
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    dependsOn: data.depends_on || [],
    blockedBy: data.blocked_by || [],
    progress: data.progress ?? 0,
    milestoneId: data.milestone_id ?? undefined,
    sprintId: data.sprint_id ?? undefined,
    tags: data.tags || [],
    attachments: data.attachments || [],
    metadata: data.metadata || {},
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export class TaskManager {
  static async createTask(
    tenantId: string,
    projectId: string,
    data: {
      title: string;
      description?: string;
      type?: TaskType;
      priority?: TaskPriority;
      assigneeId?: string;
      estimatedHours?: number;
      dueDate?: Date;
      parentTaskId?: string;
      milestoneId?: string;
      tags?: string[];
    },
    reporterId: string,
  ): Promise<Task> {
    const taskNumber = await this.generateTaskNumber(tenantId, projectId);
    const id = `task_${crypto.randomUUID()}`;
    const row = {
      id,
      tenant_id: tenantId,
      project_id: projectId,
      title: data.title,
      description: data.description,
      task_number: taskNumber,
      type: data.type || 'task',
      status: 'todo',
      priority: data.priority || 'medium',
      parent_task_id: data.parentTaskId,
      assignee_id: data.assigneeId,
      reporter_id: reporterId,
      estimated_hours: data.estimatedHours,
      due_date: data.dueDate?.toISOString(),
      milestone_id: data.milestoneId,
      tags: data.tags || [],
    };
    const { data: inserted, error } = await db.from('pm_tasks').insert(row).select('*').single();
    if (error) throw error;

    if (data.parentTaskId) {
      const { data: parent } = await db
        .from('pm_tasks')
        .select('subtask_ids')
        .eq('id', data.parentTaskId)
        .single();
      const next = [...((parent?.subtask_ids as string[]) || []), id];
      await db.from('pm_tasks').update({ subtask_ids: next }).eq('id', data.parentTaskId);
    }

    await ProjectManager.updateProgress(projectId, tenantId);
    return mapToTask(inserted);
  }

  private static async generateTaskNumber(tenantId: string, projectId: string): Promise<string> {
    const { data: project } = await db
      .from('pm_projects')
      .select('key')
      .eq('id', projectId)
      .eq('tenant_id', tenantId)
      .single();
    const { count } = await db
      .from('pm_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('project_id', projectId);
    const number = (count || 0) + 1;
    return `${project?.key || 'TASK'}-${number}`;
  }

  static async updateStatus(
    taskId: string,
    tenantId: string,
    status: TaskStatus,
    _updatedBy: string,
  ): Promise<Task> {
    const updates: Record<string, any> = { status };
    if (status === 'in_progress') updates.start_date = new Date().toISOString();
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
      updates.progress = 100;
    }
    const { data, error } = await db
      .from('pm_tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();
    if (error) throw error;
    if (data?.project_id) await ProjectManager.updateProgress(data.project_id, tenantId);
    return mapToTask(data);
  }

  static async checkDependencies(
    taskId: string,
    tenantId: string,
  ): Promise<{ canStart: boolean; blockedBy: string[] }> {
    const { data: task } = await db
      .from('pm_tasks')
      .select('depends_on')
      .eq('id', taskId)
      .eq('tenant_id', tenantId)
      .single();
    const deps: string[] = task?.depends_on || [];
    if (!deps.length) return { canStart: true, blockedBy: [] };
    const { data: dependencies } = await db
      .from('pm_tasks')
      .select('id, status')
      .in('id', deps)
      .eq('tenant_id', tenantId);
    const incomplete = (dependencies || [])
      .filter((d: any) => d.status !== 'completed')
      .map((d: any) => d.id);
    return { canStart: incomplete.length === 0, blockedBy: incomplete };
  }

  static async getTasks(
    tenantId: string,
    filters: {
      projectId?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string;
      milestoneId?: string;
      sprintId?: string;
      dueBefore?: Date;
      limit?: number;
    } = {},
  ): Promise<Task[]> {
    let query = db
      .from('pm_tasks')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (filters.projectId) query = query.eq('project_id', filters.projectId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.priority) query = query.eq('priority', filters.priority);
    if (filters.assigneeId) query = query.eq('assignee_id', filters.assigneeId);
    if (filters.milestoneId) query = query.eq('milestone_id', filters.milestoneId);
    if (filters.sprintId) query = query.eq('sprint_id', filters.sprintId);
    if (filters.dueBefore) query = query.lt('due_date', filters.dueBefore.toISOString());
    if (filters.limit) query = query.limit(filters.limit);
    const { data } = await query;
    return (data || []).map(mapToTask);
  }
}