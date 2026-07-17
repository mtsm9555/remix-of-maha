import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Milestone, MilestoneStatus, Deliverable } from "./ProjectManagementTypes";

const db = supabaseAdmin as any;

function mapMilestone(data: any): Milestone {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    projectId: data.project_id,
    name: data.name,
    description: data.description ?? undefined,
    dueDate: new Date(data.due_date),
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    status: data.status,
    progress: data.progress ?? 0,
    deliverables: data.deliverables || [],
    taskIds: data.task_ids || [],
    tags: data.tags || [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export class MilestoneManager {
  static async createMilestone(
    tenantId: string,
    projectId: string,
    data: {
      name: string;
      description?: string;
      dueDate: Date;
      deliverables?: Omit<Deliverable, 'id' | 'createdAt' | 'updatedAt'>[];
      tags?: string[];
    },
  ): Promise<Milestone> {
    const id = `milestone_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const deliverables = (data.deliverables || []).map((d) => ({
      ...d,
      id: `deliverable_${crypto.randomUUID()}`,
      createdAt: now,
      updatedAt: now,
    }));
    const row = {
      id,
      tenant_id: tenantId,
      project_id: projectId,
      name: data.name,
      description: data.description,
      due_date: data.dueDate.toISOString(),
      status: 'upcoming',
      deliverables,
      tags: data.tags || [],
    };
    const { data: inserted, error } = await db.from('pm_milestones').insert(row).select('*').single();
    if (error) throw error;

    const { data: project } = await db
      .from('pm_projects')
      .select('total_milestones')
      .eq('id', projectId)
      .single();
    await db
      .from('pm_projects')
      .update({ total_milestones: (project?.total_milestones || 0) + 1 })
      .eq('id', projectId);

    return mapMilestone(inserted);
  }

  static async updateProgress(milestoneId: string, tenantId: string): Promise<void> {
    const { data: tasks } = await db
      .from('pm_tasks')
      .select('status')
      .eq('tenant_id', tenantId)
      .eq('milestone_id', milestoneId);
    const list = tasks || [];
    const totalTasks = list.length;
    const completed = list.filter((t: any) => t.status === 'completed').length;
    const progress = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

    const existing = await this.getMilestone(milestoneId, tenantId);
    let status: MilestoneStatus = 'upcoming';
    if (progress === 100) status = 'completed';
    else if (existing && new Date() > existing.dueDate) status = 'overdue';
    else if (progress > 0) status = 'in_progress';

    const updates: Record<string, any> = { progress, status };
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    await db.from('pm_milestones').update(updates).eq('id', milestoneId);

    if (status === 'completed' && existing) {
      const { data: project } = await db
        .from('pm_projects')
        .select('completed_milestones')
        .eq('id', existing.projectId)
        .single();
      await db
        .from('pm_projects')
        .update({ completed_milestones: (project?.completed_milestones || 0) + 1 })
        .eq('id', existing.projectId);
    }
  }

  static async getMilestone(milestoneId: string, tenantId: string): Promise<Milestone | null> {
    const { data } = await db
      .from('pm_milestones')
      .select('*')
      .eq('id', milestoneId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    return data ? mapMilestone(data) : null;
  }

  static async getProjectMilestones(projectId: string, tenantId: string): Promise<Milestone[]> {
    const { data } = await db
      .from('pm_milestones')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('project_id', projectId)
      .order('due_date', { ascending: true });
    return (data || []).map(mapMilestone);
  }
}