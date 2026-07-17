import { supabaseAdmin as supabase } from "@/integrations/supabase/client.server";
import type {
  ExecutiveBriefing,
  BriefingFrequency,
  FinancialHealthMetrics,
  GrowthMetrics,
  ExecutiveInsight,
  ExecutiveRisk,
  ExecutiveOpportunity,
} from "./ExecutiveDashboardTypes";

function calculatePeriod(frequency: BriefingFrequency): string {
  const now = new Date();
  switch (frequency) {
    case "daily": return now.toISOString().split("T")[0];
    case "weekly": {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return `${weekStart.toISOString().split("T")[0]} to ${now.toISOString().split("T")[0]}`;
    }
    case "monthly": return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    case "quarterly": return `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
    default: return now.toISOString().split("T")[0];
  }
}

async function generateSummaryAI(
  frequency: BriefingFrequency,
  financialHealth: FinancialHealthMetrics,
  growthMetrics: GrowthMetrics,
  insights: ExecutiveInsight[],
  risks: ExecutiveRisk[],
  opportunities: ExecutiveOpportunity[]
): Promise<{
  executiveSummary: string;
  keyHighlights: string[];
  criticalIssues: string[];
  strategicRecommendations: string[];
}> {
  const fallback = {
    executiveSummary: `${frequency} briefing: revenue $${financialHealth.totalRevenue.toLocaleString()} at ${financialHealth.revenueGrowth.toFixed(1)}% growth; ${growthMetrics.totalCustomers} customers; runway ${financialHealth.runwayMonths.toFixed(1)} months.`,
    keyHighlights: [
      `Revenue growth: ${financialHealth.revenueGrowth.toFixed(1)}%`,
      `Customers: ${growthMetrics.totalCustomers}`,
      `Pipeline: $${growthMetrics.pipelineValue.toLocaleString()}`,
    ],
    criticalIssues: risks.filter((r) => r.impact === "critical").map((r) => r.title),
    strategicRecommendations: opportunities.slice(0, 3).map((o) => o.title),
  };
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return fallback;

  try {
    const prompt = `Generate a ${frequency} executive briefing summary as strict JSON with keys executiveSummary (string), keyHighlights (string[]), criticalIssues (string[]), strategicRecommendations (string[]). Data: revenue=$${financialHealth.totalRevenue}, growth=${financialHealth.revenueGrowth}%, netMargin=${financialHealth.netMargin}%, runway=${financialHealth.runwayMonths}mo, customers=${growthMetrics.totalCustomers}, churn=${growthMetrics.churnRate}%, insights=${insights.length}, risks=${risks.length}, opportunities=${opportunities.length}.`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return fallback;
    const parsed = JSON.parse(content);
    return {
      executiveSummary: parsed.executiveSummary ?? fallback.executiveSummary,
      keyHighlights: parsed.keyHighlights ?? [],
      criticalIssues: parsed.criticalIssues ?? [],
      strategicRecommendations: parsed.strategicRecommendations ?? [],
    };
  } catch (e) {
    console.error("[ExecutiveBriefing] AI failed:", e);
    return fallback;
  }
}

export class ExecutiveBriefingSystem {
  static async generateBriefing(
    dashboardId: string,
    tenantId: string,
    frequency: BriefingFrequency,
    financialHealth: FinancialHealthMetrics,
    growthMetrics: GrowthMetrics,
    insights: ExecutiveInsight[],
    risks: ExecutiveRisk[],
    opportunities: ExecutiveOpportunity[]
  ): Promise<ExecutiveBriefing> {
    const ai = await generateSummaryAI(frequency, financialHealth, growthMetrics, insights, risks, opportunities);
    const now = new Date();
    const briefing: ExecutiveBriefing = {
      id: `briefing_${crypto.randomUUID()}`,
      dashboardId, tenantId,
      title: `${frequency[0].toUpperCase() + frequency.slice(1)} Executive Briefing - ${now.toLocaleDateString()}`,
      period: calculatePeriod(frequency),
      frequency,
      executiveSummary: ai.executiveSummary,
      keyHighlights: ai.keyHighlights,
      criticalIssues: ai.criticalIssues,
      strategicRecommendations: ai.strategicRecommendations,
      kpiSnapshot: {
        revenue: financialHealth.totalRevenue,
        customers: growthMetrics.totalCustomers,
        runway: financialHealth.runwayMonths,
      },
      financialSnapshot: financialHealth,
      topInsights: insights.slice(0, 5),
      topRisks: risks.slice(0, 5),
      topOpportunities: opportunities.slice(0, 5),
      generatedAt: now,
      deliveredTo: [],
      createdAt: now,
    };

    await supabase.from("executive_briefings").insert({
      id: briefing.id,
      dashboard_id: briefing.dashboardId,
      tenant_id: briefing.tenantId,
      title: briefing.title,
      period: briefing.period,
      frequency: briefing.frequency,
      executive_summary: briefing.executiveSummary,
      key_highlights: briefing.keyHighlights,
      critical_issues: briefing.criticalIssues,
      strategic_recommendations: briefing.strategicRecommendations,
      kpi_snapshot: briefing.kpiSnapshot as any,
      financial_snapshot: briefing.financialSnapshot as any,
      top_insights: briefing.topInsights as any,
      top_risks: briefing.topRisks as any,
      top_opportunities: briefing.topOpportunities as any,
      generated_at: briefing.generatedAt.toISOString(),
    });

    return briefing;
  }

  static async deliverBriefing(briefingId: string, recipients: string[]): Promise<void> {
    await supabase
      .from("executive_briefings")
      .update({
        delivered_at: new Date().toISOString(),
        delivered_to: recipients,
      })
      .eq("id", briefingId);
  }

  static async getRecentBriefings(dashboardId: string, tenantId: string, limit = 10) {
    const { data } = await supabase
      .from("executive_briefings")
      .select("*")
      .eq("dashboard_id", dashboardId)
      .eq("tenant_id", tenantId)
      .order("generated_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  }
}