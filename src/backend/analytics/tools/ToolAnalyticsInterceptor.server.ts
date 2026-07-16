import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ToolExecutionEvent } from "./ToolAnalyticsTypes";

/**
 * Stateless interceptor for the Cloudflare Worker runtime.
 * No in-memory buffering / setInterval (workers are ephemeral); events are
 * written immediately. RPM is derived from DB counts.
 */
export class ToolAnalyticsInterceptor {
  static async recordExecution(
    event: Omit<ToolExecutionEvent, "id" | "timestamp">,
  ): Promise<void> {
    const row = {
      id: `evt_${crypto.randomUUID()}`,
      tool_name: event.toolName,
      agent_id: event.agentId,
      department: event.department,
      latency_ms: event.latencyMs,
      success: event.success,
      error_code: event.errorCode ?? null,
      cost_usd: event.costUSD,
      tokens_used: event.tokensUsed ?? 0,
      payload_size_bytes: event.payloadSizeBytes,
      timestamp: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin
      .from("tool_execution_events")
      .insert(row);
    if (error) {
      console.error("[ToolAnalytics] insert failed:", error.message);
    }
  }

  static async recordBatch(
    events: Array<Omit<ToolExecutionEvent, "id" | "timestamp">>,
  ): Promise<void> {
    if (events.length === 0) return;
    const rows = events.map((e) => ({
      id: `evt_${crypto.randomUUID()}`,
      tool_name: e.toolName,
      agent_id: e.agentId,
      department: e.department,
      latency_ms: e.latencyMs,
      success: e.success,
      error_code: e.errorCode ?? null,
      cost_usd: e.costUSD,
      tokens_used: e.tokensUsed ?? 0,
      payload_size_bytes: e.payloadSizeBytes,
      timestamp: new Date().toISOString(),
    }));
    const { error } = await supabaseAdmin
      .from("tool_execution_events")
      .insert(rows);
    if (error) console.error("[ToolAnalytics] batch insert failed:", error.message);
  }

  /**
   * Real-time RPM computed from the last 60 seconds of events.
   */
  static async getCurrentRPM(toolName: string): Promise<number> {
    const oneMinAgo = new Date(Date.now() - 60_000).toISOString();
    const { count, error } = await supabaseAdmin
      .from("tool_execution_events")
      .select("id", { count: "exact", head: true })
      .eq("tool_name", toolName)
      .gte("timestamp", oneMinAgo);
    if (error) {
      console.error("[ToolAnalytics] rpm query failed:", error.message);
      return 0;
    }
    return count ?? 0;
  }
}