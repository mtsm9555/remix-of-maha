import { GoalDecomposer } from "./GoalDecomposer";
import { AgentAssigner } from "./AgentAssigner";
import type { Goal, ExecutionPlan, Subtask, PlanStep } from "./types";
import { globalDepartmentRegistry } from "../agents/departments/DepartmentRegistry";

export class PlanGenerator {
  static async generate(
    goalDescription: string,
    userId: string,
  ): Promise<{ goal: Goal; plan: ExecutionPlan }> {
    console.log(`[PlanGenerator] Generating plan for: "${goalDescription}"`);

    const allAgents = globalDepartmentRegistry.getAllAgents();
    const availableAgentIds = allAgents.map((a) => a.id);

    const subtasks = await GoalDecomposer.decompose(goalDescription, {
      userId,
      availableAgents: availableAgentIds,
    });

    const goalId = crypto.randomUUID();
    const goal: Goal = {
      id: goalId,
      userId,
      description: goalDescription,
      status: "planning",
      subtasks: subtasks.map((s) => ({ ...s, goalId })),
      createdAt: new Date(),
    };

    const steps = AgentAssigner.assign(goal.subtasks);
    if (!AgentAssigner.validateDependencies(steps)) {
      throw new Error("Invalid plan: dependency validation failed");
    }

    const plan: ExecutionPlan = {
      goalId,
      steps,
      estimatedDuration: steps.reduce((sum, s) => sum + s.estimatedDuration, 0),
      confidence: this.calculateConfidence(goal.subtasks, steps),
    };

    console.log(
      `[PlanGenerator] Plan generated with ${steps.length} steps, ~${plan.estimatedDuration}m, confidence ${(plan.confidence * 100).toFixed(1)}%`,
    );
    return { goal, plan };
  }

  private static calculateConfidence(subtasks: Subtask[], steps: PlanStep[]): number {
    let confidence = 0.8;
    const unassignedCount = subtasks.filter((s) => !s.assignedAgentId).length;
    if (unassignedCount > 0) confidence -= (unassignedCount / subtasks.length) * 0.3;
    const totalDeps = steps.reduce((sum, s) => sum + s.dependencies.length, 0);
    if (totalDeps > 5) confidence -= 0.1;
    const departments = new Set(steps.map((s) => s.department));
    if (departments.size > 1) confidence += 0.05;
    return Math.max(0.1, Math.min(1.0, confidence));
  }
}