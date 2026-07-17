import { supabaseAdmin as supabase } from "@/integrations/supabase/client.server";
import type { ExecutiveDashboard, ExecutiveRole, BriefingFrequency } from "./ExecutiveDashboardTypes";
import { ExecutiveMetricsEngine } from "./ExecutiveMetricsEngine.server";
import { ExecutiveInsightsGenerator } from "./ExecutiveInsightsGenerator.server";

export class ExecutiveDashboardManager {
  static async createExecutiveDashboard(
    tenantId: string,
    role: ExecutiveRole,
    ownerId: string,
    options: { name?: string; briefingFrequency?: BriefingFrequency; sharedWith?: string[] } = {}
  ): Promise<ExecutiveDashboard> {
    const now = new Date();
    const dashboard: ExecutiveDashboard = {
      id: `exec_dashboard_${crypto.randomUUID()}`,
      tenantId,
      name: options.name ?? `${role} Executive Dashboard`,
      role,
      isDefault: true,
      kpis: [],
      financialHealth: {} as any,
      growthMetrics: {} as any,
      operationalMetrics: {} as any,
      marketMetrics: {} as any,
      insights: [],
      risks: [],
      opportunities: [],
      okrs: [],
      briefingFrequency: options.briefingFrequency ?? "weekly",
      ownerId,
      sharedWith: options.sharedWith ?? [],
      createdAt: now,
      updatedAt: now,
    };

    await supabase.from("executive_dashboards").insert({
      id: dashboard.id,
      tenant_id: dashboard.tenantId,
      name: dashboard.name,
      role: dashboard.role,
      is_default: dashboard.isDefault,
      briefing_frequency: dashboard.briefingFrequency,
      owner_id: dashboard.ownerId,
      shared_with: dashboard.sharedWith,
    });

    dashboard.kpis = await ExecutiveMetricsEngine.createExecutiveKPIs(dashboard.id, tenantId);
    return dashboard;
  }

  static async refreshDashboard(dashboardId: string, tenantId: string) {
    const { data: dashboard } = await supabase
      .from("executive_dashboards")
      .select("*")
      .eq("id", dashboardId)
      .eq("tenant_id", tenantId)
      .single();
    if (!dashboard) throw new Error("Dashboard not found");

    const [financialHealth, growthMetrics, operationalMetrics, marketMetrics] = await Promise.all([
      ExecutiveMetricsEngine.calculateFinancialHealth(tenantId),
      ExecutiveMetricsEngine.calculateGrowthMetrics(tenantId),
      ExecutiveMetricsEngine.calculateOperationalMetrics(tenantId),
      ExecutiveMetricsEngine.calculateMarketMetrics(tenantId),
    ]);

    const [insights, risks, opportunities] = await Promise.all([
      ExecutiveInsightsGenerator.generateInsights(dashboardId, tenantId, financialHealth, growthMetrics),
      ExecutiveInsightsGenerator.identifyRisks(dashboardId, tenantId, financialHealth, growthMetrics),
      ExecutiveInsightsGenerator.identifyOpportunities(dashboardId, tenantId, financialHealth, growthMetrics),
    ]);

    await supabase
      .from("executive_dashboards")
      .update({
        financial_health: financialHealth as any,
        growth_metrics: growthMetrics as any,
        operational_metrics: operationalMetrics as any,
        market_metrics: marketMetrics as any,
        insights: insights as any,
        risks: risks as any,
        opportunities: opportunities as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dashboardId);

    return { financialHealth, growthMetrics, operationalMetrics, marketMetrics, insights, risks, opportunities };
  }

  static async getDashboardWithData(dashboardId: string, tenantId: string) {
    const { data: dashboard } = await supabase
      .from("executive_dashboards")
      .select("*")
      .eq("id", dashboardId)
      .eq("tenant_id", tenantId)
      .single();
    if (!dashboard) throw new Error("Dashboard not found");
    const { data: kpis } = await supabase.from("executive_kpis").select("*").eq("dashboard_id", dashboardId);
    return { ...dashboard, kpis: kpis ?? [] };
  }

  static async seedDefaultDashboards(tenantId: string, userId: string): Promise<void> {
    const roles: ExecutiveRole[] = ["CEO", "CFO", "COO", "CTO", "CMO"];
    for (const role of roles) {
      await this.createExecutiveDashboard(tenantId, role, userId, {
        name: `${role} Dashboard`,
        briefingFrequency: role === "CEO" ? "daily" : "weekly",
      });
    }
  }
}