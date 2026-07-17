// src/manager/secureManager.ts

import { AgentRegistry } from "../agents/agentRegistry";
import { TaskStateManager } from "../lifecycle/taskStateManager";
import { PermissionManager, Role } from "../security/permissionManager";
import { ReviewQueue } from "../review/reviewQueue";

export class SecureManager {
  constructor(
    private agentRegistry: AgentRegistry,
    private taskManager: TaskStateManager,
    private permissionManager: PermissionManager,
    private reviewQueue: ReviewQueue
  ) {}

  requestTaskAssignment(
    requesterId: string,
    requesterRole: Role,
    agentId: string,
    taskId: string
  ): string {
    this.permissionManager.assertPermission(requesterRole, "assign_task");

    const agent = this.agentRegistry.getAgent(agentId);
    const task = this.taskManager.getTask(taskId);

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    this.reviewQueue.submitReview(
      `review-${Date.now()}`,
      "agent_action",
      `${agentId}:${taskId}`,
      requesterId,
      `Assign task "${task.title}" to agent "${agent.name}"`
    );

    return `Assignment request submitted for review`;
  }

  approveAndAssign(agentId: string, taskId: string): string {
    const agent = this.agentRegistry.getAgent(agentId);
    const task = this.taskManager.getTask(taskId);

    if (!agent || !task) {
      throw new Error("Agent or task not found");
    }

    this.agentRegistry.updateAgentStatus(agentId, "working");
    this.taskManager.updateTaskStatus(taskId, "running");

    return `Approved and assigned "${task.title}" to "${agent.name}"`;
  }
}
