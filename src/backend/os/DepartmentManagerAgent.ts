import { AgentPool, type AgentInstance } from "./AgentPool";
import { TaskBoard, type DepartmentTask } from "./TaskBoard";
import { QualityAssurance, type QAResult } from "./QualityAssurance";
import { DepartmentManager } from "./DepartmentManager";
import { osGenerate } from "./llm";
import { OSContextBuilder } from "./context/ContextBuilder";
import type { OSMilestone } from "./types";
import type { Department, DepartmentAgent } from "../agents/departments/types";

export class DepartmentManagerAgent {
  private departmentId: Department;
  private pool: AgentPool;
  private taskBoard: TaskBoard;
  private isProcessing: boolean = false;

  constructor(departmentId: Department, agents: DepartmentAgent[]) {
    this.departmentId = departmentId;
    this.pool = new AgentPool(departmentId, agents);
    this.taskBoard = new TaskBoard();
  }

  async executeMilestone(milestone: OSMilestone): Promise<{ success: boolean; report: string }> {
    if (this.isProcessing) {
      throw new Error(`[Manager: ${this.departmentId}] Already processing a milestone.`);
    }
    this.isProcessing = true;
    console.log(`🏢 [Manager: ${this.departmentId}] Milestone: "${milestone.objective}"`);
    try {
      const tasks = await this.decomposeMilestone(milestone);
      tasks.forEach((t) => this.taskBoard.addTask(t));
      await this.processTaskBoard();
      const report = await this.generateFinalReport(milestone);
      DepartmentManager.updateKPI(
        this.departmentId,
        "Tasks Completed",
        this.taskBoard.getMetrics().completed,
      );
      return { success: true, report };
    } catch (error: any) {
      console.error(`[Manager: ${this.departmentId}] Milestone failed:`, error.message);
      return { success: false, report: `Failed: ${error.message}` };
    } finally {
      this.isProcessing = false;
    }
  }

  private async processTaskBoard() {
    let guard = 0;
    while (
      (this.taskBoard.getMetrics().backlog > 0 ||
        this.taskBoard.getMetrics().inProgress > 0 ||
        this.taskBoard.getTasksByStatus("in_review").length > 0) &&
      guard++ < 200
    ) {
      await this.assignBacklogTasks();
      await this.reviewTasksInQA();
      await this.handleFailedTasks();
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  private async assignBacklogTasks() {
    let task = this.taskBoard.getNextBacklogTask();
    while (task) {
      const agentInstance = this.pool.getAvailableAgent();
      if (!agentInstance) break;
      const budgetCheck = DepartmentManager.canExecuteTask(this.departmentId, 0.1);
      if (!budgetCheck.allowed) {
        this.taskBoard.updateStatus(task.id, "failed", { reviewNotes: budgetCheck.reason });
        task = this.taskBoard.getNextBacklogTask();
        continue;
      }
      this.pool.assignTask(agentInstance.id, task.id);
      this.taskBoard.updateStatus(task.id, "in_progress", {
        assignedAgentId: agentInstance.agent.id,
        agentInstanceId: agentInstance.id,
      });
      void this.executeAgentTask(agentInstance, task);
      task = this.taskBoard.getNextBacklogTask();
    }
  }

  private async executeAgentTask(instance: AgentInstance, task: DepartmentTask) {
    try {
      const context = await OSContextBuilder.build({
        userId: "system",
        sessionId: task.milestoneId,
        currentTask: task.description,
        actorDepartment: this.departmentId,
        actorAgentId: instance.agent.id,
        maxTokens: 4000,
      });
      const result = await instance.agent.executeTask(task.description, {
        department: this.departmentId,
        osContext: context.assembledPrompt,
        milestoneContext: true,
      });
      this.taskBoard.updateStatus(task.id, "in_review", { output: result });
      this.pool.completeTask(instance.id, true);
    } catch (error: any) {
      this.taskBoard.updateStatus(task.id, "failed", { reviewNotes: error.message });
      this.pool.completeTask(instance.id, false);
    }
  }

  private async reviewTasksInQA() {
    const tasksInReview = this.taskBoard.getTasksByStatus("in_review");
    for (const task of tasksInReview) {
      const qaResult: QAResult = await QualityAssurance.reviewTask(task, task.output);
      if (qaResult.passed) {
        this.taskBoard.updateStatus(task.id, "completed", { reviewNotes: qaResult.feedback });
      } else if (task.attempts < task.maxAttempts) {
        this.taskBoard.updateStatus(task.id, "backlog", {
          attempts: task.attempts + 1,
          description: `${task.description}\n\n[REVISION REQUIRED: ${qaResult.feedback}]`,
        });
      } else {
        this.taskBoard.updateStatus(task.id, "failed", {
          reviewNotes: `QA Failed after max attempts: ${qaResult.feedback}`,
        });
      }
    }
  }

  private async handleFailedTasks() {
    const failed = this.taskBoard.getTasksByStatus("failed");
    if (failed.length > 0) {
      console.warn(`[Manager: ${this.departmentId}] ${failed.length} tasks failed permanently.`);
    }
  }

  private async decomposeMilestone(
    milestone: OSMilestone,
  ): Promise<Omit<DepartmentTask, "id" | "status" | "attempts" | "createdAt" | "updatedAt">[]> {
    const prompt = `You are the Manager of the ${this.departmentId} department.
Objective: "${milestone.objective}"
Success Criteria: ${milestone.successCriteria.join(", ")}
Break this into micro-tasks. Output JSON: { "tasks": [{ "description": "...", "successCriteria": ["..."] }] }`;
    const response = await osGenerate(prompt, { responseFormat: "json" });
    let parsed: any = {};
    try {
      parsed = JSON.parse(response.content);
    } catch {
      parsed = {
        tasks: [{ description: milestone.objective, successCriteria: milestone.successCriteria }],
      };
    }
    const list: any[] = Array.isArray(parsed) ? parsed : (parsed.tasks ?? []);
    return list.map((t: any) => ({
      milestoneId: milestone.id,
      description: t.description,
      successCriteria: t.successCriteria || milestone.successCriteria,
      maxAttempts: 2,
    }));
  }

  private async generateFinalReport(milestone: OSMilestone): Promise<string> {
    const metrics = this.taskBoard.getMetrics();
    const prompt = `You are the Manager of the ${this.departmentId} department.
Milestone: "${milestone.objective}"
Stats: ${metrics.completed} completed, ${metrics.failed} failed.
Write a brief executive summary.`;
    const response = await osGenerate(prompt);
    return response.content;
  }

  getTaskBoardMetrics() {
    return this.taskBoard.getMetrics();
  }
  getPoolMetrics() {
    return this.pool.getMetrics();
  }
  getTaskBoardDetails() {
    return this.taskBoard.getAllTasks();
  }
}