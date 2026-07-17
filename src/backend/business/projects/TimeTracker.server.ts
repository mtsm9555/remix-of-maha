import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { TimeEntry, TimeEntryStatus } from "./ProjectManagementTypes";

const db = supabaseAdmin as any;

function mapEntry(t: any): TimeEntry {
  return {
    id: t.id,
    tenantId: t.tenant_id,
    userId: t.user_id,
    taskId: t.task_id ?? undefined,
    projectId: t.project_id,
    date: new Date(t.date),
    startTime: new Date(t.start_time),
    endTime: new Date(t.end_time),
    durationHours: t.duration_hours,
    description: t.description,
    billable: t.billable,
    status: t.status,
    approvedAt: t.approved_at ? new Date(t.approved_at) : undefined,
    approvedBy: t.approved_by ?? undefined,
    hourlyRateUSD: t.hourly_rate_usd ?? undefined,
    totalCostUSD: t.total_cost_usd ?? undefined,
    createdAt: new Date(t.created_at),
    updatedAt: new Date(t.updated_at),
  };
}

export class TimeTracker {
  static async logTime(
    tenantId: string,
    userId: string,
    data: {
      projectId: string;
      taskId?: string;
      date: Date;
      startTime: Date;
      endTime: Date;
      description: string;
      billable?: boolean;
      hourlyRateUSD?: number;
    },
  ): Promise<TimeEntry> {
    const durationHours = (data.endTime.getTime() - data.startTime.getTime()) / 3_600_000;
    const totalCostUSD = data.hourlyRateUSD ? durationHours * data.hourlyRateUSD : undefined;
    const id = `time_${crypto.randomUUID()}`;
    const row = {
      id,
      tenant_id: tenantId,
      user_id: userId,
      task_id: data.taskId,
      project_id: data.projectId,
      date: data.date.toISOString(),
      start_time: data.startTime.toISOString(),
      end_time: data.endTime.toISOString(),
      duration_hours: durationHours,
      description: data.description,
      billable: data.billable !== false,
      status: 'draft',
      hourly_rate_usd: data.hourlyRateUSD,
      total_cost_usd: totalCostUSD,
    };
    const { data: inserted, error } = await db
      .from('pm_time_entries')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;

    if (data.taskId) {
      const { data: task } = await db
        .from('pm_tasks')
        .select('actual_hours')
        .eq('id', data.taskId)
        .single();
      await db
        .from('pm_tasks')
        .update({ actual_hours: (task?.actual_hours || 0) + durationHours })
        .eq('id', data.taskId);
    }
    if (totalCostUSD) {
      const { data: project } = await db
        .from('pm_projects')
        .select('spent_usd, remaining_usd')
        .eq('id', data.projectId)
        .single();
      await db
        .from('pm_projects')
        .update({
          spent_usd: (project?.spent_usd || 0) + totalCostUSD,
          remaining_usd: (project?.remaining_usd || 0) - totalCostUSD,
        })
        .eq('id', data.projectId);
    }
    return mapEntry(inserted);
  }

  static async submitForApproval(timeEntryId: string, tenantId: string): Promise<void> {
    await db
      .from('pm_time_entries')
      .update({ status: 'submitted' })
      .eq('id', timeEntryId)
      .eq('tenant_id', tenantId);
  }

  static async approveTimeEntry(
    timeEntryId: string,
    tenantId: string,
    approvedBy: string,
  ): Promise<void> {
    await db
      .from('pm_time_entries')
      .update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: approvedBy })
      .eq('id', timeEntryId)
      .eq('tenant_id', tenantId);
  }

  static async getTimeEntries(
    tenantId: string,
    filters: {
      userId?: string;
      projectId?: string;
      taskId?: string;
      status?: TimeEntryStatus;
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
    } = {},
  ): Promise<TimeEntry[]> {
    let query = db
      .from('pm_time_entries')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false });
    if (filters.userId) query = query.eq('user_id', filters.userId);
    if (filters.projectId) query = query.eq('project_id', filters.projectId);
    if (filters.taskId) query = query.eq('task_id', filters.taskId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.fromDate) query = query.gte('date', filters.fromDate.toISOString());
    if (filters.toDate) query = query.lte('date', filters.toDate.toISOString());
    if (filters.limit) query = query.limit(filters.limit);
    const { data } = await query;
    return (data || []).map(mapEntry);
  }

  static async getProjectTimeSummary(
    projectId: string,
    tenantId: string,
  ): Promise<{ totalHours: number; billableHours: number; totalCostUSD: number; byUser: Record<string, number> }> {
    const { data: entries } = await db
      .from('pm_time_entries')
      .select('user_id, duration_hours, billable, total_cost_usd')
      .eq('tenant_id', tenantId)
      .eq('project_id', projectId)
      .eq('status', 'approved');
    const list = entries || [];
    const totalHours = list.reduce((s: number, e: any) => s + e.duration_hours, 0);
    const billableHours = list
      .filter((e: any) => e.billable)
      .reduce((s: number, e: any) => s + e.duration_hours, 0);
    const totalCostUSD = list.reduce((s: number, e: any) => s + (e.total_cost_usd || 0), 0);
    const byUser: Record<string, number> = {};
    for (const e of list) byUser[e.user_id] = (byUser[e.user_id] || 0) + e.duration_hours;
    return { totalHours, billableHours, totalCostUSD, byUser };
  }
}