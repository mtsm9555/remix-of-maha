import type { Goal, Subtask } from "./types";
import { globalDepartmentRegistry } from "../agents/departments/DepartmentRegistry";

export class RetryEngine {
  static async retrySubtask(goal: Goal, subtask: Subtask): Promise<boolean> {
    if (subtask.retryCount >= subtask.maxRetries) return false;
    if (!subtask.assignedAgentId) return false;

    console.log(`[RetryEngine] Retrying subtask ${subtask.id} (attempt ${subtask.retryCount + 1})`);
    subtask.retryCount++;
    subtask.status = "pending";
    const previousError = subtask.error;
    subtask.error = undefined;

    try {
      const agent = globalDepartmentRegistry.getAgent(subtask.assignedAgentId);
      if (!agent) throw new Error(`Agent ${subtask.assignedAgentId} not found`);
      const result = await agent.executeTask(subtask.description, {
        userId: goal.userId,
        retryAttempt: subtask.retryCount,
        previousError,
      });
      subtask.status = "completed";
      subtask.result = result;
      subtask.completedAt = new Date();
      return true;
    } catch (error: any) {
      subtask.status = "failed";
      subtask.error = error?.message ?? String(error);
      return false;
    }
  }

  static async retryFailedSubtasks(goal: Goal): Promise<{ success: number; failed: number }> {
    const failed = goal.subtasks.filter((s) => s.status === "failed");
    let success = 0;
    let failedCount = 0;
    for (const subtask of failed) {
      const ok = await this.retrySubtask(goal, subtask);
      ok ? success++ : failedCount++;
    }
    return { success, failed: failedCount };
  }
}