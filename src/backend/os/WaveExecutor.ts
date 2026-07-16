import type { OSPlan, OSMilestone } from "./PlanTypes";
import { ArchitectureRegistry } from "./ArchitectureRegistry";
import type { Department } from "../agents/departments/types";

export class WaveExecutor {
  static async executeWave(
    _planId: string,
    waveNumber: number,
    milestones: OSMilestone[],
  ): Promise<{ completed: number; failed: number }> {
    const waveMilestones = milestones.filter((m) => m.wave === waveNumber);
    console.log(`🌊 [WaveExecutor] Wave ${waveNumber}: ${waveMilestones.length} milestones.`);
    let completed = 0;
    let failed = 0;

    await Promise.all(
      waveMilestones.map(async (milestone) => {
        milestone.status = "in_progress";
        try {
          const result = await ArchitectureRegistry.executeMilestoneInDepartment(
            milestone.department as Department,
            milestone,
          );
          if (result.success) {
            milestone.status = "completed";
            completed++;
          } else {
            milestone.status = "failed";
            failed++;
          }
        } catch (error: any) {
          milestone.status = "failed";
          failed++;
          console.error(`[Wave ${waveNumber}] ${milestone.objective}: ${error.message}`);
        }
      }),
    );

    console.log(`🌊 [WaveExecutor] Wave ${waveNumber} done. ✅ ${completed} ❌ ${failed}`);
    return { completed, failed };
  }

  static getNextReadyWave(plan: OSPlan): OSMilestone[] {
    const completedIds = new Set(
      plan.milestones.filter((m) => m.status === "completed").map((m) => m.id),
    );
    return plan.milestones.filter((m) => {
      if (m.status !== "pending") return false;
      return m.dependencies.every((depId) => completedIds.has(depId));
    });
  }
}