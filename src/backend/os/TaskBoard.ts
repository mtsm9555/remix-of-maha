export type TaskStatus =
  | "backlog"
  | "assigned"
  | "in_progress"
  | "in_review"
  | "completed"
  | "failed";

export interface DepartmentTask {
  id: string;
  milestoneId: string;
  description: string;
  successCriteria: string[];
  status: TaskStatus;
  assignedAgentId?: string;
  agentInstanceId?: string;
  attempts: number;
  maxAttempts: number;
  output?: any;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TaskBoard {
  private tasks: Map<string, DepartmentTask> = new Map();

  addTask(
    task: Omit<DepartmentTask, "id" | "status" | "attempts" | "createdAt" | "updatedAt">,
  ): DepartmentTask {
    const fullTask: DepartmentTask = {
      ...task,
      id: `task_${crypto.randomUUID()}`,
      status: "backlog",
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(fullTask.id, fullTask);
    return fullTask;
  }

  getNextBacklogTask(): DepartmentTask | null {
    for (const task of this.tasks.values()) {
      if (task.status === "backlog") return task;
    }
    return null;
  }

  updateStatus(taskId: string, status: TaskStatus, updates: Partial<DepartmentTask> = {}) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      task.updatedAt = new Date();
      Object.assign(task, updates);
    }
  }

  getTasksByStatus(status: TaskStatus): DepartmentTask[] {
    return Array.from(this.tasks.values()).filter((t) => t.status === status);
  }

  getMetrics() {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      backlog: tasks.filter((t) => t.status === "backlog").length,
      inProgress: tasks.filter((t) => t.status === "in_progress" || t.status === "assigned").length,
      inReview: tasks.filter((t) => t.status === "in_review").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      failed: tasks.filter((t) => t.status === "failed").length,
    };
  }

  getAllTasks(): DepartmentTask[] {
    return Array.from(this.tasks.values());
  }
}