// src/storage/persistenceManager.ts

import { FileStorage } from "./fileStorage";
import { AgentRegistry } from "../agents/agentRegistry";
import { TaskStateManager } from "../lifecycle/taskStateManager";
import { MemoryStore } from "../memory/memoryStore";
import { AuditLog } from "../audit/auditLog";
import { Orchestrator } from "../orchestrator/orchestrator";
import { StorageSnapshot } from "./storageTypes";

export class PersistenceManager {
  constructor(
    private storage: FileStorage,
    private agentRegistry: AgentRegistry,
    private taskManager: TaskStateManager,
    private memoryStore: MemoryStore,
    private auditLog: AuditLog,
    private orchestrator: Orchestrator
  ) {}

  saveAll(): void {
    const snapshot: StorageSnapshot = {
      agents: this.agentRegistry.getAllAgents(),
      tasks: this.taskManager.getAllTasks(),
      goals: this.orchestrator.getAllGoals(),
      subtasks: this.orchestrator.getAllGoals().flatMap((g) =>
        this.orchestrator.getSubTasksByGoal(g.id)
      ),
      memories: this.memoryStore.getAllMemories(),
      audits: this.auditLog.getAllEvents(),
      recoveryJobs: [],
      savedAt: new Date().toISOString(),
    };

    this.storage.save(snapshot);
  }

  loadAll(): StorageSnapshot | null {
    return this.storage.load();
  }
}
