import type { OSPlan, OSMilestone, ResourceEstimate } from "../os/PlanTypes";

export interface HistoricalAdjustment {
  originalEstimate: ResourceEstimate;
  adjustedEstimate: ResourceEstimate;
  adjustmentFactor: number;
  reason: string;
}

export interface FeasibilityReview {
  milestoneId: string;
  departmentManagerId: string;
  confidenceScore: number;
  feedback: string;
  suggestedChanges?: Partial<OSMilestone>;
}

export interface AdvancedOSPlan extends OSPlan {
  historicalAdjustments: Map<string, HistoricalAdjustment>;
  feasibilityReviews: FeasibilityReview[];
  overallConfidenceScore: number;
}