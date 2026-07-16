// src/backend/workers/Autoscaler.ts
import { QueueManager } from "./QueueManager";

export class Autoscaler {
  private static checkInterval: ReturnType<typeof setInterval> | null = null;
  private static scaleUpThreshold = 100;
  private static scaleDownThreshold = 10;

  static start(intervalMs: number = 30000) {
    console.log("[Autoscaler] Starting autoscaler monitoring");
    this.checkInterval = setInterval(() => {
      void this.checkAndScale();
    }, intervalMs);
  }

  private static async checkAndScale() {
    try {
      const metrics = await QueueManager.getQueueMetrics();
      for (const [jobType, stats] of Object.entries(metrics)) {
        const queueDepth = stats.waiting;
        if (queueDepth > this.scaleUpThreshold) {
          console.warn(
            `[Autoscaler] Queue ${jobType} depth (${queueDepth}) exceeds threshold. Recommend scaling UP.`,
          );
        } else if (queueDepth < this.scaleDownThreshold && queueDepth > 0) {
          console.log(
            `[Autoscaler] Queue ${jobType} depth (${queueDepth}) is low. Can scale DOWN.`,
          );
        }
      }
    } catch (error) {
      console.error("[Autoscaler] Error checking metrics:", error);
    }
  }

  static stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log("[Autoscaler] Autoscaler stopped");
    }
  }
}