import type {
  AgentBudgetConfig,
  BudgetDecision,
  BudgetResourceType,
  BudgetTransaction,
  CostMetrics,
} from "./AgentBudgetTypes";

export class AgentBudgetEngine {
  private static configs: Map<string, AgentBudgetConfig> = new Map();
  private static usageCache: Map<string, CostMetrics> = new Map();

  static configureAgent(config: AgentBudgetConfig) {
    this.configs.set(config.agentId, config);
    this.usageCache.set(config.agentId, this.getZeroMetrics());
    console.log(`[BudgetEngine] Configured budget for agent: ${config.agentId}`);
  }

  static getConfig(agentId: string) {
    return this.configs.get(agentId);
  }

  static async checkBudget(agentId: string, estimatedCost: CostMetrics): Promise<BudgetDecision> {
    const config = this.configs.get(agentId);
    if (!config) {
      return { status: "allowed", currentUsage: this.getZeroMetrics(), limit: this.getZeroMetrics() };
    }
    const currentUsage = await this.getCurrentUsage(agentId);
    const limit = config.limits.daily;
    const projectedTotal = currentUsage.totalCostUSD + estimatedCost.totalCostUSD;

    if (limit.totalCostUSD > 0 && projectedTotal > limit.totalCostUSD) {
      const overagePercentage = ((projectedTotal - limit.totalCostUSD) / limit.totalCostUSD) * 100;
      if (overagePercentage > 20) {
        return { status: "blocked", reason: `Hard budget limit exceeded. Overage: ${overagePercentage.toFixed(1)}%`, currentUsage, limit };
      }
      return { status: "requires_approval", reason: `Soft budget limit exceeded. Overage: ${overagePercentage.toFixed(1)}%`, currentUsage, limit };
    }
    if (limit.totalCostUSD > 0 && projectedTotal > limit.totalCostUSD * 0.8) {
      return { status: "warning", reason: `Approaching daily budget limit`, currentUsage, limit };
    }
    return { status: "allowed", currentUsage, limit };
  }

  static async recordTransaction(transaction: Omit<BudgetTransaction, "id">) {
    const fullTransaction: BudgetTransaction = {
      ...transaction,
      id: `txn_${crypto.randomUUID()}`,
    };

    const currentUsage = this.usageCache.get(transaction.agentId) ?? this.getZeroMetrics();
    this.updateMetrics(currentUsage, transaction.resourceType, transaction.amount, transaction.costUSD);
    this.usageCache.set(transaction.agentId, currentUsage);

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("budget_transactions").insert({
        id: fullTransaction.id,
        agent_id: fullTransaction.agentId,
        department: fullTransaction.department,
        resource_type: fullTransaction.resourceType,
        amount: fullTransaction.amount,
        cost_usd: fullTransaction.costUSD,
        metadata: fullTransaction.metadata as any,
      });
      if (error) console.error("[BudgetEngine] Failed to record transaction:", error);
    } catch (err) {
      console.error("[BudgetEngine] Persistence unavailable:", err);
    }
  }

  static async getCurrentUsage(agentId: string): Promise<CostMetrics> {
    return this.usageCache.get(agentId) ?? this.getZeroMetrics();
  }

  private static updateMetrics(metrics: CostMetrics, type: BudgetResourceType, amount: number, cost: number) {
    if (type === "llm_tokens") {
      metrics.llmTokens += amount;
      metrics.llmCostUSD += cost;
    } else if (type === "tool_execution") {
      metrics.toolExecutions += amount;
      metrics.toolCostUSD += cost;
    } else if (type === "api_calls") {
      metrics.apiCalls += amount;
      metrics.apiCostUSD += cost;
    }
    metrics.totalCostUSD = metrics.llmCostUSD + metrics.toolCostUSD + metrics.apiCostUSD;
  }

  private static getZeroMetrics(): CostMetrics {
    return { llmTokens: 0, llmCostUSD: 0, toolExecutions: 0, toolCostUSD: 0, apiCalls: 0, apiCostUSD: 0, totalCostUSD: 0 };
  }

  static async flushCacheToDB() {
    console.log("[BudgetEngine] Flushing usage cache to database...");
  }
}