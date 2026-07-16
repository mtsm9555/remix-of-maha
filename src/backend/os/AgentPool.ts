import type { DepartmentAgent, AgentStatus } from "../agents/departments/types";

export interface AgentInstance {
  id: string;
  agent: DepartmentAgent;
  status: AgentStatus;
  currentTaskId?: string;
  tasksCompleted: number;
  lastActiveAt: Date;
  healthScore: number;
}

export class AgentPool {
  private instances: Map<string, AgentInstance> = new Map();
  private maxConcurrency: number;

  constructor(departmentId: string, agents: DepartmentAgent[], maxConcurrency: number = 5) {
    this.maxConcurrency = maxConcurrency;
    agents.forEach((agent, index) => {
      const instanceId = `${departmentId}_${agent.id}_${index}`;
      this.instances.set(instanceId, {
        id: instanceId,
        agent,
        status: "idle",
        tasksCompleted: 0,
        lastActiveAt: new Date(),
        healthScore: 1.0,
      });
    });
  }

  getAvailableAgent(): AgentInstance | null {
    for (const instance of this.instances.values()) {
      if (instance.status === "idle" && instance.healthScore > 0.5) return instance;
    }
    return null;
  }

  assignTask(instanceId: string, taskId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.status !== "idle") return false;
    instance.status = "working";
    instance.currentTaskId = taskId;
    instance.lastActiveAt = new Date();
    return true;
  }

  completeTask(instanceId: string, success: boolean) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    instance.status = "idle";
    instance.currentTaskId = undefined;
    instance.lastActiveAt = new Date();
    if (success) {
      instance.tasksCompleted++;
      instance.healthScore = Math.min(1.0, instance.healthScore + 0.05);
    } else {
      instance.healthScore = Math.max(0.0, instance.healthScore - 0.2);
    }
  }

  getMetrics() {
    const instances = Array.from(this.instances.values());
    return {
      totalAgents: instances.length,
      idle: instances.filter((i) => i.status === "idle").length,
      working: instances.filter((i) => i.status === "working").length,
      failed: instances.filter((i) => i.status === "failed").length,
      avgHealth:
        instances.length === 0
          ? 0
          : instances.reduce((sum, i) => sum + i.healthScore, 0) / instances.length,
      totalTasksCompleted: instances.reduce((sum, i) => sum + i.tasksCompleted, 0),
    };
  }
}