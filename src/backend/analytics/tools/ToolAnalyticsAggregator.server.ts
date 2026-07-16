import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ToolMetricRollup } from "./ToolAnalyticsTypes";

interface RawEvent {
  tool_name: string;
  latency_ms: number;
  success: boolean;
  error_code: string | null;
  cost_usd: number;
  tokens_used: number | null;
}

export class ToolAnalyticsAggregator {
  /**
   * Aggregates the last hour of raw events into per-tool rollups.
   * Triggered by /api/public/analytics/tools/rollup (cron-callable).
   */
  static async generateHourlyRollups(): Promise<{ rollups: number }> {
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 3_600_000);

    const { data: events, error } = await supabaseAdmin
      .from("tool_execution_events")
      .select("tool_name, latency_ms, success, error_code, cost_usd, tokens_used")
      .gte("timestamp", periodStart.toISOString());

    if (error || !events) {
      console.error("[ToolAnalytics] rollup fetch failed:", error);
      return { rollups: 0 };
    }

    const grouped: Record<string, RawEvent[]> = {};
    for (const e of events as RawEvent[]) {
      (grouped[e.tool_name] ||= []).push(e);
    }

    const rollups: ToolMetricRollup[] = [];
    for (const [toolName, toolEvents] of Object.entries(grouped)) {
      const latencies = toolEvents.map((e) => e.latency_ms).sort((a, b) => a - b);
      const total = toolEvents.length;
      const successful = toolEvents.filter((e) => e.success).length;
      const errorCounts: Record<string, number> = {};
      for (const e of toolEvents) {
        if (e.error_code) errorCounts[e.error_code] = (errorCounts[e.error_code] || 0) + 1;
      }
      rollups.push({
        toolName,
        periodStart,
        periodEnd,
        totalExecutions: total,
        successRate: total > 0 ? successful / total : 0,
        averageLatencyMs: latencies.reduce((a, b) => a + b, 0) / total,
        p95LatencyMs: this.getPercentile(latencies, 0.95),
        p99LatencyMs: this.getPercentile(latencies, 0.99),
        totalCostUSD: toolEvents.reduce((s, e) => s + (e.cost_usd || 0), 0),
        totalTokensUsed: toolEvents.reduce((s, e) => s + (e.tokens_used || 0), 0),
        errorCounts,
      });
    }

    if (rollups.length > 0) {
      const { error: upsertErr } = await supabaseAdmin
        .from("tool_metric_rollups")
        .upsert(
          rollups.map((r) => ({
            tool_name: r.toolName,
            period_start: r.periodStart.toISOString(),
            period_end: r.periodEnd.toISOString(),
            total_executions: r.totalExecutions,
            success_rate: r.successRate,
            avg_latency_ms: r.averageLatencyMs,
            p95_latency_ms: r.p95LatencyMs,
            p99_latency_ms: r.p99LatencyMs,
            total_cost_usd: r.totalCostUSD,
            total_tokens_used: r.totalTokensUsed,
            error_counts: r.errorCounts,
          })),
          { onConflict: "tool_name,period_start" },
        );
      if (upsertErr) console.error("[ToolAnalytics] upsert failed:", upsertErr);
    }

    return { rollups: rollups.length };
  }

  private static getPercentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.ceil(p * sorted.length) - 1;
    return sorted[Math.max(0, idx)] || 0;
  }
}