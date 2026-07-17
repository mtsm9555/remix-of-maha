import type { AIModel, ModelFallbackEvent } from "./ModelRouterTypes";

interface Breaker { failures: number; lastFailure: number; state: "closed" | "open" | "half_open"; }

export class ModelFallbackHandler {
  private static breakers: Map<string, Breaker> = new Map();
  private static readonly RECOVERY_MS = 60_000;
  private static readonly FAILURE_THRESHOLD = 5;

  static async executeWithFallback<T>(
    primary: AIModel,
    fallbacks: AIModel[],
    executor: (model: AIModel) => Promise<T>,
    requestId: string,
  ): Promise<{ result: T; model: AIModel; fallbackUsed: boolean }> {
    try {
      if (this.isOpen(primary.id)) throw new Error("Circuit breaker open");
      const result = await executor(primary);
      this.recordSuccess(primary.id);
      return { result, model: primary, fallbackUsed: false };
    } catch (err: any) {
      this.recordFailure(primary.id);
      const primaryErr = err?.message ?? String(err);
      for (const fb of fallbacks) {
        try {
          if (this.isOpen(fb.id)) continue;
          const result = await executor(fb);
          this.recordSuccess(fb.id);
          await this.logFallbackEvent(requestId, primary.id, fb.id, primaryErr, true);
          return { result, model: fb, fallbackUsed: true };
        } catch (fbErr: any) {
          this.recordFailure(fb.id);
          await this.logFallbackEvent(requestId, primary.id, fb.id, fbErr?.message ?? String(fbErr), false);
        }
      }
      throw new Error("All models failed");
    }
  }

  private static isOpen(modelId: string): boolean {
    const b = this.breakers.get(modelId);
    if (!b) return false;
    if (b.state === "open") {
      if (Date.now() - b.lastFailure < this.RECOVERY_MS) return true;
      b.state = "half_open";
    }
    return false;
  }

  private static recordSuccess(modelId: string): void {
    const b = this.breakers.get(modelId);
    if (b) { b.failures = 0; b.state = "closed"; }
  }

  private static recordFailure(modelId: string): void {
    let b = this.breakers.get(modelId);
    if (!b) { b = { failures: 0, lastFailure: Date.now(), state: "closed" }; this.breakers.set(modelId, b); }
    b.failures++;
    b.lastFailure = Date.now();
    if (b.failures >= this.FAILURE_THRESHOLD) b.state = "open";
  }

  private static async logFallbackEvent(
    requestId: string, originalModelId: string, fallbackModelId: string, reason: string, success: boolean,
  ): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date();
    const event: ModelFallbackEvent = {
      id: `fallback_${crypto.randomUUID()}`,
      requestId, originalModelId, fallbackModelId, reason,
      triggeredAt: now, resolvedAt: success ? now : undefined, success,
    };
    await supabaseAdmin.from("model_fallback_events").insert({
      id: event.id,
      request_id: requestId,
      original_model_id: originalModelId,
      fallback_model_id: fallbackModelId,
      reason,
      triggered_at: event.triggeredAt.toISOString(),
      resolved_at: event.resolvedAt?.toISOString() ?? null,
      success,
    });
  }

  static async getFallbackStats(days = 7) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
    const { data: events } = await supabaseAdmin
      .from("model_fallback_events")
      .select("reason, success")
      .gte("triggered_at", cutoff);
    const total = events?.length ?? 0;
    const successful = events?.filter((e: any) => e.success).length ?? 0;
    const counts: Record<string, number> = {};
    for (const e of events ?? []) counts[e.reason] = (counts[e.reason] ?? 0) + 1;
    const topFallbackReasons = Object.entries(counts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count).slice(0, 5);
    return { totalFallbacks: total, successfulFallbacks: successful, failedFallbacks: total - successful, topFallbackReasons };
  }

  static resetCircuitBreaker(modelId: string): void {
    this.breakers.delete(modelId);
  }
}