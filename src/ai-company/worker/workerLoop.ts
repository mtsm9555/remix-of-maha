// src/worker/workerLoop.ts

import { Orchestrator } from "../orchestrator/orchestrator";
import { AgentRegistry } from "../agents/agentRegistry";
import { AuditLog } from "../audit/auditLog";
import { TaskStateManager } from "../lifecycle/taskStateManager";

export class WorkerLoop {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private orchestrator: Orchestrator,
    private agentRegistry: AgentRegistry,
    private taskManager: TaskStateManager,
    private auditLog: AuditLog
  ) {}

  start(intervalMs: number = 2000): void {
    if (this.running) return;

    this.running = true;
    this.timer = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.running = false;
    this.timer = null;
  }

  tick(): void {
    const goals = this.orchestrator.getAllGoals();

    for (const goal of goals) {
      const subtasks = this.orchestrator.getSubTasksByGoal(goal.id);
      const pending = subtasks.filter(
        (t) => t.status === "pending" || t.status === "assigned"
      );

      for (const subtask of pending) {
        const agents = this.agentRegistry.getAllAgents();
        const worker = agents.find((a) => a.role === "worker");

        if (!worker) continue;

        this.orchestrator.assignSubTask(subtask.id, worker.id);

        this.auditLog.recordEvent(
          `audit-${Date.now()}-worker`,
          "worker",
          "process_subtask",
          `Worker ${worker.id} picked up subtask ${subtask.id}`,
          "info",
          subtask.id
        );

        this.taskManager.updateTaskStatus(subtask.id, "in-progress" as any);

        setTimeout(() => {
          this.orchestrator.completeSubTask(subtask.id);
          this.taskManager.updateTaskStatus(subtask.id, "done" as any);

          this.auditLog.recordEvent(
            `audit-${Date.now()}-worker-done`,
            "worker",
            "complete_subtask",
            `Worker ${worker.id} completed subtask ${subtask.id}`,
            "info",
            subtask.id
          );
        }, 1000);
      }
    }
  }
}
