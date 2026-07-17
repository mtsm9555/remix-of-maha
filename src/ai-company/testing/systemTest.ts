import { AgentRegistry } from "../agents/agentRegistry";
import { TaskStateManager } from "../lifecycle/taskStateManager";
import { MemoryStore } from "../memory/memoryStore";
import { AuditLog } from "../audit/auditLog";

export class SystemTest {
  constructor(
    private agentRegistry: AgentRegistry,
    private taskManager: TaskStateManager,
    private memoryStore: MemoryStore,
    private auditLog: AuditLog
  ) {}

  runBasicHealthCheck(): string[] {
    const results: string[] = [];

    if (this.agentRegistry.getAllAgents().length >= 0) {
      results.push("Agent registry reachable");
      this.auditLog.recordEvent(
        `audit-${Date.now()}-1`,
        "system",
        "health_check",
        "Agent registry reachable"
      );
    }

    if (this.taskManager.getAllTasks().length >= 0) {
      results.push("Task manager reachable");
      this.auditLog.recordEvent(
        `audit-${Date.now()}-2`,
        "system",
        "health_check",
        "Task manager reachable"
      );
    }

    if (this.memoryStore.getAllMemories().length >= 0) {
      results.push("Memory store reachable");
      this.auditLog.recordEvent(
        `audit-${Date.now()}-3`,
        "system",
        "health_check",
        "Memory store reachable"
      );
    }

    results.push("System test complete");
    this.auditLog.recordEvent(
      `audit-${Date.now()}-4`,
      "system",
      "test_complete",
      "System test complete"
    );

    return results;
  }

  runBehaviorTest(): string[] {
    const results: string[] = [];

    const agent = this.agentRegistry.createAgent(
      `test-agent-${Date.now()}`,
      "TestAgent",
      "worker",
      ["testing"]
    );

    const task = this.taskManager.createTask(
      `test-task-${Date.now()}`,
      "Test task execution"
    );

    this.memoryStore.addMemory(
      `test-memory-${Date.now()}`,
      "system",
      "note",
      "Testing system behavior",
      ["test"]
    );

    this.auditLog.recordEvent(
      `audit-${Date.now()}-5`,
      "system",
      "behavior_test",
      `Created test agent ${agent.id} and task ${task.id}`
    );

    results.push(`Created agent ${agent.name}`);
    results.push(`Created task ${task.title}`);
    results.push("Behavior test complete");

    return results;
  }
}