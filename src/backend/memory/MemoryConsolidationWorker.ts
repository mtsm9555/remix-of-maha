import { MemoryProcessor } from "./MemoryProcessor";
import type { RawMemoryLog } from "./types";

export class MemoryConsolidationWorker {
  /**
   * Triggered by a cron job or message queue.
   * Requires tables `agent_messages` and `consolidated_memories` in the DB.
   */
  static async runConsolidationCycle(limit: number = 50) {
    console.log(
      `[MemoryWorker] Starting consolidation cycle. Fetching up to ${limit} unprocessed sessions.`,
    );

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: sessions, error } = await supabaseAdmin
      .from("agent_messages" as any)
      .select("session_id, user_id, content, created_at, id")
      .eq("is_consolidated", false)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error || !sessions || sessions.length === 0) {
      console.log("[MemoryWorker] No unprocessed logs found.");
      return;
    }

    const sessionGroups = new Map<string, RawMemoryLog[]>();
    for (const row of sessions as any[]) {
      const logs = sessionGroups.get(row.session_id) || [];
      logs.push({
        id: row.id,
        sessionId: row.session_id,
        userId: row.user_id,
        content: row.content,
        timestamp: new Date(row.created_at),
        isConsolidated: false,
      });
      sessionGroups.set(row.session_id, logs);
    }

    for (const [sessionId, logs] of sessionGroups.entries()) {
      await this.processSession(sessionId, logs);
    }

    console.log("[MemoryWorker] Consolidation cycle complete.");
  }

  private static async processSession(sessionId: string, logs: RawMemoryLog[]) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const consolidated = await MemoryProcessor.processLogs(logs);
      if (!consolidated) return;

      const { error: memError } = await supabaseAdmin.from("consolidated_memories" as any).insert({
        id: consolidated.id,
        user_id: consolidated.userId,
        summary: consolidated.summary,
        entities: consolidated.entities,
        relationships: consolidated.relationships,
        importance_score: consolidated.importanceScore,
        created_at: consolidated.createdAt.toISOString(),
      });

      if (memError) throw memError;

      const ids = logs.map((l) => l.id);
      await supabaseAdmin
        .from("agent_messages" as any)
        .update({ is_consolidated: true })
        .in("id", ids);

      console.log(`[MemoryWorker] Consolidated session ${sessionId} (${logs.length} logs).`);
    } catch (err) {
      console.error(`[MemoryWorker] Failed to consolidate session ${sessionId}:`, err);
    }
  }
}