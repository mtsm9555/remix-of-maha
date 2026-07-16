import type { Goal, Subtask } from "./types";
import { globalEventBus } from "../events/EventBus";
import { AgentChannel, EventType } from "../events/types";

export class ProgressMonitor {
  private static goals: Map<string, Goal> = new Map();

  static trackGoal(goal: Goal) {
    this.goals.set(goal.id, goal);
    console.log(`[ProgressMonitor] Tracking goal: ${goal.id}`);
  }

  static updateSubtaskStatus(
    goalId: string,
    subtaskId: string,
    status: Subtask["status"],
    result?: any,
    error?: string,
  ) {
    const goal = this.goals.get(goalId);
    if (!goal) return console.error(`[ProgressMonitor] Goal not found: ${goalId}`);
    const subtask = goal.subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return console.error(`[ProgressMonitor] Subtask not found: ${subtaskId}`);

    subtask.status = status;
    if (result) subtask.result = result;
    if (error) subtask.error = error;

    if (status === "in_progress") subtask.startedAt = new Date();
    else if (status === "completed" || status === "failed") subtask.completedAt = new Date();

    this.checkGoalCompletion(goal);

    globalEventBus.publish({
      id: crypto.randomUUID(),
      type: EventType.TASK_COMPLETED,
      channel: AgentChannel.SYSTEM,
      payload: { goalId, subtaskId, status, result, error },
      timestamp: new Date(),
      correlationId: goalId,
      sourceAgent: "ProgressMonitor",
    });
  }

  private static checkGoalCompletion(goal: Goal) {
    const allDone = goal.subtasks.every((s) => s.status === "completed" || s.status === "failed");
    if (!allDone) {
      goal.status = "executing";
      return;
    }
    const failedCount = goal.subtasks.filter((s) => s.status === "failed").length;
    if (failedCount === 0) {
      goal.status = "completed";
      goal.completedAt = new Date();
      goal.result = this.aggregateResults(goal);
      console.log(`[ProgressMonitor] Goal ${goal.id} completed`);
    } else {
      goal.status = "failed";
      goal.completedAt = new Date();
      goal.error = `${failedCount} subtask(s) failed`;
      console.error(`[ProgressMonitor] Goal ${goal.id} failed`);
    }
  }

  private static aggregateResults(goal: Goal): any {
    return {
      totalSubtasks: goal.subtasks.length,
      completed: goal.subtasks.filter((s) => s.status === "completed").length,
      failed: goal.subtasks.filter((s) => s.status === "failed").length,
      results: goal.subtasks
        .filter((s) => s.result)
        .map((s) => ({
          subtaskId: s.id,
          description: s.description,
          agent: s.assignedAgentName,
          result: s.result,
        })),
    };
  }

  static getGoalStatus(goalId: string): Goal | undefined {
    return this.goals.get(goalId);
  }

  static getAllGoals(): Goal[] {
    return Array.from(this.goals.values());
  }

  static getProgress(goalId: string): number {
    const goal = this.goals.get(goalId);
    if (!goal || goal.subtasks.length === 0) return 0;
    const completed = goal.subtasks.filter(
      (s) => s.status === "completed" || s.status === "failed",
    ).length;
    return (completed / goal.subtasks.length) * 100;
  }
}