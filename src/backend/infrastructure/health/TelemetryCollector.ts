import type { HealthTelemetry } from "./HealthTypes";

/**
 * Stateless telemetry ingestion. The original design ran a `setInterval`
 * loop on a persistent Node process; on the stateless Worker runtime we
 * instead expose `recordSample()` which agents (or a cron endpoint) call
 * with a freshly measured snapshot.
 */
export class TelemetryCollector {
  static async recordSample(
    telemetry: Omit<HealthTelemetry, "timestamp"> & { timestamp?: Date },
  ): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ts = telemetry.timestamp ?? new Date();
    await supabaseAdmin.from("agent_health_metrics").insert({
      instance_id: telemetry.instanceId,
      cpu_usage: telemetry.cpuUsagePercent,
      memory_usage_mb: telemetry.memoryUsageMB,
      llm_latency_ms: telemetry.llmAverageLatencyMs,
      llm_error_rate: telemetry.llmErrorRate,
      success_rate: telemetry.successRate,
      recorded_at: ts.toISOString(),
    });
  }

  /** Fetch the most recent stored sample for aggregation. */
  static async getLatest(instanceId: string): Promise<HealthTelemetry | null> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("agent_health_metrics")
      .select("*")
      .eq("instance_id", instanceId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    return {
      instanceId,
      timestamp: new Date(data.recorded_at),
      cpuUsagePercent: data.cpu_usage,
      memoryUsageMB: data.memory_usage_mb,
      memoryLimitMB: 1024,
      llmAverageLatencyMs: data.llm_latency_ms,
      llmErrorRate: data.llm_error_rate,
      tokenBurnRatePerMin: 0,
      activeTaskCount: 0,
      queueDepth: 0,
      successRate: data.success_rate,
      budgetSpendRatePerHour: 0,
    };
  }
}