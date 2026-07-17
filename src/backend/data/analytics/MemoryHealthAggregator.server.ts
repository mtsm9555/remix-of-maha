import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type {
  MemoryHealthScore,
  MemoryHealthStatus,
  MemorySource,
} from "./RetrievalAnalyticsTypes";

const TABLE_BY_SOURCE: Record<MemorySource, string> = {
  project: "project_memories",
  department: "department_memories",
  user: "user_memories",
  shared: "shared_memories",
};

export class MemoryHealthAggregator {
  /** Aggregates recent retrieval stats; tags each memory with health status; archives dead memories. */
  static async runDailyHealthCheck(): Promise<{ processed: number; pruned: number }> {
    const { data, error } = await supabaseAdmin.rpc(
      "calculate_memory_health_stats" as any,
    );
    if (error || !data) {
      if (error) console.error("[MemoryHealth] stats query failed:", error);
      return { processed: 0, pruned: 0 };
    }

    let processed = 0;
    let pruned = 0;
    for (const stat of data as any[]) {
      const score = this.determineHealthStatus(stat);
      await this.updateMemoryHealth(score);
      processed++;
      if (score.healthStatus === "dead" && score.totalRetrievals > 20) {
        await this.archiveMemory(score);
        pruned++;
      }
    }
    return { processed, pruned };
  }

  private static determineHealthStatus(stat: any): MemoryHealthScore {
    const avg = Number(stat.avg_relevance ?? 0);
    const total = Number(stat.total_retrievals ?? 0);
    let status: MemoryHealthStatus = "active";
    if (avg < 0.2 && total > 10) status = "dead";
    else if (avg < 0.4) status = "stale";
    else if (avg > 0.8 && total > 50) status = "high_value";
    return {
      memoryId: stat.memory_id,
      source: stat.source as MemorySource,
      totalRetrievals: total,
      avgRelevanceScore: avg,
      lastRetrievedAt: new Date(stat.last_retrieved),
      healthStatus: status,
    };
  }

  private static async updateMemoryHealth(score: MemoryHealthScore) {
    const table = TABLE_BY_SOURCE[score.source];
    if (!table) return;
    const { data: row } = await supabaseAdmin
      .from(table as any)
      .select("metadata")
      .eq("id", score.memoryId)
      .maybeSingle();
    const currentMetadata = ((row as any)?.metadata ?? {}) as Record<string, unknown>;
    await supabaseAdmin
      .from(table as any)
      .update({
        metadata: {
          ...currentMetadata,
          healthStatus: score.healthStatus,
          avgRelevance: score.avgRelevanceScore,
        } as any,
      })
      .eq("id", score.memoryId);
  }

  private static async archiveMemory(score: MemoryHealthScore) {
    const table = TABLE_BY_SOURCE[score.source];
    if (!table) return;
    const { data: row } = await supabaseAdmin
      .from(table as any)
      .select("metadata")
      .eq("id", score.memoryId)
      .maybeSingle();
    const currentMetadata = ((row as any)?.metadata ?? {}) as Record<string, unknown>;
    await supabaseAdmin
      .from(table as any)
      .update({
        metadata: { ...currentMetadata, archived: true } as any,
      })
      .eq("id", score.memoryId);
  }
}