import type {
  ReputationEvent,
  ReputationMetrics,
  ReputationScore,
  TrustLevel,
} from "./ReputationTypes";
import type { Department } from "../../agents/departments/types";

const METRIC_WEIGHTS = {
  successRate: 0.3,
  averageQAScore: 0.25,
  humanOverrideRate: 0.2,
  budgetAdherence: 0.1,
  slaCompliance: 0.1,
  selfCorrectionRate: 0.05,
};

const EMA_ALPHA = 0.15;

export class ReputationCalculator {
  static calculateNewScore(
    currentMetrics: ReputationMetrics,
    event: ReputationEvent,
    totalTasks: number,
    department: Department,
  ): { newMetrics: ReputationMetrics; newScore: ReputationScore } {
    const updatedMetrics = this.applyEventToMetrics(currentMetrics, event);

    const compositeScore =
      updatedMetrics.successRate * METRIC_WEIGHTS.successRate +
      updatedMetrics.averageQAScore * METRIC_WEIGHTS.averageQAScore +
      (1 - updatedMetrics.humanOverrideRate) * METRIC_WEIGHTS.humanOverrideRate +
      updatedMetrics.budgetAdherence * METRIC_WEIGHTS.budgetAdherence +
      updatedMetrics.slaCompliance * METRIC_WEIGHTS.slaCompliance +
      updatedMetrics.selfCorrectionRate * METRIC_WEIGHTS.selfCorrectionRate;

    const trustLevel = this.mapScoreToTrustLevel(compositeScore, totalTasks);
    const trend = this.calculateTrend(compositeScore, currentMetrics);

    return {
      newMetrics: updatedMetrics,
      newScore: {
        agentId: event.agentId,
        department,
        compositeScore: Math.max(0, Math.min(1, compositeScore)),
        trustLevel,
        trend,
        totalTasksEvaluated: totalTasks + 1,
        lastUpdated: new Date(),
      },
    };
  }

  private static applyEventToMetrics(
    metrics: ReputationMetrics,
    event: ReputationEvent,
  ): ReputationMetrics {
    const updated = { ...metrics };
    const impact = event.scoreImpact;

    switch (event.eventType) {
      case "TASK_SUCCESS":
        updated.successRate = this.applyEMA(updated.successRate, 1.0);
        break;
      case "TASK_FAILURE":
        updated.successRate = this.applyEMA(updated.successRate, 0.0);
        break;
      case "QA_REJECTED":
        updated.averageQAScore = this.applyEMA(
          updated.averageQAScore,
          Math.max(0, 1 + impact),
        );
        break;
      case "HUMAN_OVERRIDE":
        updated.humanOverrideRate = this.applyEMA(updated.humanOverrideRate, 1.0);
        break;
      case "BUDGET_OVERUN":
        updated.budgetAdherence = this.applyEMA(
          updated.budgetAdherence,
          Math.max(0, 1 + impact),
        );
        break;
      case "SLA_MISS":
        updated.slaCompliance = this.applyEMA(updated.slaCompliance, 0.0);
        break;
    }

    return updated;
  }

  private static applyEMA(currentValue: number, newValue: number): number {
    return newValue * EMA_ALPHA + currentValue * (1 - EMA_ALPHA);
  }

  private static mapScoreToTrustLevel(score: number, totalTasks: number): TrustLevel {
    if (totalTasks < 5) return "NOVICE";
    if (score >= 0.9) return "ELITE";
    if (score >= 0.75) return "TRUSTED";
    if (score >= 0.5) return "NOVICE";
    return "UNTRUSTED";
  }

  private static calculateTrend(
    newScore: number,
    oldMetrics: ReputationMetrics,
  ): "rising" | "stable" | "falling" {
    const oldComposite =
      oldMetrics.successRate * 0.3 + oldMetrics.averageQAScore * 0.25;
    if (newScore > oldComposite + 0.05) return "rising";
    if (newScore < oldComposite - 0.05) return "falling";
    return "stable";
  }
}