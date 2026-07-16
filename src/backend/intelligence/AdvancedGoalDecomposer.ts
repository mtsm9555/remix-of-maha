import { GoalDecomposer } from "../os/GoalDecomposer";
import type { OSMilestone } from "../os/PlanTypes";
import type {
  AdvancedOSPlan,
  FeasibilityReview,
  HistoricalAdjustment,
} from "./AdvancedPlanTypes";
import { HistoricalPlanner } from "./HistoricalPlanner";
import { PlanFeasibilityChecker } from "./PlanFeasibilityChecker";
import { RecursiveDecomposer } from "./RecursiveDecomposer";

export class AdvancedGoalDecomposer {
  static async decomposeIntelligently(goal: string, userId: string): Promise<AdvancedOSPlan> {
    console.log(`\n🧠 [AdvancedDecomposer] Starting intelligent decomposition for: "${goal}"`);

    const plan = await GoalDecomposer.decompose(goal, userId);

    const historicalAdjustments = new Map<string, HistoricalAdjustment>();
    for (const milestone of plan.milestones) {
      const adjustment = await HistoricalPlanner.adjustEstimates(milestone);
      if (adjustment.adjustmentFactor !== 1.0) {
        milestone.resources = adjustment.adjustedEstimate;
        historicalAdjustments.set(milestone.id, adjustment);
      }
    }

    const reviews: FeasibilityReview[] = await PlanFeasibilityChecker.reviewPlan(
      plan as AdvancedOSPlan,
    );

    const finalMilestones: OSMilestone[] = [];
    for (const milestone of plan.milestones) {
      const review = reviews.find((r) => r.milestoneId === milestone.id);
      if (review && review.confidenceScore < 0.5) {
        console.log(
          `[AdvancedDecomposer] Milestone "${milestone.objective}" flagged as too complex. Recursively breaking down...`,
        );
        const subs = await RecursiveDecomposer.breakDownMilestone(milestone);
        finalMilestones.push(...subs);
      } else {
        finalMilestones.push(milestone);
      }
    }

    const avgConfidence =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.confidenceScore, 0) / reviews.length
        : 0.8;

    const advancedPlan: AdvancedOSPlan = {
      ...plan,
      milestones: finalMilestones,
      historicalAdjustments,
      feasibilityReviews: reviews,
      overallConfidenceScore: avgConfidence,
    };

    console.log(
      `[AdvancedDecomposer] Intelligent plan finalized. Overall Confidence: ${(avgConfidence * 100).toFixed(1)}%`,
    );
    return advancedPlan;
  }
}