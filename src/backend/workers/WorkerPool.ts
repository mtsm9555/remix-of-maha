// src/backend/workers/WorkerPool.ts
// NOTE: Node.js-only. Run in a separate `bun run` process.
import { Worker, Job } from "bullmq";
import { RedisManager } from "./RedisManager";
import { JobType, JobResult } from "./types";
import { globalToolRouter } from "../tools/ToolRouter";
import { WorkflowEngine } from "../workflows/WorkflowEngine";
import { MemoryConsolidationWorker } from "../memory/MemoryConsolidationWorker";

export class WorkerPool {
  private static workers: Map<JobType, Worker> = new Map();
  private static concurrency: number = parseInt(process.env.WORKER_CONCURRENCY || "5");

  static startAllWorkers() {
    console.log(`[WorkerPool] Starting workers with concurrency: ${this.concurrency}`);
    this.startWorker("tool_execution", (job) => this.handleToolExecution(job));
    this.startWorker("memory_consolidation", (job) => this.handleMemoryConsolidation(job));
    this.startWorker("workflow_execution", (job) => this.handleWorkflowExecution(job));
    this.startWorker("agent_task", (job) => this.handleAgentTask(job));
    this.startWorker("llm_inference", (job) => this.handleLLMInference(job));
  }

  private static startWorker<T>(jobType: JobType, processor: (job: Job<T>) => Promise<any>) {
    const worker = new Worker(jobType, processor, {
      connection: RedisManager.getConnection(),
      concurrency: this.concurrency,
      limiter: { max: 100, duration: 1000 },
    });

    worker.on("completed", (job) => {
      console.log(`[WorkerPool] Job ${job.id} completed successfully`);
    });
    worker.on("failed", (job, err) => {
      console.error(`[WorkerPool] Job ${job?.id} failed:`, err.message);
    });
    worker.on("error", (err) => {
      console.error(`[WorkerPool] Worker error for ${jobType}:`, err);
    });

    this.workers.set(jobType, worker);
    console.log(`[WorkerPool] Started worker for ${jobType}`);
  }

  private static async handleToolExecution(job: Job): Promise<JobResult> {
    const startTime = Date.now();
    try {
      const { toolName, args, context, authContext } = job.data;
      const result = await globalToolRouter.route(toolName, args, context, authContext);
      return {
        success: result.success,
        data: result.data,
        error: result.error,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return { success: false, error: error.message, executionTimeMs: Date.now() - startTime };
    }
  }

  private static async handleMemoryConsolidation(_job: Job): Promise<JobResult> {
    const startTime = Date.now();
    try {
      await (MemoryConsolidationWorker as any).runConsolidationCycle?.();
      return { success: true, executionTimeMs: Date.now() - startTime };
    } catch (error: any) {
      return { success: false, error: error.message, executionTimeMs: Date.now() - startTime };
    }
  }

  private static async handleWorkflowExecution(job: Job): Promise<JobResult> {
    const startTime = Date.now();
    try {
      const { workflowId, userId, input } = job.data;
      const result = await (WorkflowEngine as any).trigger(workflowId, userId, input);
      return { success: true, data: result, executionTimeMs: Date.now() - startTime };
    } catch (error: any) {
      return { success: false, error: error.message, executionTimeMs: Date.now() - startTime };
    }
  }

  private static async handleAgentTask(job: Job): Promise<JobResult> {
    const startTime = Date.now();
    console.log(`[WorkerPool] Handling agent task:`, job.data);
    return {
      success: true,
      data: { message: "Agent task completed" },
      executionTimeMs: Date.now() - startTime,
    };
  }

  private static async handleLLMInference(_job: Job): Promise<JobResult> {
    const startTime = Date.now();
    return {
      success: true,
      data: { response: "Mock LLM response" },
      executionTimeMs: Date.now() - startTime,
    };
  }

  static async shutdown() {
    console.log("[WorkerPool] Shutting down workers...");
    for (const worker of this.workers.values()) await worker.close();
    this.workers.clear();
    console.log("[WorkerPool] All workers shutdown complete");
  }
}