import { AgentRegistry } from "../agents/agentRegistry";
import { TaskStateManager } from "../lifecycle/taskStateManager";

export class ManagerLayer {
  constructor(
    private agentRegistry: AgentRegistry,
    private taskManager: TaskStateManager,
  ) {}

  createWorkload(agentId: string, taskId: string): string {
    const agent = this.agentRegistry.getAgent(agentId);
    const task = this.taskManager.getTask(taskId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    if (agent.status === "archived") {
      throw new Error(`Archived agent cannot receive work: ${agentId}`);
    }
    this.agentRegistry.updateAgentStatus(agentId, "working");
    this.taskManager.updateTaskStatus(taskId, "running");
    return `Assigned task "${task.title}" to agent "${agent.name}"`;
  }

  pauseWork(agentId: string, taskId: string): string {
    this.agentRegistry.updateAgentStatus(agentId, "paused");
    this.taskManager.updateTaskStatus(taskId, "paused");
    return `Paused work for agent ${agentId} and task ${taskId}`;
  }

  finishWork(agentId: string, taskId: string): string {
    this.agentRegistry.updateAgentStatus(agentId, "idle");
    this.taskManager.updateTaskStatus(taskId, "completed");
    return `Completed work for agent ${agentId} and task ${taskId}`;
  }

  failWork(agentId: string, taskId: string): string {
    this.agentRegistry.updateAgentStatus(agentId, "failed");
    this.taskManager.updateTaskStatus(taskId, "failed");
    return `Marked work as failed for agent ${agentId} and task ${taskId}`;
  }
}