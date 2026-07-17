export type TaskStatus = "pending" | "running" | "paused" | "completed" | "failed" | "archived";

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export class TaskStateManager {
  private tasks: Map<string, Task> = new Map();

  createTask(id: string, title: string, description?: string): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id,
      title,
      description,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(id, task);
    return task;
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  updateTaskStatus(id: string, nextStatus: TaskStatus): Task {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }
    task.status = nextStatus;
    task.updatedAt = new Date().toISOString();
    this.tasks.set(id, task);
    return task;
  }

  archiveTask(id: string): Task {
    return this.updateTaskStatus(id, "archived");
  }

  deleteTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  clearCompleted(): number {
    const before = this.tasks.size;
    for (const [id, task] of this.tasks.entries()) {
      if (task.status === "completed" || task.status === "archived") {
        this.tasks.delete(id);
      }
    }
    return before - this.tasks.size;
  }
}