import { TaskStateManager } from "./taskStateManager";

export function runTaskStateManagerDemo() {
  const manager = new TaskStateManager();

  const task = manager.createTask("task-1", "Build AI company skeleton", "Create the first project structure");
  console.log("Created:", task);

  const updated = manager.updateTaskStatus("task-1", "running");
  console.log("Updated:", updated);

  console.log("All Tasks:", manager.getAllTasks());

  return manager.getAllTasks();
}