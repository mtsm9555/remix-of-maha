import type { CostMetrics } from "./AgentBudgetTypes";

const LLM_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
  "text-embedding-3-small": { input: 0.02, output: 0.0 },
};

const TOOL_PRICING: Record<string, number> = {
  search_web: 0.005,
  send_bulk_email: 0.01,
  deploy_to_production: 0.0,
  initiate_bank_transfer: 0.5,
};

export class CostCalculator {
  static calculateLLMCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = LLM_PRICING[model.toLowerCase()];
    if (!pricing) {
      console.warn(`[CostCalculator] Unknown model pricing for ${model}, defaulting to $0.01/1k tokens`);
      return ((inputTokens + outputTokens) / 1000) * 0.01;
    }
    return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
  }

  static calculateToolCost(toolName: string): number {
    return TOOL_PRICING[toolName] ?? 0.001;
  }

  static estimateTaskCost(_taskDescription: string, estimatedTokens: number = 2000): CostMetrics {
    const llmCost = this.calculateLLMCost("gpt-4o", estimatedTokens * 0.7, estimatedTokens * 0.3);
    const toolCostUSD = 0.01;
    return {
      llmTokens: estimatedTokens,
      llmCostUSD: llmCost,
      toolExecutions: 2,
      toolCostUSD,
      apiCalls: 1,
      apiCostUSD: 0,
      totalCostUSD: llmCost + toolCostUSD,
    };
  }
}