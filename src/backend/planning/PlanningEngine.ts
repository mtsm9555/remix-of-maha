import { PlanGenerator } from "./PlanGenerator";
import { ProgressMonitor } from "./ProgressMonitor";
import { RetryEngine } from "./RetryEngine";
import type { Goal, ExecutionPlan } from "./types";
import { globalDepartmentRegistry } from "../agents/departments/DepartmentRegistry";

export class PlanningEngine {
  static async executeGoal(
    goalDescription: string,
    userId: string,
  ): Promise<{ goal: Goal; plan: ExecutionPlan }> {
    console.log(`[PlanningEngine] Executing goal: "${goalDescription}"`);

    const { goal, plan } = await PlanGenerator.generate(goalDescription, userId);
    ProgressMonitor.trackGoal(goal);

    await this.executeSubtasks(goal, plan);

    const failedSubtasks = goal.subtasks.filter((s) => s.status === "failed");
    if (failedSubtasks.length > 0) {
      await RetryEngine.retryFailedSubtasks(goal);
    }

    const finalGoal = ProgressMonitor.getGoalStatus(goal.id)!;
    return { goal: finalGoal, plan };
  }

  private static async executeSubtasks(goal: Goal, plan: ExecutionPlan) {
    const completed = new Set<string>();
    const executing = new Set<string>();

    const dependencyMap = new Map<string, string[]>();
    for (const step of plan.steps) dependencyMap.set(step.subtaskId, step.dependencies);

    while (completed.size < plan.steps.length) {
      const ready = plan.steps.filter((step) => {
        if (completed.has(step.subtaskId) || executing.has(step.subtaskId)) return false;
        const deps = dependencyMap.get(step.subtaskId) || [];
        return deps.every((dep) => completed.has(dep));
      });

      if (ready.length === 0) {
        if (executing.size === 0) {
          console.error("[PlanningEngine] Deadlock detected");
          break;
        }
        await new Promise((r) => setTimeout(r, 100));
        continue;
      }

      const promises = ready.map(async (step) => {
        executing.add(step.subtaskId);
        const subtask = goal.subtasks.find((s) => s.id === step.subtaskId)!;
        subtask.status = "in_progress";
        subtask.startedAt = new Date();
        ProgressMonitor.updateSubtaskStatus(goal.id, subtask.id, "in_progress");

        try {
          const agent = globalDepartmentRegistry.getAgent(step.agentId);
          if (!agent) throw new Error(`Agent ${step.agentId} not found`);
          const result = await agent.executeTask(subtask.description, {
            userId: goal.userId,
            goalId: goal.id,
            subtaskId: subtask.id,
          });
          ProgressMonitor.updateSubtaskStatus(goal.id, subtask.id, "completed", result);
        } catch (error: any) {
          ProgressMonitor.updateSubtaskStatus(
            goal.id,
            subtask.id,
            "failed",
            undefined,
            error?.message ?? String(error),
          );
        } finally {
          completed.add(step.subtaskId);
          executing.delete(step.subtaskId);
        }
      });

      await Promise.all(promises);
    }
  }

  static getAllGoals() {
    return ProgressMonitor.getAllGoals();
  }
  static getGoalStatus(goalId: string) {
    return ProgressMonitor.getGoalStatus(goalId);
  }
  static getProgress(goalId: string) {
    return ProgressMonitor.getProgress(goalId);
  }
}