// src/index.ts

import { AgentRegistry } from "./agents/agentRegistry";
import { TaskStateManager } from "./lifecycle/taskStateManager";
import { MemoryStore } from "./memory/memoryStore";
import { RecoveryQueue } from "./recovery/recoveryQueue";
import { RecoveryManager } from "./recovery/recoveryManager";

const agentRegistry = new AgentRegistry();
const taskManager = new TaskStateManager();
const memoryStore = new MemoryStore();
const recoveryQueue = new RecoveryQueue();

const recoveryManager = new RecoveryManager(
  agentRegistry,
  taskManager,
  memoryStore,
  recoveryQueue
);

agentRegistry.createAgent("agent-1", "Jarvis", "manager", ["coordination"]);
taskManager.createTask("task-1", "Handle failure recovery");

agentRegistry.updateAgentStatus("agent-1", "failed");
taskManager.updateTaskStatus("task-1", "failed");

console.log(
  recoveryManager.reportFailure("agent", "agent-1", "agent_crash", "Agent stopped responding")
);

console.log(
  recoveryManager.reportFailure("task", "task-1", "task_timeout", "Task exceeded execution time")
);

const jobs = recoveryQueue.getAllJobs();
console.log("Recovery Jobs:", jobs);

console.log(recoveryManager.runRecovery(jobs[0].id));
console.log(recoveryManager.runRecovery(jobs[1].id));

console.log("Recovered Agent:", agentRegistry.getAgent("agent-1"));
console.log("Recovered Task:", taskManager.getTask("task-1"));
console.log("Recovery Memories:", memoryStore.getAllMemories());
