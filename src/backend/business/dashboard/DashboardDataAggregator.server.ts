import { supabaseAdmin as db } from "@/integrations/supabase/client.server";
import type { DashboardData, DashboardMetric, DashboardActivity, TimeRange } from "./CompanyDashboardTypes";

function getDateRange(range: TimeRange): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  switch (range) {
    case 'today': start.setHours(0, 0, 0, 0); break;
    case 'week': start.setDate(end.getDate() - 7); break;
    case 'month': start.setMonth(end.getMonth() - 1); break;
    case 'quarter': start.setMonth(end.getMonth() - 3); break;
    case 'year': start.setFullYear(end.getFullYear() - 1); break;
    default: start.setMonth(end.getMonth() - 1);
  }
  return { start, end };
}

function trendOf(current: number, previous: number): 'up' | 'down' | 'stable' {
  if (previous === 0) return current > 0 ? 'up' : 'stable';
  const change = ((current - previous) / previous) * 100;
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
}

export class DashboardDataAggregator {
  static async aggregateDashboardData(
    tenantId: string,
    timeRange: TimeRange = 'month',
    filters: any[] = [],
  ): Promise<DashboardData> {
    const [metrics, recentActivities, upcomingMeetings, openTasks, pipelineSnapshot, projectOverview] = await Promise.all([
      this.aggregateMetrics(tenantId, timeRange),
      this.getRecentActivities(tenantId, 20),
      this.getUpcomingMeetings(tenantId, 10),
      this.getOpenTasks(tenantId, 15),
      this.getPipelineSnapshot(tenantId),
      this.getProjectOverview(tenantId),
    ]);
    return {
      dashboard: null,
      metrics, recentActivities, upcomingMeetings, openTasks,
      pipelineSnapshot, projectOverview, widgetData: {},
      generatedAt: new Date(), timeRange, filters,
    };
  }

  private static async aggregateMetrics(tenantId: string, timeRange: TimeRange): Promise<DashboardMetric[]> {
    const { start } = getDateRange(timeRange);
    const startIso = start.toISOString();
    const metrics: DashboardMetric[] = [];

    const { count: newContacts } = await db.from('crm_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).gte('created_at', startIso);
    metrics.push({ name: 'new_contacts', label: 'New Contacts', value: newContacts || 0, format: 'number' });

    const { count: wonDeals } = await db.from('crm_deals')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('stage', 'closed_won').gte('updated_at', startIso);
    metrics.push({ name: 'won_deals', label: 'Won Deals', value: wonDeals || 0, format: 'number' });

    const { data: dealVals } = await db.from('crm_deals')
      .select('value').eq('tenant_id', tenantId).eq('stage', 'closed_won').gte('updated_at', startIso);
    const totalRevenue = (dealVals || []).reduce((s, d: any) => s + (Number(d.value) || 0), 0);
    metrics.push({ name: 'revenue', label: 'Revenue', value: totalRevenue, format: 'currency', unit: 'USD' });

    const { count: completedTasks } = await db.from('pm_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'completed').gte('updated_at', startIso);
    metrics.push({ name: 'completed_tasks', label: 'Completed Tasks', value: completedTasks || 0, format: 'number' });

    const { count: activeProjects } = await db.from('pm_projects')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'active');
    metrics.push({ name: 'active_projects', label: 'Active Projects', value: activeProjects || 0, format: 'number' });

    void trendOf;
    return metrics;
  }

  private static async getRecentActivities(tenantId: string, limit: number): Promise<DashboardActivity[]> {
    const { data } = await db.from('crm_activities')
      .select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(limit);
    return (data || []).map((a: any) => ({
      id: a.id, type: a.type || 'activity',
      title: a.subject || a.title || 'Activity',
      description: a.description ?? undefined,
      actor: a.owner_id ?? undefined,
      timestamp: new Date(a.created_at),
      entityType: a.entity_type, entityId: a.entity_id,
    }));
  }

  private static async getUpcomingMeetings(tenantId: string, limit: number) {
    const { data } = await db.from('meetings')
      .select('id, title, scheduled_start, scheduled_end, status, meeting_url, organizer_id')
      .eq('tenant_id', tenantId)
      .in('status', ['scheduled', 'in_progress'])
      .gte('scheduled_start', new Date().toISOString())
      .order('scheduled_start').limit(limit);
    return data || [];
  }

  private static async getOpenTasks(tenantId: string, limit: number) {
    const { data } = await db.from('pm_tasks')
      .select('id, title, status, priority, due_date, assignee_id, project_id')
      .eq('tenant_id', tenantId)
      .in('status', ['todo', 'in_progress'])
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(limit);
    return data || [];
  }

  private static async getPipelineSnapshot(tenantId: string) {
    const { data } = await db.from('crm_deals')
      .select('stage, value').eq('tenant_id', tenantId);
    const stages: Record<string, { count: number; value: number }> = {};
    for (const d of (data || []) as any[]) {
      const s = d.stage || 'unknown';
      stages[s] = stages[s] || { count: 0, value: 0 };
      stages[s].count++;
      stages[s].value += Number(d.value) || 0;
    }
    return { stages };
  }

  private static async getProjectOverview(tenantId: string) {
    const { data } = await db.from('pm_projects')
      .select('id, name, status, progress, health_score, budget, spent_budget')
      .eq('tenant_id', tenantId)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false }).limit(10);
    return { projects: data || [] };
  }
}