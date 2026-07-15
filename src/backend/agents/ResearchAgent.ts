import { Agent, AgentTask, AgentResult, AgentState } from "../core/orchestrator/AgentOrchestrator";

export class ResearchAgent implements Agent {
  id = "research-agent";
  name = "Research Agent";
  state = AgentState.IDLE;

  canHandle(task: AgentTask): boolean {
    return task.type === "research";
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    return { success: true, data: { query: task.payload?.query, findings: [] } };
  }
}