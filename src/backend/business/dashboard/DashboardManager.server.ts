import { supabaseAdmin as db } from "@/integrations/supabase/client.server";
import type { Dashboard, DashboardWidget, DashboardView, TimeRange, DashboardData } from "./CompanyDashboardTypes";
import { DashboardDataAggregator } from "./DashboardDataAggregator.server";

const DEFAULT_LAYOUT = { columns: 12, rowHeight: 80, breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480 } };

function mapDashboard(r: any): Dashboard {
  return {
    id: r.id, tenantId: r.tenant_id, name: r.name,
    description: r.description ?? undefined, view: r.view,
    isDefault: !!r.is_default,
    widgets: (r.widgets as DashboardWidget[]) || [],
    layout: r.layout || DEFAULT_LAYOUT,
    defaultTimeRange: r.default_time_range,
    defaultFilters: r.default_filters || [],
    ownerId: r.owner_id, sharedWith: r.shared_with || [],
    isPublic: !!r.is_public,
    lastViewedAt: r.last_viewed_at ? new Date(r.last_viewed_at) : undefined,
    viewCount: r.view_count ?? 0,
    createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at),
  };
}

export class DashboardManager {
  static async createDashboard(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      view: DashboardView;
      isDefault?: boolean;
      widgets?: Array<Omit<DashboardWidget, 'id' | 'dashboardId' | 'createdAt' | 'updatedAt'>>;
      defaultTimeRange?: TimeRange;
      sharedWith?: string[];
      isPublic?: boolean;
    },
    ownerId: string,
  ): Promise<Dashboard> {
    const id = `dashboard_${crypto.randomUUID()}`;
    const widgets: DashboardWidget[] = (data.widgets || []).map((w) => ({
      ...w,
      id: `widget_${crypto.randomUUID()}`,
      dashboardId: id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const row = {
      id, tenant_id: tenantId,
      name: data.name, description: data.description,
      view: data.view, is_default: !!data.isDefault,
      widgets: widgets as any, layout: DEFAULT_LAYOUT as any,
      default_time_range: data.defaultTimeRange || 'month',
      default_filters: [] as any,
      owner_id: ownerId, shared_with: data.sharedWith || [],
      is_public: !!data.isPublic, view_count: 0,
    };
    const { data: inserted, error } = await db.from('dashboards').insert(row).select('*').single();
    if (error) throw error;
    return mapDashboard(inserted);
  }

  static async getDashboard(id: string, tenantId: string): Promise<Dashboard | null> {
    const { data } = await db.from('dashboards').select('*').eq('id', id).eq('tenant_id', tenantId).maybeSingle();
    return data ? mapDashboard(data) : null;
  }

  static async listDashboards(tenantId: string, userId: string): Promise<Dashboard[]> {
    const { data } = await db.from('dashboards').select('*')
      .eq('tenant_id', tenantId)
      .or(`owner_id.eq.${userId},is_public.eq.true,shared_with.cs.{${userId}}`)
      .order('updated_at', { ascending: false });
    return (data || []).map(mapDashboard);
  }

  static async updateDashboard(id: string, tenantId: string, updates: Partial<Dashboard>): Promise<Dashboard | null> {
    const patch: Record<string, any> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.widgets !== undefined) patch.widgets = updates.widgets;
    if (updates.layout !== undefined) patch.layout = updates.layout;
    if (updates.sharedWith !== undefined) patch.shared_with = updates.sharedWith;
    if (updates.isPublic !== undefined) patch.is_public = updates.isPublic;
    if (updates.isDefault !== undefined) patch.is_default = updates.isDefault;
    if (updates.defaultTimeRange !== undefined) patch.default_time_range = updates.defaultTimeRange;
    const { data } = await db.from('dashboards').update(patch).eq('id', id).eq('tenant_id', tenantId).select('*').maybeSingle();
    return data ? mapDashboard(data) : null;
  }

  static async deleteDashboard(id: string, tenantId: string): Promise<void> {
    await db.from('dashboards').delete().eq('id', id).eq('tenant_id', tenantId);
  }

  static async getDashboardWithData(
    dashboardId: string,
    tenantId: string,
    userId: string,
    timeRange?: TimeRange,
  ): Promise<{ dashboard: Dashboard; data: DashboardData } | null> {
    const dashboard = await this.getDashboard(dashboardId, tenantId);
    if (!dashboard) return null;
    const data = await DashboardDataAggregator.aggregateDashboardData(
      tenantId, timeRange || dashboard.defaultTimeRange, dashboard.defaultFilters,
    );
    data.dashboard = dashboard;
    await this.logView(dashboardId, tenantId, userId, timeRange || dashboard.defaultTimeRange);
    return { dashboard, data };
  }

  static async logView(dashboardId: string, tenantId: string, userId: string, timeRange: TimeRange): Promise<void> {
    await db.from('dashboard_views').insert({
      id: `dview_${crypto.randomUUID()}`,
      dashboard_id: dashboardId, tenant_id: tenantId,
      user_id: userId, time_range: timeRange,
    });
    const { data } = await db.from('dashboards').select('view_count').eq('id', dashboardId).single();
    await db.from('dashboards').update({
      view_count: (data?.view_count || 0) + 1,
      last_viewed_at: new Date().toISOString(),
    }).eq('id', dashboardId);
  }
}