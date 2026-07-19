export type TaskStatus = "todo" | "in-progress" | "completed";
export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  createdAt: number;
  dueDate?: number;
}

export interface Goal {
  id: string;
  title: string;
  progress: number;
}