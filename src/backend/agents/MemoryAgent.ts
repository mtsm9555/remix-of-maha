import { Agent, AgentTask, AgentResult, AgentState } from "../core/orchestrator/AgentOrchestrator";

export class MemoryAgent implements Agent {
  id = "memory-agent";
  name = "Memory Agent";
  state = AgentState.IDLE;

  canHandle(task: AgentTask): boolean {
    return task.type === "memory";
  }

  async execute(_task: AgentTask): Promise<AgentResult> {
    return { success: true, data: { stored: true } };
  }
}