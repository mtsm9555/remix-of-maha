import type { HealthTelemetry, HealthScore, HealthAnomaly } from "./HealthTypes";
import { TelemetryCollector } from "./TelemetryCollector";
import { AgentLifecycleManager } from "../lifecycle/AgentLifecycleManager";

export class HealthAggregator {
  static async evaluateInstanceHealth(
    instanceId: string,
  ): Promise<{ score: HealthScore; anomalies: HealthAnomaly[] }> {
    const telemetry = await TelemetryCollector.getLatest(instanceId);
    if (!telemetry) {
      return {
        score: {
          instanceId,
          overallScore: 0,
          systemScore: 0,
          cognitiveScore: 0,
          status: "offline",
          calculatedAt: new Date(),
        },
        anomalies: [],
      };
    }

    const systemScore = this.calculateSystemScore(telemetry);
    const cognitiveScore = this.calculateCognitiveScore(telemetry);
    const overallScore = systemScore * 0.4 + cognitiveScore * 0.6;

    let status: HealthScore["status"] = "healthy";
    if (overallScore < 50) status = "critical";
    else if (overallScore < 80) status = "degraded";

    const anomalies = await this.detectAnomalies(instanceId, telemetry);

    const score: HealthScore = {
      instanceId,
      overallScore,
      systemScore,
      cognitiveScore,
      status,
      calculatedAt: new Date(),
    };

    await this.enforceHealthActions(instanceId, score, anomalies);
    return { score, anomalies };
  }

  private static calculateSystemScore(t: HealthTelemetry): number {
    let score = 100;
    if (t.cpuUsagePercent > 90) score -= 40;
    else if (t.cpuUsagePercent > 75) score -= 20;
    const memPercent = (t.memoryUsageMB / t.memoryLimitMB) * 100;
    if (memPercent > 90) score -= 40;
    else if (memPercent > 75) score -= 20;
    return Math.max(0, score);
  }

  private static calculateCognitiveScore(t: HealthTelemetry): number {
    let score = 100;
    if (t.llmErrorRate > 0.1) score -= 50;
    else if (t.llmErrorRate > 0.05) score -= 20;
    if (t.successRate < 0.7) score -= 40;
    else if (t.successRate < 0.85) score -= 20;
    if (t.llmAverageLatencyMs > 5000) score -= 30;
    else if (t.llmAverageLatencyMs > 2000) score -= 10;
    return Math.max(0, score);
  }

  private static async detectAnomalies(
    instanceId: string,
    current: HealthTelemetry,
  ): Promise<HealthAnomaly[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const anomalies: HealthAnomaly[] = [];

    const { data: history } = await supabaseAdmin
      .from("agent_health_metrics")
      .select("llm_latency_ms, llm_error_rate")
      .eq("instance_id", instanceId)
      .gte("recorded_at", new Date(Date.now() - 3600000).toISOString());

    if (!history || history.length < 5) return anomalies;

    const avgLatency =
      history.reduce((s, h) => s + (h.llm_latency_ms || 0), 0) / history.length;
    const avgErrorRate =
      history.reduce((s, h) => s + (h.llm_error_rate || 0), 0) / history.length;

    if (current.llmAverageLatencyMs > avgLatency * 2.5 && current.llmAverageLatencyMs > 1000) {
      anomalies.push({
        id: `anom_${crypto.randomUUID()}`,
        instanceId,
        metricName: "llm_latency_ms",
        currentValue: current.llmAverageLatencyMs,
        expectedBaseline: avgLatency,
        severity: current.llmAverageLatencyMs > avgLatency * 4 ? "critical" : "warning",
        description: `Latency spike: ${current.llmAverageLatencyMs.toFixed(0)}ms (baseline ${avgLatency.toFixed(0)}ms)`,
        detectedAt: new Date(),
      });
    }

    if (current.llmErrorRate > avgErrorRate + 0.15 && current.llmErrorRate > 0.05) {
      anomalies.push({
        id: `anom_${crypto.randomUUID()}`,
        instanceId,
        metricName: "llm_error_rate",
        currentValue: current.llmErrorRate,
        expectedBaseline: avgErrorRate,
        severity: "critical",
        description: `Error rate spike: ${(current.llmErrorRate * 100).toFixed(1)}% (baseline ${(avgErrorRate * 100).toFixed(1)}%)`,
        detectedAt: new Date(),
      });
    }

    return anomalies;
  }

  private static async enforceHealthActions(
    instanceId: string,
    score: HealthScore,
    anomalies: HealthAnomaly[],
  ): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (score.status !== "healthy") {
      const registryStatus =
        score.status === "critical" ? "unreachable" : score.status;
      await supabaseAdmin
        .from("agent_registry_persistent")
        .update({ status: registryStatus, updated_at: new Date().toISOString() })
        .eq("instance_id", instanceId);
    }

    if (anomalies.length > 0) {
      await supabaseAdmin.from("health_anomalies").insert(
        anomalies.map((a) => ({
          id: a.id,
          instance_id: a.instanceId,
          metric_name: a.metricName,
          current_value: a.currentValue,
          expected_baseline: a.expectedBaseline,
          severity: a.severity,
          description: a.description,
          detected_at: a.detectedAt.toISOString(),
        })),
      );
    }

    const critical = anomalies.filter((a) => a.severity === "critical");
    if (critical.length >= 2 || score.overallScore < 30) {
      console.error(`[HealthAggregator] Critical health — restarting ${instanceId}`);
      await AgentLifecycleManager.drainAndDestroy(
        instanceId,
        "Auto-remediation: Critical health failure",
      );
    }
  }
}