export type TaskStatus =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "archived";

const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
  pending: ["running", "paused", "failed", "archived"],
  running: ["paused", "completed", "failed", "archived"],
  paused: ["running", "failed", "archived"],
  completed: ["archived"],
  failed: ["pending", "archived"],
  archived: [],
};

export class LifecycleRules {
  canTransition(from: TaskStatus, to: TaskStatus): boolean {
    return allowedTransitions[from].includes(to);
  }

  getAllowedTransitions(from: TaskStatus): TaskStatus[] {
    return allowedTransitions[from];
  }

  assertTransition(from: TaskStatus, to: TaskStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(`Invalid transition: ${from} -> ${to}`);
    }
  }
}