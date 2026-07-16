import { AgentPool } from "./AgentPool";
import { osGenerate } from "./llm";
import type { OSMilestone } from "./types";
import type { Department, DepartmentAgent } from "../agents/departments/types";

export interface MicroTask {
  id: string;
  description: string;
  assignedAgentId: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  result?: any;
}

export class DepartmentManagerAgent {
  private departmentId: Department;
  private pool: AgentPool;
  private activeTasks: Map<string, MicroTask> = new Map();

  constructor(departmentId: Department, agents: DepartmentAgent[]) {
    this.departmentId = departmentId;
    this.pool = new AgentPool(departmentId, agents);
  }

  async executeMilestone(milestone: OSMilestone): Promise<{ success: boolean; result: any }> {
    const microTasks = await this.decomposeMilestone(milestone);
    const executionPromises = microTasks.map((t) => this.executeMicroTask(t));
    const results = await Promise.allSettled(executionPromises);
    const finalReport = await this.synthesizeReport(milestone, results);
    return { success: true, result: finalReport };
  }

  private async decomposeMilestone(milestone: OSMilestone): Promise<MicroTask[]> {
    const prompt = `You are the Manager of the ${this.departmentId} department.
Objective: "${milestone.objective}"
Success criteria: ${milestone.successCriteria.join(", ")}
Break this into 2-4 actionable micro-tasks.
Output JSON: { "tasks": [ { "description": "...", "agentType": "..." } ] }`;
    const response = await osGenerate(prompt, { responseFormat: "json" });
    let parsed: any = { tasks: [] };
    try {
      parsed = JSON.parse(response.content);
    } catch {
      parsed = { tasks: [{ description: milestone.objective, agentType: "Generalist" }] };
    }
    const tasks: MicroTask[] = (parsed.tasks ?? []).map((t: any, i: number) => ({
      id: `task_${milestone.id}_${i}`,
      description: t.description,
      assignedAgentId: t.agentType,
      status: "pending" as const,
    }));
    tasks.forEach((t) => this.activeTasks.set(t.id, t));
    return tasks;
  }

  private async executeMicroTask(task: MicroTask): Promise<any> {
    const agentInstance = this.pool.getAvailableAgent();
    if (!agentInstance) {
      throw new Error(`[Manager: ${this.departmentId}] No available agents in pool`);
    }
    this.pool.assignTask(agentInstance.id, task.id);
    task.status = "in_progress";
    try {
      const result = await agentInstance.agent.executeTask(task.description, {
        department: this.departmentId,
        milestoneContext: true,
      });
      this.pool.completeTask(agentInstance.id, true);
      task.status = "completed";
      task.result = result;
      return result;
    } catch (error) {
      this.pool.completeTask(agentInstance.id, false);
      task.status = "failed";
      throw error;
    }
  }

  private async synthesizeReport(milestone: OSMilestone, results: any[]): Promise<string> {
    const prompt = `You are the Manager of the ${this.departmentId} department.
Objective: "${milestone.objective}"
Task Results: ${JSON.stringify(results, null, 2)}
Write a concise executive summary.`;
    const response = await osGenerate(prompt);
    return response.content;
  }

  getPoolMetrics() {
    return this.pool.getMetrics();
  }
}