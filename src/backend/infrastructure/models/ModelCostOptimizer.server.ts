import type { AIModel, ModelCostRecord } from "./ModelRouterTypes";
import { ModelRegistry } from "./ModelRegistry.server";

export class ModelCostOptimizer {
  static estimateCost(model: AIModel, inputTokens: number, outputTokens: number): number {
    return (
      inputTokens * model.costPerInputTokenUSD +
      outputTokens * model.costPerOutputTokenUSD +
      (model.costPerRequestUSD ?? 0)
    );
  }

  static async recordCost(
    requestId: string,
    model: AIModel,
    tenantId: string,
    inputTokens: number,
    outputTokens: number,
    latencyMs: number,
    success: boolean,
  ): Promise<ModelCostRecord> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const inputCost = inputTokens * model.costPerInputTokenUSD;
    const outputCost = outputTokens * model.costPerOutputTokenUSD;
    const totalCost = inputCost + outputCost + (model.costPerRequestUSD ?? 0);
    const record: ModelCostRecord = {
      id: `cost_${crypto.randomUUID()}`,
      requestId, modelId: model.id, tenantId,
      inputTokens, outputTokens, totalTokens: inputTokens + outputTokens,
      inputCostUSD: inputCost, outputCostUSD: outputCost, totalCostUSD: totalCost,
      latencyMs, success, timestamp: new Date(),
    };
    await supabaseAdmin.from("model_cost_records").insert({
      id: record.id,
      request_id: requestId,
      model_id: model.id,
      tenant_id: tenantId,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: record.totalTokens,
      input_cost_usd: inputCost,
      output_cost_usd: outputCost,
      total_cost_usd: totalCost,
      latency_ms: latencyMs,
      success,
      timestamp: record.timestamp.toISOString(),
    });
    return record;
  }

  static async getCostBreakdown(tenantId: string, days = 30) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
    const { data: records } = await supabaseAdmin
      .from("model_cost_records").select("*")
      .eq("tenant_id", tenantId).gte("timestamp", cutoff);
    const totalCostUSD = (records ?? []).reduce((s: number, r: any) => s + r.total_cost_usd, 0);
    const modelCosts: Record<string, { cost: number; count: number }> = {};
    for (const r of records ?? []) {
      const c = (modelCosts[r.model_id] ??= { cost: 0, count: 0 });
      c.cost += r.total_cost_usd; c.count++;
    }
    const byModel = await Promise.all(
      Object.entries(modelCosts).map(async ([modelId, d]) => {
        const model = await ModelRegistry.getModel(modelId);
        return {
          modelId,
          modelName: model?.displayName ?? "Unknown",
          costUSD: d.cost,
          percentage: totalCostUSD > 0 ? (d.cost / totalCostUSD) * 100 : 0,
        };
      }),
    );
    byModel.sort((a, b) => b.costUSD - a.costUSD);
    const dailyCosts: Record<string, number> = {};
    for (const r of records ?? []) {
      const date = String(r.timestamp).substring(0, 10);
      dailyCosts[date] = (dailyCosts[date] ?? 0) + r.total_cost_usd;
    }
    const byDay = Object.entries(dailyCosts)
      .map(([date, costUSD]) => ({ date, costUSD }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return { totalCostUSD, byModel, byDay };
  }

  static async getOptimizationRecommendations(tenantId: string) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const breakdown = await this.getCostBreakdown(tenantId, 30);
    const currentMonthlyCostUSD = breakdown.totalCostUSD;
    const recommendations: { type: string; description: string; savingsUSD: number }[] = [];
    const expensive = breakdown.byModel.find((m) => m.costUSD > currentMonthlyCostUSD * 0.5);
    if (expensive) {
      recommendations.push({
        type: "model_downgrade",
        description: `Consider using cheaper models for simple tasks (currently spending $${expensive.costUSD.toFixed(2)} on ${expensive.modelName})`,
        savingsUSD: expensive.costUSD * 0.3,
      });
    }
    const { count } = await supabaseAdmin
      .from("model_routing_decisions")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("timestamp", new Date(Date.now() - 30 * 86_400_000).toISOString());
    if ((count ?? 0) > 1000) {
      recommendations.push({
        type: "caching",
        description: "Implement semantic caching for repeated queries",
        savingsUSD: currentMonthlyCostUSD * 0.15,
      });
    }
    const potentialSavingsUSD = recommendations.reduce((s, r) => s + r.savingsUSD, 0);
    return { currentMonthlyCostUSD, potentialSavingsUSD, recommendations };
  }

  static async getCostByTaskType(tenantId: string, days = 30) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
    const { data: decisions } = await supabaseAdmin
      .from("model_routing_decisions")
      .select("task_type, estimated_cost_usd")
      .eq("tenant_id", tenantId).gte("timestamp", cutoff);
    const map: Record<string, { cost: number; count: number }> = {};
    for (const d of decisions ?? []) {
      const t = (map[d.task_type] ??= { cost: 0, count: 0 });
      t.cost += d.estimated_cost_usd; t.count++;
    }
    return Object.entries(map).map(([taskType, d]) => ({
      taskType,
      totalCostUSD: d.cost,
      requestCount: d.count,
      avgCostPerRequestUSD: d.count > 0 ? d.cost / d.count : 0,
    }));
  }
}