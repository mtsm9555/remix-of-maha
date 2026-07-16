import { PricingRegistry } from "./PricingRegistry.server";
import { InstanceWalletManager } from "@/backend/infrastructure/budget/InstanceWalletManager";
import type { ToolCostEvent, ToolPricingModel } from "./CostTrackingTypes";

interface CostMetrics {
  executionTimeMs: number;
  memoryUsedMB: number;
  tokensUsed?: { input: number; output: number };
  externalApiCalls: number;
}

export class CostCalculator {
  static async calculateAndDeduct(
    toolName: string,
    agentInstanceId: string,
    agentId: string,
    department: string,
    metrics: CostMetrics,
  ): Promise<ToolCostEvent> {
    const pricing = await PricingRegistry.getPricingModel(toolName);
    const model: ToolPricingModel = pricing ?? {
      toolName,
      modelType: "fixed_per_call",
      baseCostUSD: 0.001,
      costPerCpuSecondUSD: 0,
      costPerMemoryMBSecondUSD: 0,
      costPerInputTokenUSD: 0,
      costPerOutputTokenUSD: 0,
      externalApiCostMultiplier: 1,
    };

    const seconds = metrics.executionTimeMs / 1000;
    const baseCost = model.baseCostUSD;
    const computeCost =
      seconds * model.costPerCpuSecondUSD +
      seconds * metrics.memoryUsedMB * model.costPerMemoryMBSecondUSD;
    const tokenCost = metrics.tokensUsed
      ? metrics.tokensUsed.input * model.costPerInputTokenUSD +
        metrics.tokensUsed.output * model.costPerOutputTokenUSD
      : 0;
    const externalApiCost =
      metrics.externalApiCalls * 0.01 * model.externalApiCostMultiplier;
    const totalCostUSD = baseCost + computeCost + tokenCost + externalApiCost;

    const event: ToolCostEvent = {
      id: `cost_${crypto.randomUUID()}`,
      timestamp: new Date(),
      toolName,
      agentId,
      department,
      executionTimeMs: metrics.executionTimeMs,
      memoryUsedMB: metrics.memoryUsedMB,
      tokensUsed: metrics.tokensUsed,
      externalApiCalls: metrics.externalApiCalls,
      totalCostUSD,
      costBreakdown: { baseCost, computeCost, tokenCost, externalApiCost },
    };

    if (totalCostUSD > 0 && agentInstanceId) {
      try {
        await InstanceWalletManager.deductFunds(
          agentInstanceId,
          totalCostUSD,
          "tool_execution",
          toolName,
        );
      } catch (err) {
        console.error("[CostCalculator] wallet deduct failed", err);
      }
    }

    void this.persistEvent(event);
    return event;
  }

  private static async persistEvent(event: ToolCostEvent) {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      await supabaseAdmin.from("tool_cost_events").insert({
        id: event.id,
        tool_name: event.toolName,
        agent_id: event.agentId,
        department: event.department,
        execution_time_ms: event.executionTimeMs,
        memory_used_mb: event.memoryUsedMB,
        tokens_used: event.tokensUsed ?? null,
        total_cost_usd: event.totalCostUSD,
        cost_breakdown: event.costBreakdown,
        timestamp: event.timestamp.toISOString(),
      });
    } catch (err) {
      console.error("[CostCalculator] persist failed", err);
    }
  }
}