import { DepartmentMemoryEngine } from "../os/memory/DepartmentMemoryEngine";
import type { OSMilestone, ResourceEstimate } from "../os/PlanTypes";
import type { HistoricalAdjustment } from "./AdvancedPlanTypes";
import type { Department } from "../agents/departments/types";

export class HistoricalPlanner {
  static async adjustEstimates(milestone: OSMilestone): Promise<HistoricalAdjustment> {
    console.log(`[HistoricalPlanner] Checking memory for similar tasks to: "${milestone.objective}"`);

    let memories: Array<{ content: string }> = [];
    try {
      memories = await DepartmentMemoryEngine.searchMemories({
        departmentId: milestone.department as Department,
        query: milestone.objective,
        queryEmbedding: [],
        types: ["episodic"],
        limit: 3,
      });
    } catch (err) {
      console.warn("[HistoricalPlanner] Memory search unavailable, defaulting to no adjustment.", err);
    }

    let factor = 1.0;
    const reasons: string[] = [];
    for (const memory of memories) {
      const c = memory.content.toLowerCase();
      if (c.includes("delayed") || c.includes("over budget")) {
        factor += 0.2;
        reasons.push(`Past similar task was delayed: ${memory.content.substring(0, 50)}...`);
      }
    }

    const adjustedEstimate: ResourceEstimate = {
      apiCostUSD: milestone.resources.apiCostUSD * factor,
      estimatedAgentHours: milestone.resources.estimatedAgentHours * factor,
      estimatedWallClockMinutes: milestone.resources.estimatedWallClockMinutes * factor,
      tokenUsageEstimate: milestone.resources.tokenUsageEstimate * factor,
    };

    return {
      originalEstimate: milestone.resources,
      adjustedEstimate,
      adjustmentFactor: factor,
      reason: reasons.length > 0 ? reasons.join(" | ") : "No historical deviations found.",
    };
  }
}