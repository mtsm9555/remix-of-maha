import type { QueueJob, JobResult } from "./JobTypes";

type Handler = (job: QueueJob) => Promise<any>;

export interface QueueLike {
  name: string;
  add(type: string, payload: any, opts?: { attempts?: number; priority?: number }): Promise<QueueJob>;
  process(handler: Handler): void;
  on(event: "completed" | "failed", listener: (result: JobResult) => void): void;
}

export class InMemoryQueue implements QueueLike {
  private handler?: Handler;
  private listeners: Record<string, Array<(r: JobResult) => void>> = {
    completed: [],
    failed: [],
  };

  constructor(public name: string) {}

  async add(type: string, payload: any, opts: { attempts?: number; priority?: number } = {}) {
    const job: QueueJob = {
      id: crypto.randomUUID(),
      type,
      payload,
      priority: opts.priority ?? 0,
      attempts: opts.attempts ?? 3,
    };
    queueMicrotask(() => this.run(job));
    return job;
  }

  process(handler: Handler) {
    this.handler = handler;
  }

  on(event: "completed" | "failed", listener: (r: JobResult) => void) {
    this.listeners[event].push(listener);
  }

  private async run(job: QueueJob) {
    if (!this.handler) return;
    const start = Date.now();
    let attempts = job.attempts ?? 1;
    let lastError: unknown;
    while (attempts-- > 0) {
      try {
        const data = await this.handler(job);
        const result: JobResult = {
          jobId: job.id,
          success: true,
          data,
          durationMs: Date.now() - start,
        };
        this.listeners.completed.forEach((l) => l(result));
        return;
      } catch (err) {
        lastError = err;
      }
    }
    const failed: JobResult = {
      jobId: job.id,
      success: false,
      error: (lastError as Error)?.message ?? String(lastError),
      durationMs: Date.now() - start,
    };
    this.listeners.failed.forEach((l) => l(failed));
  }
}