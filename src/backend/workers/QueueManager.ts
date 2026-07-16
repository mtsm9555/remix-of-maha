// src/backend/workers/QueueManager.ts
// NOTE: Node.js-only. Do not import from client or SSR code.
import { Queue, QueueEvents } from "bullmq";
import { getRedisOptions } from "./RedisManager";
import { JobType, WorkerJob } from "./types";

export class QueueManager {
  private static queues: Map<JobType, Queue> = new Map();
  private static queueEvents: Map<JobType, QueueEvents> = new Map();

  static getQueue(jobType: JobType): Queue {
    if (!this.queues.has(jobType)) {
      const queue = new Queue(jobType, {
        connection: getRedisOptions(),
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
        },
      });
      this.queues.set(jobType, queue);

      const queueEvents = new QueueEvents(jobType, {
        connection: getRedisOptions(),
      });
      queueEvents.on("completed", ({ jobId }) => {
        console.log(`[QueueManager] Job ${jobId} completed in ${jobType} queue`);
      });
      queueEvents.on("failed", ({ jobId, failedReason }) => {
        console.error(`[QueueManager] Job ${jobId} failed in ${jobType} queue:`, failedReason);
      });
      this.queueEvents.set(jobType, queueEvents);
    }
    return this.queues.get(jobType)!;
  }

  static async addJob<T>(job: WorkerJob<T>): Promise<string> {
    const queue = this.getQueue(job.type);
    const priorityMap = { low: 3, normal: 2, high: 1, critical: 0 } as const;

    const addedJob = await queue.add(job.type, job.payload, {
      jobId: job.id,
      priority: priorityMap[job.priority],
      attempts: job.maxAttempts,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });

    console.log(
      `[QueueManager] Added job ${job.id} to ${job.type} queue with priority ${job.priority}`,
    );
    return addedJob.id!;
  }

  static async getQueueMetrics(): Promise<
    Record<string, { waiting: number; active: number; completed: number; failed: number }>
  > {
    const metrics: Record<string, { waiting: number; active: number; completed: number; failed: number }> = {};
    for (const [jobType, queue] of this.queues.entries()) {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ]);
      metrics[jobType] = { waiting, active, completed, failed };
    }
    return metrics;
  }

  static async closeAll() {
    for (const queue of this.queues.values()) await queue.close();
    for (const events of this.queueEvents.values()) await events.close();
    this.queues.clear();
    this.queueEvents.clear();
  }
}