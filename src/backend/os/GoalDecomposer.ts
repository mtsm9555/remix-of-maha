import { osGenerate } from "./llm";
import { ArchitectureRegistry } from "./ArchitectureRegistry";
import type { OSPlan, OSMilestone, ResourceEstimate } from "./PlanTypes";
import type { Department } from "../agents/departments/types";

export class GoalDecomposer {
  static async decompose(
    goal: string,
    _userId: string,
    constraints?: { maxBudget?: number; maxTimeMinutes?: number },
  ): Promise<OSPlan> {
    console.log(`🧠 [GoalDecomposer] Analyzing enterprise goal: "${goal}"`);

    const orgContext = ArchitectureRegistry.getOrgHealthReport();
    const availableDepartments = orgContext.departments.map((d) => ({
      id: d.id,
      name: d.name,
      currentLoad: d.managerMetrics?.working || 0,
      totalAgents: d.managerMetrics?.totalAgents || 0,
      remainingBudget: d.budget.limit - d.budget.spent,
    }));

    const rawPlan = await this.generateLLMPlan(goal, availableDepartments, constraints);
    const milestones = this.mapToMilestones(rawPlan.milestones ?? []);
    const totalResources = this.calculateTotalResources(milestones);
    const criticalPath = this.calculateCriticalPath(milestones);

    const plan: OSPlan = {
      id: `plan_${crypto.randomUUID()}`,
      goal,
      status: "draft",
      milestones,
      totalResources,
      criticalPath,
      createdAt: new Date(),
    };

    console.log(
      `[GoalDecomposer] Generated plan with ${milestones.length} milestones across ${this.getMaxWave(milestones)} waves.`,
    );
    return plan;
  }

  private static async generateLLMPlan(
    goal: string,
    departments: any[],
    constraints?: { maxBudget?: number; maxTimeMinutes?: number },
  ): Promise<any> {
    const constraintText = constraints
      ? `\nCONSTRAINTS: Max Budget $${constraints.maxBudget}, Max Time ${constraints.maxTimeMinutes} min`
      : "";

    const prompt = `You are the Chief Strategy Officer of Maha AI OS.
GOAL: "${goal}"${constraintText}

AVAILABLE DEPARTMENTS: ${JSON.stringify(departments, null, 2)}

INSTRUCTIONS:
1. Break the goal into 4-8 major milestones.
2. Assign each milestone to the most appropriate Department.
3. Group milestones into Waves (1 = no deps, 2 = depends on Wave 1, ...).
4. Estimate resources (apiCostUSD, agent hours, wall clock minutes, tokens).
5. Identify at least one risk per milestone.
6. Define strict success criteria.

Output JSON: {
  "milestones": [
    { "department": "marketing", "wave": 1, "objective": "...", "successCriteria": ["..."], "dependencies": [],
      "resources": { "apiCostUSD": 2.5, "estimatedAgentHours": 1.5, "estimatedWallClockMinutes": 20, "tokenUsageEstimate": 50000 },
      "risks": [{ "level": "medium", "description": "...", "mitigationStrategy": "..." }] }
  ]
}`;
    const response = await osGenerate(prompt, { responseFormat: "json" });
    try {
      return JSON.parse(response.content);
    } catch {
      return { milestones: [] };
    }
  }

  private static mapToMilestones(rawMilestones: any[]): OSMilestone[] {
    return rawMilestones.map((m, index) => ({
      id: `milestone_${index + 1}`,
      wave: m.wave || 1,
      department: m.department as Department,
      objective: m.objective,
      successCriteria: m.successCriteria || ["Objective completed successfully"],
      dependencies: m.dependencies || [],
      resources: {
        apiCostUSD: m.resources?.apiCostUSD ?? 1.0,
        estimatedAgentHours: m.resources?.estimatedAgentHours ?? 1,
        estimatedWallClockMinutes: m.resources?.estimatedWallClockMinutes ?? 15,
        tokenUsageEstimate: m.resources?.tokenUsageEstimate ?? 10000,
      },
      risks: m.risks || [],
      status: "pending",
    }));
  }

  private static calculateTotalResources(milestones: OSMilestone[]): ResourceEstimate {
    return milestones.reduce(
      (acc, m) => ({
        apiCostUSD: acc.apiCostUSD + m.resources.apiCostUSD,
        estimatedAgentHours: acc.estimatedAgentHours + m.resources.estimatedAgentHours,
        estimatedWallClockMinutes:
          acc.estimatedWallClockMinutes + m.resources.estimatedWallClockMinutes,
        tokenUsageEstimate: acc.tokenUsageEstimate + m.resources.tokenUsageEstimate,
      }),
      { apiCostUSD: 0, estimatedAgentHours: 0, estimatedWallClockMinutes: 0, tokenUsageEstimate: 0 },
    );
  }

  private static getMaxWave(milestones: OSMilestone[]): number {
    return milestones.length === 0 ? 1 : Math.max(...milestones.map((m) => m.wave), 1);
  }

  private static calculateCriticalPath(milestones: OSMilestone[]): string[] {
    if (milestones.length === 0) return [];
    const maxTime = Math.max(...milestones.map((m) => m.resources.estimatedWallClockMinutes));
    return milestones
      .filter((m) => m.resources.estimatedWallClockMinutes === maxTime)
      .map((m) => m.id);
  }
}