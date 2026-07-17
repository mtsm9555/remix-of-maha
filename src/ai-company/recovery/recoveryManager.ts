// src/recovery/recoveryManager.ts

import { AgentRegistry } from "../agents/agentRegistry";
import { TaskStateManager } from "../lifecycle/taskStateManager";
import { MemoryStore } from "../memory/memoryStore";
import { RecoveryQueue } from "./recoveryQueue";

export class RecoveryManager {
  constructor(
    private agentRegistry: AgentRegistry,
    private taskManager: TaskStateManager,
    private memoryStore: MemoryStore,
    private recoveryQueue: RecoveryQueue
  ) {}

  reportFailure(
    targetType: "agent" | "task" | "system",
    targetId: string,
    failureType: string,
    reason: string
  ): string {
    const jobId = `recovery-${Date.now()}`;

    this.recoveryQueue.createJob(
      jobId,
      targetType,
      targetId,
      failureType as any,
      reason
    );

    this.memoryStore.addMemory(
      `memory-${Date.now()}`,
      "system",
      "note",
      `Failure reported on ${targetType}:${targetId} -> ${reason}`,
      ["failure", "recovery"]
    );

    return `Recovery job created for ${targetType} ${targetId}`;
  }

  recoverAgent(agentId: string): string {
    const agent = this.agentRegistry.getAgent(agentId);

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (agent.status === "failed") {
      this.agentRegistry.updateAgentStatus(agentId, "idle");
    }

    return `Agent ${agentId} recovered`;
  }

  recoverTask(taskId: string): string {
    const task = this.taskManager.getTask(taskId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status === "failed") {
      this.taskManager.updateTaskStatus(taskId, "pending");
    }

    return `Task ${taskId} recovered`;
  }

  runRecovery(jobId: string): string {
    const job = this.recoveryQueue.getJob(jobId);

    if (!job) {
      throw new Error(`Recovery job not found: ${jobId}`);
    }

    this.recoveryQueue.updateJobStatus(jobId, "running");
    this.recoveryQueue.incrementAttempts(jobId);

    let result = "";

    if (job.targetType === "agent") {
      result = this.recoverAgent(job.targetId);
    } else if (job.targetType === "task") {
      result = this.recoverTask(job.targetId);
    } else {
      result = `System recovery complete for ${job.targetId}`;
    }

    this.recoveryQueue.updateJobStatus(jobId, "done");
    return result;
  }
}
