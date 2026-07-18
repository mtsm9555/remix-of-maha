// src/orchestrator/orchestrator.ts

import { AgentRegistry } from "../agents/agentRegistry";
import { TaskStateManager } from "../lifecycle/taskStateManager";
import { AuditLog } from "../audit/auditLog";
import { RecoveryManager } from "../recovery/recoveryManager";
import { Goal, GoalStatus, SubTask } from "./orchestratorTypes";

export class Orchestrator {
  private goals: Map<string, Goal> = new Map();
  private subtasks: Map<string, SubTask> = new Map();

  constructor(
    private agentRegistry: AgentRegistry,
    private taskManager: TaskStateManager,
    private auditLog: AuditLog,
    private recoveryManager: RecoveryManager
  ) {}

  createGoal(id: string, title: string, description: string): Goal {
    const now = new Date().toISOString();

    const goal: Goal = {
      id,
      title,
      description,
      status: "new",
      createdAt: now,
      updatedAt: now,
    };

    this.goals.set(id, goal);
    this.auditLog.recordEvent(
      `audit-${Date.now()}`,
      "orchestrator",
      "create_goal",
      `Created goal ${title}`,
      "info",
      id
    );

    return goal;
  }

  updateGoalStatus(id: string, status: GoalStatus): Goal {
    const goal = this.goals.get(id);
    if (!goal) throw new Error(`Goal not found: ${id}`);

    goal.status = status;
    goal.updatedAt = new Date().toISOString();
    this.goals.set(id, goal);

    return goal;
  }

  planGoal(goalId: string, taskTitles: string[]): SubTask[] {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error(`Goal not found: ${goalId}`);

    const now = new Date().toISOString();
    const created: SubTask[] = [];

    for (const title of taskTitles) {
      const taskId = `subtask-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const subtask: SubTask = {
        id: taskId,
        goalId,
        title,
        description: `Auto-planned task for goal ${goalId}`,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };

      this.subtasks.set(taskId, subtask);

      this.taskManager.createTask(taskId, title);
      created.push(subtask);
    }

    goal.status = "planned";
    goal.updatedAt = new Date().toISOString();

    this.auditLog.recordEvent(
      `audit-${Date.now()}-plan`,
      "orchestrator",
      "plan_goal",
      `Planned ${created.length} subtasks for goal ${goalId}`,
      "info",
      goalId
    );

    return created;
  }

  assignSubTask(subtaskId: string, agentId: string): SubTask {
    const subtask = this.subtasks.get(subtaskId);
    if (!subtask) throw new Error(`Subtask not found: ${subtaskId}`);

    const agent = this.agentRegistry.getAgent(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    subtask.assignedAgentId = agentId;
    subtask.status = "assigned";
    subtask.updatedAt = new Date().toISOString();
    this.subtasks.set(subtaskId, subtask);

    this.auditLog.recordEvent(
      `audit-${Date.now()}-assign`,
      "orchestrator",
      "assign_subtask",
      `Assigned subtask ${subtaskId} to agent ${agentId}`,
      "info",
      subtaskId
    );

    return subtask;
  }

  startExecution(goalId: string): string {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error(`Goal not found: ${goalId}`);

    goal.status = "running";
    goal.updatedAt = new Date().toISOString();

    this.auditLog.recordEvent(
      `audit-${Date.now()}-run`,
      "orchestrator",
      "start_execution",
      `Started execution for goal ${goalId}`,
      "info",
      goalId
    );

    return `Goal ${goalId} started`;
  }

  completeSubTask(subtaskId: string): SubTask {
    const subtask = this.subtasks.get(subtaskId);
    if (!subtask) throw new Error(`Subtask not found: ${subtaskId}`);

    subtask.status = "done";
    subtask.updatedAt = new Date().toISOString();
    this.subtasks.set(subtaskId, subtask);

    this.auditLog.recordEvent(
      `audit-${Date.now()}-done`,
      "orchestrator",
      "complete_subtask",
      `Completed subtask ${subtaskId}`,
      "info",
      subtaskId
    );

    return subtask;
  }

  failSubTask(subtaskId: string, reason: string): SubTask {
    const subtask = this.subtasks.get(subtaskId);
    if (!subtask) throw new Error(`Subtask not found: ${subtaskId}`);

    subtask.status = "failed";
    subtask.updatedAt = new Date().toISOString();
    this.subtasks.set(subtaskId, subtask);

    this.auditLog.recordEvent(
      `audit-${Date.now()}-fail`,
      "orchestrator",
      "fail_subtask",
      `Subtask ${subtaskId} failed: ${reason}`,
      "error",
      subtaskId
    );

    this.recoveryManager.reportFailure(
      "task",
      subtaskId,
      "unknown",
      reason
    );

    return subtask;
  }

  finishGoal(goalId: string): Goal {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error(`Goal not found: ${goalId}`);

    const subtasks = this.getSubTasksByGoal(goalId);
    const allDone = subtasks.every((t) => t.status === "done");

    if (!allDone) {
      throw new Error(`Cannot finish goal ${goalId}: not all subtasks are done`);
    }

    goal.status = "completed";
    goal.updatedAt = new Date().toISOString();
    this.goals.set(goalId, goal);

    this.auditLog.recordEvent(
      `audit-${Date.now()}-complete`,
      "orchestrator",
      "finish_goal",
      `Completed goal ${goalId}`,
      "info",
      goalId
    );

    return goal;
  }

  getGoal(id: string): Goal | undefined {
    return this.goals.get(id);
  }

  getAllGoals(): Goal[] {
    return Array.from(this.goals.values());
  }

  getSubTask(id: string): SubTask | undefined {
    return this.subtasks.get(id);
  }

  getSubTasksByGoal(goalId: string): SubTask[] {
    return Array.from(this.subtasks.values()).filter((t) => t.goalId === goalId);
  }
}
