import type { OSPlan } from "./PlanTypes";
import { GoalDecomposer } from "./GoalDecomposer";
import { PlanValidator } from "./PlanValidator";
import { WaveExecutor } from "./WaveExecutor";

export class ExecutionOrchestrator {
  private static activePlans: Map<string, OSPlan> = new Map();

  static async executeGoal(
    goal: string,
    userId: string,
    constraints?: { maxBudget?: number; maxTimeMinutes?: number },
  ) {
    console.log(`🚀 [Orchestrator] Executing goal: "${goal}"`);

    const plan = await GoalDecomposer.decompose(goal, userId, constraints);

    const validation = await PlanValidator.validate(plan, userId);
    if (!validation.isValid) {
      plan.status = "failed";
      return { success: false, plan, errors: validation.errors };
    }
    if (validation.warnings.length > 0) {
      console.warn("[Orchestrator] Plan warnings:", validation.warnings);
    }

    plan.status = "approved";
    this.activePlans.set(plan.id, plan);

    const maxWave = plan.milestones.length
      ? Math.max(...plan.milestones.map((m) => m.wave))
      : 0;
    let overallSuccess = true;

    for (let wave = 1; wave <= maxWave; wave++) {
      const ready = WaveExecutor.getNextReadyWave(plan);
      if (ready.length === 0) break;
      const result = await WaveExecutor.executeWave(plan.id, wave, ready);
      if (result.failed > 0) overallSuccess = false;
    }

    plan.status = overallSuccess ? "completed" : "completed_with_failures";
    console.log(`🏁 [Orchestrator] Finished. Status: ${plan.status}`);
    return { success: overallSuccess, plan };
  }

  static getActivePlans() {
    return Array.from(this.activePlans.values());
  }

  static getPlan(id: string) {
    return this.activePlans.get(id);
  }
}