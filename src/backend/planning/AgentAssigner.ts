import { globalDepartmentRegistry } from "../agents/departments/DepartmentRegistry";
import type { Subtask, PlanStep } from "./types";

export class AgentAssigner {
  static assign(subtasks: Subtask[]): PlanStep[] {
    console.log(`[AgentAssigner] Assigning agents to ${subtasks.length} subtasks`);
    const steps: PlanStep[] = [];

    for (const subtask of subtasks) {
      const agent = globalDepartmentRegistry.findBestAgent(subtask.description);
      if (!agent) {
        console.warn(`[AgentAssigner] No suitable agent found for: ${subtask.description}`);
        continue;
      }
      steps.push({
        order: steps.length + 1,
        subtaskId: subtask.id,
        agentId: agent.id,
        agentName: agent.name,
        department: agent.department,
        estimatedDuration: this.estimateDuration(subtask),
        dependencies: subtask.dependencies,
      });
      subtask.assignedAgentId = agent.id;
      subtask.assignedAgentName = agent.name;
      subtask.department = agent.department;
    }
    return steps;
  }

  private static estimateDuration(subtask: Subtask): number {
    const desc = subtask.description.toLowerCase();
    if (desc.includes("write") || desc.includes("create") || desc.includes("generate")) return 10;
    if (desc.includes("analyze") || desc.includes("research") || desc.includes("optimize")) return 20;
    if (desc.includes("build") || desc.includes("develop") || desc.includes("implement")) return 45;
    return 15;
  }

  static validateDependencies(steps: PlanStep[]): boolean {
    const ids = new Set(steps.map((s) => s.subtaskId));
    for (const step of steps) {
      for (const dep of step.dependencies) {
        if (!ids.has(dep)) {
          console.error(`[AgentAssigner] Invalid dependency: ${dep} not found`);
          return false;
        }
      }
    }
    return true;
  }
}