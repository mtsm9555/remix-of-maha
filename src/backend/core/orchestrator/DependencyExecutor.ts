import type { AgentTask } from "./types";

export class DependencyExecutor {
  canRun(task: AgentTask, completed: Set<string>) {
    if (!task.dependencies || task.dependencies.length === 0) return true;
    return task.dependencies.every((dep) => completed.has(dep));
  }
}