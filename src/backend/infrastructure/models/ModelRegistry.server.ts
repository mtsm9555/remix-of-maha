import type { AIModel, ModelCapability, ModelProvider } from "./ModelRouterTypes";

function rowToModel(r: any): AIModel {
  return {
    id: r.id,
    provider: r.provider,
    modelName: r.model_name,
    displayName: r.display_name,
    capabilities: r.capabilities ?? [],
    maxContextTokens: r.max_context_tokens,
    maxOutputTokens: r.max_output_tokens,
    supportsStreaming: r.supports_streaming,
    supportsVision: r.supports_vision,
    supportsFunctionCalling: r.supports_function_calling,
    averageLatencyMs: r.average_latency_ms,
    p95LatencyMs: r.p95_latency_ms,
    throughputTokensPerSecond: r.throughput_tokens_per_second,
    costPerInputTokenUSD: r.cost_per_input_token_usd,
    costPerOutputTokenUSD: r.cost_per_output_token_usd,
    costPerRequestUSD: r.cost_per_request_usd ?? undefined,
    isActive: r.is_active,
    isAvailable: r.is_available,
    rateLimitPerMinute: r.rate_limit_per_minute,
    currentLoad: r.current_load,
    version: r.version,
    releasedAt: new Date(r.released_at),
    deprecatedAt: r.deprecated_at ? new Date(r.deprecated_at) : undefined,
    metadata: r.metadata ?? {},
  };
}

export class ModelRegistry {
  private static cache: Map<string, AIModel> = new Map();
  private static lastRefresh = 0;
  private static readonly CACHE_TTL_MS = 60_000;

  private static async refreshIfNeeded(): Promise<void> {
    if (Date.now() - this.lastRefresh < this.CACHE_TTL_MS && this.cache.size > 0) return;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("ai_models").select("*").eq("is_active", true);
    this.cache.clear();
    for (const row of data ?? []) this.cache.set(row.id, rowToModel(row));
    this.lastRefresh = Date.now();
  }

  static async getAllModels(): Promise<AIModel[]> {
    await this.refreshIfNeeded();
    return Array.from(this.cache.values());
  }

  static async getModel(modelId: string): Promise<AIModel | null> {
    await this.refreshIfNeeded();
    return this.cache.get(modelId) ?? null;
  }

  static async getModelsByCapability(capability: ModelCapability): Promise<AIModel[]> {
    await this.refreshIfNeeded();
    return Array.from(this.cache.values()).filter(
      (m) => m.capabilities.includes(capability) && m.isActive && m.isAvailable,
    );
  }

  static async getModelsByProvider(provider: ModelProvider): Promise<AIModel[]> {
    await this.refreshIfNeeded();
    return Array.from(this.cache.values()).filter(
      (m) => m.provider === provider && m.isActive && m.isAvailable,
    );
  }

  static async getModelsByCapabilities(capabilities: ModelCapability[]): Promise<AIModel[]> {
    await this.refreshIfNeeded();
    return Array.from(this.cache.values()).filter(
      (m) => m.isActive && m.isAvailable && capabilities.every((c) => m.capabilities.includes(c)),
    );
  }

  static async registerModel(model: Omit<AIModel, "id">): Promise<AIModel> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = `model_${crypto.randomUUID()}`;
    const { data, error } = await supabaseAdmin
      .from("ai_models")
      .insert({
        id,
        provider: model.provider,
        model_name: model.modelName,
        display_name: model.displayName,
        capabilities: model.capabilities,
        max_context_tokens: model.maxContextTokens,
        max_output_tokens: model.maxOutputTokens,
        supports_streaming: model.supportsStreaming,
        supports_vision: model.supportsVision,
        supports_function_calling: model.supportsFunctionCalling,
        average_latency_ms: model.averageLatencyMs,
        p95_latency_ms: model.p95LatencyMs,
        throughput_tokens_per_second: model.throughputTokensPerSecond,
        cost_per_input_token_usd: model.costPerInputTokenUSD,
        cost_per_output_token_usd: model.costPerOutputTokenUSD,
        cost_per_request_usd: model.costPerRequestUSD ?? 0,
        is_active: model.isActive,
        is_available: model.isAvailable,
        rate_limit_per_minute: model.rateLimitPerMinute,
        current_load: model.currentLoad,
        version: model.version,
        released_at: model.releasedAt.toISOString(),
        deprecated_at: model.deprecatedAt?.toISOString() ?? null,
        metadata: model.metadata,
      })
      .select()
      .single();
    if (error) throw error;
    const full = rowToModel(data);
    this.cache.set(full.id, full);
    return full;
  }

  static async updateModelMetrics(
    modelId: string,
    metrics: { averageLatencyMs?: number; p95LatencyMs?: number; currentLoad?: number; isAvailable?: boolean },
  ): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const updates: any = {};
    if (metrics.averageLatencyMs !== undefined) updates.average_latency_ms = metrics.averageLatencyMs;
    if (metrics.p95LatencyMs !== undefined) updates.p95_latency_ms = metrics.p95LatencyMs;
    if (metrics.currentLoad !== undefined) updates.current_load = metrics.currentLoad;
    if (metrics.isAvailable !== undefined) updates.is_available = metrics.isAvailable;
    if (Object.keys(updates).length === 0) return;
    await supabaseAdmin.from("ai_models").update(updates).eq("id", modelId);
    this.lastRefresh = 0;
  }

  static async seedDefaultModels(): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const defaults: Array<Omit<AIModel, "id">> = [
      {
        provider: "openai", modelName: "gpt-4o", displayName: "GPT-4o",
        capabilities: ["text", "vision", "code", "reasoning", "function_calling"],
        maxContextTokens: 128000, maxOutputTokens: 4096,
        supportsStreaming: true, supportsVision: true, supportsFunctionCalling: true,
        averageLatencyMs: 2000, p95LatencyMs: 4000, throughputTokensPerSecond: 100,
        costPerInputTokenUSD: 0.000005, costPerOutputTokenUSD: 0.000015,
        isActive: true, isAvailable: true, rateLimitPerMinute: 500, currentLoad: 0.5,
        version: "2024-08-06", releasedAt: new Date("2024-08-06"), metadata: {},
      },
      {
        provider: "openai", modelName: "gpt-4o-mini", displayName: "GPT-4o Mini",
        capabilities: ["text", "code", "function_calling", "fast_inference"],
        maxContextTokens: 128000, maxOutputTokens: 4096,
        supportsStreaming: true, supportsVision: false, supportsFunctionCalling: true,
        averageLatencyMs: 800, p95LatencyMs: 1500, throughputTokensPerSecond: 200,
        costPerInputTokenUSD: 0.00000015, costPerOutputTokenUSD: 0.0000006,
        isActive: true, isAvailable: true, rateLimitPerMinute: 1000, currentLoad: 0.3,
        version: "2024-07-18", releasedAt: new Date("2024-07-18"), metadata: {},
      },
      {
        provider: "anthropic", modelName: "claude-3-5-sonnet-20241022", displayName: "Claude 3.5 Sonnet",
        capabilities: ["text", "vision", "code", "reasoning", "function_calling", "long_context"],
        maxContextTokens: 200000, maxOutputTokens: 8192,
        supportsStreaming: true, supportsVision: true, supportsFunctionCalling: true,
        averageLatencyMs: 2500, p95LatencyMs: 5000, throughputTokensPerSecond: 80,
        costPerInputTokenUSD: 0.000003, costPerOutputTokenUSD: 0.000015,
        isActive: true, isAvailable: true, rateLimitPerMinute: 400, currentLoad: 0.6,
        version: "2024-10-22", releasedAt: new Date("2024-10-22"), metadata: {},
      },
      {
        provider: "google", modelName: "gemini-1.5-pro", displayName: "Gemini 1.5 Pro",
        capabilities: ["text", "vision", "code", "reasoning", "long_context"],
        maxContextTokens: 2000000, maxOutputTokens: 8192,
        supportsStreaming: true, supportsVision: true, supportsFunctionCalling: true,
        averageLatencyMs: 3000, p95LatencyMs: 6000, throughputTokensPerSecond: 60,
        costPerInputTokenUSD: 0.00000125, costPerOutputTokenUSD: 0.000005,
        isActive: true, isAvailable: true, rateLimitPerMinute: 300, currentLoad: 0.4,
        version: "1.5", releasedAt: new Date("2024-02-15"), metadata: {},
      },
    ];
    for (const m of defaults) {
      const { data } = await supabaseAdmin
        .from("ai_models").select("id")
        .eq("provider", m.provider).eq("model_name", m.modelName).maybeSingle();
      if (!data) await this.registerModel(m);
    }
  }
}