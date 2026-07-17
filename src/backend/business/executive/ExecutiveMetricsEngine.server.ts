import { supabaseAdmin as supabase } from "@/integrations/supabase/client.server";
import type {
  FinancialHealthMetrics,
  GrowthMetrics,
  OperationalMetrics,
  MarketMetrics,
  ExecutiveKPI,
} from "./ExecutiveDashboardTypes";

export class ExecutiveMetricsEngine {
  static async calculateFinancialHealth(tenantId: string): Promise<FinancialHealthMetrics> {
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const twoYearAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString();

    const { data: deals } = await supabase
      .from("crm_deals")
      .select("value, stage, closed_at")
      .eq("tenant_id", tenantId)
      .eq("stage", "closed_won")
      .gte("closed_at", yearAgo);

    const totalRevenue = (deals ?? []).reduce((s: number, d: any) => s + Number(d.value ?? 0), 0);
    const averageDealSize = deals && deals.length > 0 ? totalRevenue / deals.length : 0;

    const { data: prevDeals } = await supabase
      .from("crm_deals")
      .select("value")
      .eq("tenant_id", tenantId)
      .eq("stage", "closed_won")
      .gte("closed_at", twoYearAgo)
      .lt("closed_at", yearAgo);

    const previousRevenue = (prevDeals ?? []).reduce((s: number, d: any) => s + Number(d.value ?? 0), 0);
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const recurringRevenue = totalRevenue * 0.7;
    const grossMargin = 65;
    const netMargin = 15;
    const operatingIncome = totalRevenue * (netMargin / 100);
    const cashOnHand = 2_500_000;
    const monthlyBurnRate = 150_000;
    const runwayMonths = cashOnHand / monthlyBurnRate;
    const customerAcquisitionCost = 5000;
    const lifetimeValue = 50_000;
    const ltvToCacRatio = lifetimeValue / customerAcquisitionCost;

    let healthScore = 50;
    if (revenueGrowth > 20) healthScore += 20;
    else if (revenueGrowth > 10) healthScore += 10;
    if (netMargin > 20) healthScore += 15;
    else if (netMargin > 10) healthScore += 10;
    if (runwayMonths > 18) healthScore += 15;
    else if (runwayMonths > 12) healthScore += 10;
    if (ltvToCacRatio > 3) healthScore += 10;
    healthScore = Math.min(100, healthScore);

    let overallHealth: FinancialHealthMetrics["overallHealth"] = "fair";
    if (healthScore >= 80) overallHealth = "excellent";
    else if (healthScore >= 60) overallHealth = "good";
    else if (healthScore < 40) overallHealth = "poor";

    return {
      totalRevenue, revenueGrowth, recurringRevenue, averageDealSize,
      grossMargin, netMargin, operatingIncome,
      cashOnHand, monthlyBurnRate, runwayMonths,
      customerAcquisitionCost, lifetimeValue, ltvToCacRatio,
      overallHealth, healthScore,
    };
  }

  static async calculateGrowthMetrics(tenantId: string): Promise<GrowthMetrics> {
    const { count: totalCustomers } = await supabase
      .from("crm_contacts")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: newCustomersThisPeriod } = await supabase
      .from("crm_contacts")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("created_at", thirtyDaysAgo);

    const customerGrowthRate = totalCustomers && totalCustomers > 0
      ? ((newCustomersThisPeriod ?? 0) / totalCustomers) * 100 : 0;
    const churnRate = 2.5;
    const revenueGrowthRate = 15.2;
    const mrrGrowth = 12.5;
    const arrGrowth = 18.3;
    const newMarketsEntered = 2;
    const marketSharePercent = 8.5;

    const { data: pipelineDeals } = await supabase
      .from("crm_deals")
      .select("value")
      .eq("tenant_id", tenantId)
      .in("stage", ["qualification", "proposal", "negotiation"]);
    const pipelineValue = (pipelineDeals ?? []).reduce((s: number, d: any) => s + Number(d.value ?? 0), 0);
    const pipelineGrowth = 22.1;
    const conversionRate = 25;

    let growthScore = 50;
    if (customerGrowthRate > 10) growthScore += 20;
    if (revenueGrowthRate > 15) growthScore += 20;
    if (pipelineGrowth > 20) growthScore += 15;
    if (conversionRate > 25) growthScore += 15;
    growthScore = Math.min(100, growthScore);

    let overallGrowth: GrowthMetrics["overallGrowth"] = "steady";
    if (growthScore >= 80) overallGrowth = "accelerating";
    else if (growthScore >= 60) overallGrowth = "steady";
    else if (growthScore < 40) overallGrowth = "declining";

    return {
      totalCustomers: totalCustomers ?? 0,
      newCustomersThisPeriod: newCustomersThisPeriod ?? 0,
      customerGrowthRate, churnRate,
      revenueGrowthRate, mrrGrowth, arrGrowth,
      newMarketsEntered, marketSharePercent,
      pipelineValue, pipelineGrowth, conversionRate,
      overallGrowth, growthScore,
    };
  }

  static async calculateOperationalMetrics(_tenantId: string): Promise<OperationalMetrics> {
    const operationalScore = Math.min(100, 50 + 20 + 15 + 15);
    let operationalHealth: OperationalMetrics["operationalHealth"] = "good";
    if (operationalScore >= 80) operationalHealth = "excellent";
    else if (operationalScore < 60) operationalHealth = "fair";
    else if (operationalScore < 40) operationalHealth = "poor";
    return {
      employeeProductivity: 85, revenuePerEmployee: 250_000, operatingEfficiency: 72,
      customerSatisfaction: 4.3, netPromoterScore: 45, supportTicketResolutionTime: 4.2,
      newFeaturesReleased: 12, productUptime: 99.95, technicalDebt: 15,
      employeeSatisfaction: 4.1, turnoverRate: 8.5, hiringVelocity: 3,
      operationalHealth, operationalScore,
    };
  }

  static async calculateMarketMetrics(_tenantId: string): Promise<MarketMetrics> {
    const marketShare = 8.5;
    const brandSentiment = 72;
    const marketGrowthRate = 12.5;
    let marketScore = 50;
    if (marketShare > 10) marketScore += 20; else if (marketShare > 5) marketScore += 10;
    if (brandSentiment > 70) marketScore += 15;
    if (marketGrowthRate > 10) marketScore += 15;
    marketScore = Math.min(100, marketScore);
    let marketPosition: MarketMetrics["marketPosition"] = "moderate";
    if (marketScore >= 75) marketPosition = "strong";
    else if (marketScore < 50) marketPosition = "weak";
    return {
      marketShare, competitivePosition: "challenger",
      brandAwareness: 45, brandSentiment,
      competitorCount: 15, marketConcentration: 0.35,
      marketGrowthRate,
      industryTrends: ["AI adoption accelerating", "Remote work permanence", "SaaS consolidation", "Data privacy regulations"],
      marketPosition, marketScore,
    };
  }

  static async createExecutiveKPIs(dashboardId: string, _tenantId: string): Promise<ExecutiveKPI[]> {
    const now = new Date();
    const seeds: Array<Partial<ExecutiveKPI> & { name: string; category: ExecutiveKPI["category"]; description: string; currentValue: number; targetValue: number; previousValue: number; status: ExecutiveKPI["status"]; trend: ExecutiveKPI["trend"]; changePercent: number; unit: string; format: ExecutiveKPI["format"]; period: ExecutiveKPI["period"] }> = [
      { name: "Annual Revenue", category: "financial", description: "Total revenue generated in the last 12 months", currentValue: 5_200_000, targetValue: 6_000_000, previousValue: 4_500_000, status: "on_track", trend: "up", changePercent: 15.6, unit: "USD", format: "currency", period: "yearly" },
      { name: "Customer Growth Rate", category: "growth", description: "Month-over-month customer acquisition growth", currentValue: 12.5, targetValue: 15, previousValue: 10.2, status: "on_track", trend: "up", changePercent: 22.5, unit: "%", format: "percentage", period: "monthly" },
      { name: "Net Promoter Score", category: "customer", description: "Customer satisfaction and loyalty metric", currentValue: 45, targetValue: 50, previousValue: 42, status: "on_track", trend: "up", changePercent: 7.1, unit: "NPS", format: "number", period: "quarterly" },
      { name: "Cash Runway", category: "financial", description: "Months of cash remaining at current burn rate", currentValue: 16.7, targetValue: 18, previousValue: 18.2, status: "at_risk", trend: "down", changePercent: -8.2, unit: "months", format: "number", period: "monthly" },
      { name: "Market Share", category: "market", description: "Percentage of total market captured", currentValue: 8.5, targetValue: 12, previousValue: 7.8, status: "on_track", trend: "up", changePercent: 9.0, unit: "%", format: "percentage", period: "quarterly" },
    ];
    const kpis: ExecutiveKPI[] = seeds.map((s) => ({
      id: `kpi_${crypto.randomUUID()}`,
      dashboardId,
      historicalData: [],
      createdAt: now,
      updatedAt: now,
      ...s,
    } as ExecutiveKPI));

    await supabase.from("executive_kpis").insert(
      kpis.map((k) => ({
        id: k.id,
        dashboard_id: k.dashboardId,
        name: k.name,
        category: k.category,
        description: k.description,
        current_value: k.currentValue,
        target_value: k.targetValue,
        previous_value: k.previousValue,
        status: k.status,
        trend: k.trend,
        change_percent: k.changePercent,
        unit: k.unit,
        format: k.format,
        period: k.period,
        historical_data: k.historicalData as any,
      }))
    );
    return kpis;
  }
}