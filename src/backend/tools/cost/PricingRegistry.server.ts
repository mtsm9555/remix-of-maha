import type { ToolPricingModel } from "./CostTrackingTypes";

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; model: ToolPricingModel | null }>();

function mapRow(row: Record<string, unknown>): ToolPricingModel {
  return {
    toolName: row.tool_name as string,
    modelType: row.model_type as ToolPricingModel["modelType"],
    baseCostUSD: Number(row.base_cost_usd ?? 0),
    costPerCpuSecondUSD: Number(row.cost_per_cpu_second_usd ?? 0),
    costPerMemoryMBSecondUSD: Number(row.cost_per_memory_mb_second_usd ?? 0),
    costPerInputTokenUSD: Number(row.cost_per_input_token_usd ?? 0),
    costPerOutputTokenUSD: Number(row.cost_per_output_token_usd ?? 0),
    externalApiCostMultiplier: Number(row.external_api_cost_multiplier ?? 1),
  };
}

export class PricingRegistry {
  static async getPricingModel(toolName: string): Promise<ToolPricingModel | null> {
    const hit = cache.get(toolName);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.model;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("tool_pricing_models")
      .select("*")
      .eq("tool_name", toolName)
      .maybeSingle();
    if (error || !data) {
      cache.set(toolName, { at: Date.now(), model: null });
      return null;
    }
    const model = mapRow(data as Record<string, unknown>);
    cache.set(toolName, { at: Date.now(), model });
    return model;
  }

  static async updatePricingModel(model: ToolPricingModel) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("tool_pricing_models").upsert(
      {
        tool_name: model.toolName,
        model_type: model.modelType,
        base_cost_usd: model.baseCostUSD,
        cost_per_cpu_second_usd: model.costPerCpuSecondUSD,
        cost_per_memory_mb_second_usd: model.costPerMemoryMBSecondUSD,
        cost_per_input_token_usd: model.costPerInputTokenUSD,
        cost_per_output_token_usd: model.costPerOutputTokenUSD,
        external_api_cost_multiplier: model.externalApiCostMultiplier,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "tool_name" },
    );
    if (error) throw new Error(error.message);
    cache.set(model.toolName, { at: Date.now(), model });
  }

  static invalidate(toolName?: string) {
    if (toolName) cache.delete(toolName);
    else cache.clear();
  }
}