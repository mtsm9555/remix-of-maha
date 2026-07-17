import type { QueueHealthStatus } from "./QueueOrchestrationTypes";
import { MultiQueueManager } from "./MultiQueueManager.server";

export class QueueHealthMonitor {
  static async checkQueueHealth(queueId: string): Promise<QueueHealthStatus> {
    const queue = await MultiQueueManager.getQueue(queueId);
    if (!queue) {
      return {
        queueId,
        status: "offline",
        depthHealth: "critical",
        processingHealth: "stalled",
        failureHealth: "critical",
        currentDepth: 0,
        processingRate: 0,
        failureRate: 0,
        averageProcessingTimeMs: 0,
        alerts: ["Queue not found"],
        timestamp: new Date(),
      };
    }
    await MultiQueueManager.updateQueueMetrics(queueId);
    const fresh = (await MultiQueueManager.getQueue(queueId))!;
    const depthHealth: QueueHealthStatus["depthHealth"] =
      fresh.currentDepth > 1000 ? "critical" : fresh.currentDepth > 200 ? "high" : "normal";
    const processingHealth: QueueHealthStatus["processingHealth"] =
      fresh.processingRate === 0 && fresh.currentDepth > 0 ? "stalled" : fresh.processingRate < 1 ? "slow" : "normal";
    const failureHealth: QueueHealthStatus["failureHealth"] =
      fresh.failureRate > 0.5 ? "critical" : fresh.failureRate > 0.2 ? "elevated" : "normal";
    const alerts: string[] = [];
    if (depthHealth !== "normal") alerts.push(`Queue depth ${fresh.currentDepth}`);
    if (processingHealth === "stalled") alerts.push("Processing stalled");
    if (failureHealth !== "normal") alerts.push(`Failure rate ${(fresh.failureRate * 100).toFixed(1)}%`);
    const status: QueueHealthStatus["status"] =
      failureHealth === "critical" || processingHealth === "stalled"
        ? "critical"
        : depthHealth === "high" || failureHealth === "elevated"
          ? "degraded"
          : "healthy";
    return {
      queueId,
      status,
      depthHealth,
      processingHealth,
      failureHealth,
      currentDepth: fresh.currentDepth,
      processingRate: fresh.processingRate,
      failureRate: fresh.failureRate,
      averageProcessingTimeMs: 0,
      alerts,
      timestamp: new Date(),
    };
  }

  static async snapshotAllQueues(): Promise<QueueHealthStatus[]> {
    const queues = await MultiQueueManager.getQueues();
    const results: QueueHealthStatus[] = [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const q of queues) {
      const h = await this.checkQueueHealth(q.id);
      results.push(h);
      await supabaseAdmin.from("queue_metrics").insert({
        id: `metric_${crypto.randomUUID()}`,
        queue_id: q.id,
        pending_tasks: h.currentDepth,
        tasks_per_minute: h.processingRate,
        success_rate: 1 - h.failureRate,
        failure_rate: h.failureRate,
      });
    }
    return results;
  }
}