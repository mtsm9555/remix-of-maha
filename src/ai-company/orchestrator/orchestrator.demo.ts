// src/index.ts

import { AgentRegistry } from "../agents/agentRegistry";
import { TaskStateManager } from "../lifecycle/taskStateManager";
import { AuditLog } from "../audit/auditLog";
import { MemoryStore } from "../memory/memoryStore";
import { RecoveryQueue } from "../recovery/recoveryQueue";
import { RecoveryManager } from "../recovery/recoveryManager";
import { Orchestrator } from "./orchestrator";

const agentRegistry = new AgentRegistry();
const taskManager = new TaskStateManager();
const auditLog = new AuditLog();
const memoryStore = new MemoryStore();
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

orchestrator.assignSubTask(subtasks[0].id, "agent-2");
orchestrator.startExecution(goal.id);

orchestrator.completeSubTask(subtasks[0].id);
orchestrator.completeSubTask(subtasks[1].id);
orchestrator.completeSubTask(subtasks[2].id);

console.log(orchestrator.finishGoal(goal.id));
console.log(orchestrator.getGoal(goal.id));
console.log(orchestrator.getSubTasksByGoal(goal.id));
console.log(auditLog.getAllEvents());
