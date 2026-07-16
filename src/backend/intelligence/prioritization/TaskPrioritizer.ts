import type { OSMilestone } from "../../os/PlanTypes";
import type {
  PriorityFactors,
  PriorityTier,
  PrioritizationContext,
  TaskPriorityScore,
} from "./PriorityTypes";

const WEIGHTS = {
  urgency: 0.35,
  strategicValue: 0.25,
  unblockFactor: 0.2,
  resourceReadiness: 0.1,
  riskPenalty: 0.1,
};

export class TaskPrioritizer {
  static calculateScore(
    milestone: OSMilestone,
    context: PrioritizationContext,
    downstreamDependencyCount: number,
  ): TaskPriorityScore {
    const factors = this.calculateFactors(milestone, context, downstreamDependencyCount);
    const riskPenalty = factors.riskScore * 0.2;
    const finalScore =
      factors.urgencyScore * WEIGHTS.urgency +
      factors.strategicValue * WEIGHTS.strategicValue +
      factors.unblockFactor * WEIGHTS.unblockFactor +
      factors.resourceReadiness * WEIGHTS.resourceReadiness -
      riskPenalty * WEIGHTS.riskPenalty;

    const clampedScore = Math.max(0, Math.min(1, finalScore));

    return {
      taskId: milestone.id,
      milestoneId: milestone.id,
      department: milestone.department,
      finalScore: clampedScore,
      tier: this.mapScoreToTier(clampedScore),
      factors,
      lastCalculatedAt: new Date(),
    };
  }

  private static calculateFactors(
    milestone: OSMilestone,
    context: PrioritizationContext,
    downstreamDependencyCount: number,
  ): PriorityFactors {
    let urgencyScore = 0.5;
    if (context.activeIncidents.length > 0 && milestone.department === "operations") {
      urgencyScore = 0.95;
    }

    const strategicValue = ["sales", "development", "finance"].includes(milestone.department) ? 0.8 : 0.6;
    const unblockFactor = Math.min(1.0, downstreamDependencyCount * 0.25);
    const deptLoad = context.globalResourceLoad[milestone.department] ?? 0.5;
    const resourceReadiness = 1.0 - deptLoad;
    const riskScore = milestone.risks.length > 0 ? 0.7 : 0.2;

    return { urgencyScore, strategicValue, unblockFactor, resourceReadiness, riskScore };
  }

  private static mapScoreToTier(score: number): PriorityTier {
    if (score >= 0.85) return "critical";
    if (score >= 0.65) return "high";
    if (score >= 0.4) return "medium";
    return "low";
  }

  static sortMilestonesByPriority(
    milestones: OSMilestone[],
    scores: Map<string, TaskPriorityScore>,
  ): OSMilestone[] {
    return [...milestones].sort((a, b) => {
      const scoreA = scores.get(a.id)?.finalScore || 0;
      const scoreB = scores.get(b.id)?.finalScore || 0;
      return scoreB - scoreA;
    });
  }
}
