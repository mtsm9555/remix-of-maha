import type { Department } from "../../agents/departments/types";
import type { OSMilestone } from "../../os/PlanTypes";
import { PlanStateManager } from "../../os/planning/PlanStateManager";
import { DependencyResolver } from "./DependencyResolver";
import type { PrioritizationContext, TaskPriorityScore } from "./PriorityTypes";
import { TaskPrioritizer } from "./TaskPrioritizer";

const DEFAULT_LOAD: Record<Department, number> = {
  development: 0.8,
  marketing: 0.3,
  sales: 0.5,
  operations: 0.2,
  finance: 0.4,
  design: 0.6,
  research: 0.1,
  support: 0.7,
  hr: 0.4,
};

export class PrioritizationEngine {
  private static scores: Map<string, TaskPriorityScore> = new Map();
  private static intervalId: ReturnType<typeof setInterval> | null = null;
  private static planMilestones: Map<string, OSMilestone[]> = new Map();
  private static activeIncidents: string[] = [];

  static registerPlan(planId: string, milestones: OSMilestone[]) {
    this.planMilestones.set(planId, milestones);
    PlanStateManager.ensureState(planId);
  }

  static startDynamicReevaluation(planId: string, intervalMs = 60000) {
    console.log(`[PrioritizationEngine] Starting re-evaluation for ${planId} every ${intervalMs}ms`);
    this.stopDynamicReevaluation();
    this.intervalId = setInterval(() => {
      void this.reevaluatePlan(planId);
    }, intervalMs);
  }

  static stopDynamicReevaluation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  static async reevaluatePlan(planId: string) {
    const state = PlanStateManager.getState(planId);
    if (!state) return;

    const context: PrioritizationContext = {
      currentTimestamp: new Date(),
      activeIncidents: [...this.activeIncidents],
      globalResourceLoad: { ...DEFAULT_LOAD },
    };

    const pendingMilestones = (this.planMilestones.get(planId) ?? []).filter(
      (m) => m.status === "pending",
    );
    const depMap = DependencyResolver.buildDependencyMap(pendingMilestones);

    for (const milestone of pendingMilestones) {
      const downstreamCount = DependencyResolver.countDownstreamDependencies(milestone.id, depMap);
      const score = TaskPrioritizer.calculateScore(milestone, context, downstreamCount);
      this.scores.set(milestone.id, score);
    }

    const sorted = TaskPrioritizer.sortMilestonesByPriority(pendingMilestones, this.scores);
    if (sorted.length > 0) {
      const topTask = sorted[0];
      const topScore = this.scores.get(topTask.id);
      PlanStateManager.logEvent(
        planId,
        `Re-prioritized. Next action: "${topTask.objective}" (Score: ${topScore?.finalScore.toFixed(2)}, Tier: ${topScore?.tier})`,
      );
    }
  }

  static async injectCriticalIncident(planId: string, department: string, reason: string) {
    console.log(`[PrioritizationEngine] CRITICAL INCIDENT: ${reason} (${department})`);
    this.activeIncidents.push(`${department}:${reason}`);
    await this.reevaluatePlan(planId);
  }

  static getScores(): Map<string, TaskPriorityScore> {
    return this.scores;
  }
}
