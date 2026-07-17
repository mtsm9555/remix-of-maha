import type {
  AIModel,
  ModelRoutingDecision,
  ModelRoutingRequest,
  RoutingCondition,
  RoutingRule,
} from "./ModelRouterTypes";
import { ModelRegistry } from "./ModelRegistry.server";
import { ModelCostOptimizer } from "./ModelCostOptimizer.server";

function rowToRule(r: any): RoutingRule {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    conditions: r.conditions ?? [],
    logic: r.logic,
    primaryModelId: r.primary_model_id,
    fallbackModelIds: r.fallback_model_ids ?? [],
    fallbackStrategy: r.fallback_strategy,
    maxCostPerRequestUSD: r.max_cost_per_request_usd ?? undefined,
    maxLatencyMs: r.max_latency_ms ?? undefined,
    minConfidenceScore: r.min_confidence_score ?? undefined,
    priority: r.priority,
    isActive: r.is_active,
    tenantId: r.tenant_id ?? undefined,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export class ModelRoutingEngine {
  static async routeRequest(request: ModelRoutingRequest): Promise<ModelRoutingDecision> {
    const startTime = Date.now();
    const requestId = `req_${crypto.randomUUID()}`;
    const rules = await this.loadRoutingRules(request.context.tenantId);
    const matching = this.findMatchingRule(rules, request);

    if (matching) {
      const primary = await ModelRegistry.getModel(matching.primaryModelId);
      if (primary && primary.isAvailable) {
        const decision = this.createDecision(requestId, primary, matching, request, startTime, "Rule matched");
        decision.fallbackModels = await this.loadFallbackModels(matching.fallbackModelIds);
        return decision;
      }
    }

    const selected = await this.intelligentModelSelection(request);
    if (!selected) throw new Error("No suitable model found for request");
    return this.createDecision(requestId, selected, matching, request, startTime, "Intelligent selection");
  }

  private static findMatchingRule(rules: RoutingRule[], request: ModelRoutingRequest): RoutingRule | null {
    for (const rule of rules) if (this.evaluateRule(rule, request)) return rule;
    return null;
  }

  private static evaluateRule(rule: RoutingRule, request: ModelRoutingRequest): boolean {
    const results = rule.conditions.map((c) => this.evaluateCondition(c, request));
    return rule.logic === "AND" ? results.every(Boolean) : results.some(Boolean);
  }

  private static evaluateCondition(c: RoutingCondition, request: ModelRoutingRequest): boolean {
    const value = this.resolveField(c.field, request);
    switch (c.operator) {
      case "eq": return value === c.value;
      case "neq": return value !== c.value;
      case "gt": return value > c.value;
      case "lt": return value < c.value;
      case "gte": return value >= c.value;
      case "lte": return value <= c.value;
      case "in": return Array.isArray(c.value) && c.value.includes(value);
      case "contains": return String(value).includes(c.value);
      case "regex": return new RegExp(c.value).test(String(value));
      default: return false;
    }
  }

  private static resolveField(field: string, request: ModelRoutingRequest): any {
    let value: any = request;
    for (const part of field.split(".")) {
      if (value == null) return undefined;
      value = value[part];
    }
    return value;
  }

  private static async intelligentModelSelection(request: ModelRoutingRequest): Promise<AIModel | null> {
    const required = request.task.requiredCapabilities ?? ["text"];
    const candidates = await ModelRegistry.getModelsByCapabilities(required);
    if (candidates.length === 0) return null;

    const filtered = candidates.filter((m) => {
      if (request.constraints.maxCostUSD) {
        const est = ModelCostOptimizer.estimateCost(m, request.task.estimatedInputTokens ?? 1000, request.task.estimatedOutputTokens ?? 500);
        if (est > request.constraints.maxCostUSD) return false;
      }
      if (request.constraints.maxLatencyMs && m.averageLatencyMs > request.constraints.maxLatencyMs) return false;
      if (request.constraints.preferredProvider && m.provider !== request.constraints.preferredProvider) return false;
      return true;
    });
    const pool = filtered.length > 0 ? filtered : candidates;
    const scored = pool.map((m) => ({ m, score: this.scoreModel(m, request) }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0].m;
  }

  private static scoreModel(model: AIModel, request: ModelRoutingRequest): number {
    let score = 100;
    const est = ModelCostOptimizer.estimateCost(model, request.task.estimatedInputTokens ?? 1000, request.task.estimatedOutputTokens ?? 500);
    score -= est * 10000;
    score -= model.averageLatencyMs / 100;
    score -= model.currentLoad * 20;
    const required = request.task.requiredCapabilities ?? ["text"];
    score += required.filter((c) => model.capabilities.includes(c)).length * 10;
    if (request.task.complexity === "expert" && model.capabilities.includes("reasoning")) score += 30;
    else if (request.task.complexity === "simple" && model.capabilities.includes("fast_inference")) score += 20;
    return score;
  }

  private static createDecision(
    requestId: string,
    model: AIModel,
    rule: RoutingRule | null,
    request: ModelRoutingRequest,
    startTime: number,
    reasoning: string,
  ): ModelRoutingDecision {
    const estimatedCostUSD = ModelCostOptimizer.estimateCost(
      model,
      request.task.estimatedInputTokens ?? 1000,
      request.task.estimatedOutputTokens ?? 500,
    );
    return {
      requestId,
      selectedModel: model,
      fallbackModels: [],
      routingRuleId: rule?.id,
      strategy: "balanced",
      reasoning,
      score: 1.0,
      estimatedCostUSD,
      estimatedLatencyMs: model.averageLatencyMs,
      timestamp: new Date(),
      processingTimeMs: Date.now() - startTime,
    };
  }

  private static async loadRoutingRules(tenantId: string): Promise<RoutingRule[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("model_routing_rules")
      .select("*")
      .eq("is_active", true)
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
      .order("priority", { ascending: false });
    return (data ?? []).map(rowToRule);
  }

  private static async loadFallbackModels(ids: string[]): Promise<AIModel[]> {
    const out: AIModel[] = [];
    for (const id of ids) {
      const m = await ModelRegistry.getModel(id);
      if (m && m.isAvailable) out.push(m);
    }
    return out;
  }

  static async recordRoutingDecision(decision: ModelRoutingDecision, request: ModelRoutingRequest): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("model_routing_decisions").insert({
      id: decision.requestId,
      selected_model_id: decision.selectedModel.id,
      routing_rule_id: decision.routingRuleId ?? null,
      strategy: decision.strategy,
      reasoning: decision.reasoning,
      score: decision.score,
      estimated_cost_usd: decision.estimatedCostUSD,
      estimated_latency_ms: decision.estimatedLatencyMs,
      processing_time_ms: decision.processingTimeMs,
      tenant_id: request.context.tenantId,
      task_type: request.task.type,
      task_complexity: request.task.complexity ?? null,
      timestamp: decision.timestamp.toISOString(),
    });
  }
}