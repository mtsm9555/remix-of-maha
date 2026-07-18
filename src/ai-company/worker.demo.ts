// src/index.ts

import { AgentRegistry } from "./agents/agentRegistry";
import { TaskStateManager } from "./lifecycle/taskStateManager";
import { MemoryStore } from "./memory/memoryStore";
import { AuditLog } from "./audit/auditLog";
import { RecoveryQueue } from "./recovery/recoveryQueue";
import { RecoveryManager } from "./recovery/recoveryManager";
import { Orchestrator } from "./orchestrator/orchestrator";
import { FileStorage } from "./storage/fileStorage";
import { PersistenceManager } from "./storage/persistenceManager";
import { WorkerLoop } from "./worker/workerLoop";

const agentRegistry = new AgentRegistry();
const taskManager = new TaskStateManager();
const memoryStore = new MemoryStore();
const auditLog = new AuditLog();
const recoveryQueue = new RecoveryQueue();

const recoveryManager = new RecoveryManager(
  agentRegistry,
  taskManager,
  memoryStore,
  recoveryQueue
);

const orchestrator = new Orchestrator(
  agentRegistry,
  taskManager,
  auditLog,
  recoveryManager
);

const storage = new FileStorage("./data/company-state.json");
const persistenceManager = new PersistenceManager(
  storage,
  agentRegistry,
  taskManager,
  memoryStore,
  auditLog,
  orchestrator
);

const workerLoop = new WorkerLoop(
  orchestrator,
  agentRegistry,
  taskManager,
  auditLog
);

agentRegistry.createAgent("agent-1", "Jarvis", "manager", ["coordination"]);
agentRegistry.createAgent("agent-2", "WorkerOne", "worker", ["research"]);

const goal = orchestrator.createGoal(
  "goal-1",
  "Build AI support system",
  "Create a working AI company workflow"
);

const subtasks = orchestrator.planGoal(goal.id, [
  "Research user needs",
  "Design workflow",
  "Implement API",
]);

workerLoop.start(3000);

setTimeout(() => {
  persistenceManager.saveAll();
  console.log("Saved state to disk");
  console.log(orchestrator.getGoal(goal.id));
  console.log(auditLog.getAllEvents());
  workerLoop.stop();
}, 10000);
