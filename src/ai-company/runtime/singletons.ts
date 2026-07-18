import { AgentRegistry } from "../agents/agentRegistry";
import { TaskStateManager } from "../lifecycle/taskStateManager";
import { AuditLog } from "../audit/auditLog";
import { MemoryStore } from "../memory/memoryStore";
import { RecoveryQueue } from "../recovery/recoveryQueue";
import { RecoveryManager } from "../recovery/recoveryManager";
import { Orchestrator } from "../orchestrator/orchestrator";
import { ReasoningEngine } from "../reasoning/reasoningEngine";
import { ReasoningMemory } from "../reasoning/reasoningMemory";
import { ReasoningManager } from "../reasoning/reasoningManager";

export const agentRegistry = new AgentRegistry();
export const taskManager = new TaskStateManager();
export const auditLog = new AuditLog();
export const memoryStore = new MemoryStore();
export const recoveryQueue = new RecoveryQueue();

export const recoveryManager = new RecoveryManager(
  agentRegistry,
  taskManager,
  memoryStore,
  recoveryQueue,
);

export const orchestrator = new Orchestrator(
  agentRegistry,
  taskManager,
  auditLog,
  recoveryManager,
);

export const reasoningEngine = new ReasoningEngine();
export const reasoningMemory = new ReasoningMemory();
export const reasoningManager = new ReasoningManager(reasoningEngine, reasoningMemory);