import { supabaseAdmin as supabase } from "@/integrations/supabase/client.server";
import type {
  ExecutiveInsight,
  ExecutiveRisk,
  ExecutiveOpportunity,
  FinancialHealthMetrics,
  GrowthMetrics,
} from "./ExecutiveDashboardTypes";

export class ExecutiveInsightsGenerator {
  static async generateInsights(
    dashboardId: string,
    _tenantId: string,
    financialHealth: FinancialHealthMetrics,
    growthMetrics: GrowthMetrics
  ): Promise<ExecutiveInsight[]> {
    const insights: ExecutiveInsight[] = [];
    const now = new Date();

    if (financialHealth.revenueGrowth > 20) {
      insights.push({
        id: `insight_${crypto.randomUUID()}`,
        dashboardId,
        type: "opportunity",
        title: "Strong Revenue Growth Detected",
        description: `Revenue has grown ${financialHealth.revenueGrowth.toFixed(1)}% year-over-year.`,
        impactLevel: "high",
        confidence: 92,
        relatedKPIs: ["total_revenue", "revenue_growth"],
        supportingData: { currentRevenue: financialHealth.totalRevenue, growthRate: financialHealth.revenueGrowth },
        recommendedAction: "Increase marketing budget by 20% and expand sales team",
        priority: "high",
        status: "new",
        createdAt: now,
      });
    }

    if (growthMetrics.churnRate > 5) {
      insights.push({
        id: `insight_${crypto.randomUUID()}`,
        dashboardId,
        type: "risk",
        title: "Elevated Customer Churn Risk",
        description: `Customer churn rate at ${growthMetrics.churnRate.toFixed(1)}% exceeds healthy threshold of 5%.`,
        impactLevel: "critical",
        confidence: 88,
        relatedKPIs: ["churn_rate", "customer_retention"],
        supportingData: { churnRate: growthMetrics.churnRate, threshold: 5 },
        recommendedAction: "Launch customer success initiative and conduct churn analysis",
        priority: "urgent",
        status: "new",
        createdAt: now,
      });
    }

    if (financialHealth.runwayMonths < 12) {
      insights.push({
        id: `insight_${crypto.randomUUID()}`,
        dashboardId,
        type: "risk",
        title: "Cash Runway Below Target",
        description: `Current cash runway of ${financialHealth.runwayMonths.toFixed(1)} months is below the 18-month target.`,
        impactLevel: "critical",
        confidence: 95,
        relatedKPIs: ["cash_runway", "burn_rate"],
        supportingData: {
          runway: financialHealth.runwayMonths,
          target: 18,
          cashOnHand: financialHealth.cashOnHand,
          burnRate: financialHealth.monthlyBurnRate,
        },
        recommendedAction: "Initiate fundraising discussions or implement cost reduction plan",
        priority: "urgent",
        status: "new",
        createdAt: now,
      });
    }

    if (financialHealth.ltvToCacRatio > 3) {
      insights.push({
        id: `insight_${crypto.randomUUID()}`,
        dashboardId,
        type: "opportunity",
        title: "Excellent Unit Economics",
        description: `LTV:CAC ratio of ${financialHealth.ltvToCacRatio.toFixed(1)}x indicates highly efficient customer acquisition.`,
        impactLevel: "high",
        confidence: 90,
        relatedKPIs: ["ltv_cac_ratio"],
        supportingData: {
          ratio: financialHealth.ltvToCacRatio,
          ltv: financialHealth.lifetimeValue,
          cac: financialHealth.customerAcquisitionCost,
        },
        recommendedAction: "Increase customer acquisition budget by 30-50%",
        priority: "high",
        status: "new",
        createdAt: now,
      });
    }

    if (growthMetrics.marketSharePercent > 10) {
      insights.push({
        id: `insight_${crypto.randomUUID()}`,
        dashboardId,
        type: "opportunity",
        title: "Market Leadership Position",
        description: `Market share of ${growthMetrics.marketSharePercent}% positions company as industry leader.`,
        impactLevel: "medium",
        confidence: 85,
        relatedKPIs: ["market_share"],
        supportingData: { marketShare: growthMetrics.marketSharePercent },
        recommendedAction: "Explore strategic partnerships and premium product tiers",
        priority: "medium",
        status: "new",
        createdAt: now,
      });
    }

    if (insights.length > 0) {
      await supabase.from("executive_insights").insert(
        insights.map((i) => ({
          id: i.id,
          dashboard_id: i.dashboardId,
          type: i.type,
          title: i.title,
          description: i.description,
          impact_level: i.impactLevel,
          confidence: i.confidence,
          related_kpis: i.relatedKPIs,
          supporting_data: i.supportingData as any,
          recommended_action: i.recommendedAction,
          priority: i.priority,
          status: i.status,
        }))
      );
    }
    return insights;
  }

  static async identifyRisks(
    dashboardId: string,
    _tenantId: string,
    financialHealth: FinancialHealthMetrics,
    growthMetrics: GrowthMetrics
  ): Promise<ExecutiveRisk[]> {
    const risks: ExecutiveRisk[] = [];
    const now = new Date();

    if (financialHealth.runwayMonths < 12) {
      risks.push({
        id: `risk_${crypto.randomUUID()}`, dashboardId,
        title: "Insufficient Cash Runway",
        description: "Cash runway below 12 months creates financial vulnerability",
        category: "financial", probability: "high", impact: "critical", riskScore: 95,
        mitigationPlan: "Accelerate fundraising or implement cost reduction measures",
        status: "identified", createdAt: now, updatedAt: now,
      });
    }
    if (growthMetrics.churnRate > 5) {
      risks.push({
        id: `risk_${crypto.randomUUID()}`, dashboardId,
        title: "High Customer Churn",
        description: "Customer churn rate exceeding healthy threshold",
        category: "operational", probability: "high", impact: "high", riskScore: 80,
        mitigationPlan: "Launch customer success program and improve onboarding",
        status: "identified", createdAt: now, updatedAt: now,
      });
    }
    if (growthMetrics.marketSharePercent < 5) {
      risks.push({
        id: `risk_${crypto.randomUUID()}`, dashboardId,
        title: "Weak Market Position",
        description: "Low market share increases vulnerability to competitive pressure",
        category: "market", probability: "medium", impact: "high", riskScore: 60,
        mitigationPlan: "Differentiate product and target niche segments",
        status: "identified", createdAt: now, updatedAt: now,
      });
    }

    if (risks.length > 0) {
      await supabase.from("executive_risks").insert(
        risks.map((r) => ({
          id: r.id, dashboard_id: r.dashboardId,
          title: r.title, description: r.description, category: r.category,
          probability: r.probability, impact: r.impact, risk_score: r.riskScore,
          mitigation_plan: r.mitigationPlan, owner: r.owner, status: r.status,
        }))
      );
    }
    return risks;
  }

  static async identifyOpportunities(
    dashboardId: string,
    _tenantId: string,
    financialHealth: FinancialHealthMetrics,
    growthMetrics: GrowthMetrics
  ): Promise<ExecutiveOpportunity[]> {
    const opportunities: ExecutiveOpportunity[] = [];
    const now = new Date();

    if (financialHealth.ltvToCacRatio > 3 && financialHealth.revenueGrowth > 15) {
      opportunities.push({
        id: `opportunity_${crypto.randomUUID()}`, dashboardId,
        title: "Aggressive Growth Scaling",
        description: "Strong unit economics and revenue growth support aggressive expansion",
        category: "growth" as any,
        estimatedValue: 2_000_000, probability: 75, timeHorizon: "medium",
        investmentRequired: 500_000,
        resourcesNeeded: ["Sales team expansion", "Marketing budget increase"],
        status: "identified", createdAt: now, updatedAt: now,
      });
    }
    if (growthMetrics.marketSharePercent > 8) {
      opportunities.push({
        id: `opportunity_${crypto.randomUUID()}`, dashboardId,
        title: "Geographic Market Expansion",
        description: "Strong market position supports expansion into new regions",
        category: "expansion",
        estimatedValue: 1_500_000, probability: 60, timeHorizon: "long",
        investmentRequired: 750_000,
        resourcesNeeded: ["Regional sales team", "Localization"],
        status: "identified", createdAt: now, updatedAt: now,
      });
    }
    if (financialHealth.totalRevenue > 5_000_000) {
      opportunities.push({
        id: `opportunity_${crypto.randomUUID()}`, dashboardId,
        title: "Strategic Partnership",
        description: "Revenue scale attracts potential strategic partners or acquirers",
        category: "partnership",
        estimatedValue: 5_000_000, probability: 40, timeHorizon: "long",
        status: "identified", createdAt: now, updatedAt: now,
      });
    }

    if (opportunities.length > 0) {
      await supabase.from("executive_opportunities").insert(
        opportunities.map((o) => ({
          id: o.id, dashboard_id: o.dashboardId,
          title: o.title, description: o.description, category: o.category as string,
          estimated_value: o.estimatedValue, probability: o.probability,
          time_horizon: o.timeHorizon, investment_required: o.investmentRequired,
          resources_needed: o.resourcesNeeded, status: o.status,
        }))
      );
    }
    return opportunities;
  }
}