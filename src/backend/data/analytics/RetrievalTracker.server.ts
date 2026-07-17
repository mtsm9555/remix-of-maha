import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { MemorySource, RetrievalEvent } from "./RetrievalAnalyticsTypes";

/**
 * Cloudflare Workers are stateless per-request, so we don't buffer events
 * in a module-level array. Each retrieval writes directly (fire-and-forget).
 */
export class RetrievalTracker {
  static async recordRetrieval(input: {
    source: MemorySource;
    queryText: string;
    results: Array<{ id: string; content?: string }>;
    latencyMs: number;
    embeddingDimension: number;
  }): Promise<RetrievalEvent> {
    const tokensConsumed = input.results.reduce(
      (sum, r) => sum + Math.ceil((r.content?.length ?? 0) / 4),
      0,
    );
    const estimatedCostUSD = tokensConsumed * 0.00001;

    const event: RetrievalEvent = {
      id: `ret_${crypto.randomUUID()}`,
      timestamp: new Date(),
      source: input.source,
      queryText: input.queryText.substring(0, 200),
      queryEmbeddingDimension: input.embeddingDimension,
      latencyMs: input.latencyMs,
      resultsReturned: input.results.length,
      tokensConsumed,
      estimatedCostUSD,
      avgRelevanceScore: 0,
      memoryIdsFetched: input.results.map((r) => r.id),
    };

    const { error } = await supabaseAdmin.from("retrieval_events" as any).insert({
      id: event.id,
      source: event.source,
      query_text: event.queryText,
      latency_ms: event.latencyMs,
      results_returned: event.resultsReturned,
      tokens_consumed: event.tokensConsumed,
      estimated_cost_usd: event.estimatedCostUSD,
      memory_ids_fetched: event.memoryIdsFetched,
      timestamp: event.timestamp.toISOString(),
    });
    if (error) console.error("[RetrievalTracker] insert failed:", error);
    return event;
  }

  static async updateRelevance(eventId: string, relevanceScore: number) {
    const clamped = Math.max(0, Math.min(1, relevanceScore));
    const { error } = await supabaseAdmin
      .from("retrieval_events" as any)
      .update({ avg_relevance_score: clamped })
      .eq("id", eventId);
    if (error) console.error("[RetrievalTracker] updateRelevance failed:", error);
  }
}