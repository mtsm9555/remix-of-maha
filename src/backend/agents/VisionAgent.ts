import { Agent, AgentTask, AgentResult, AgentState } from "../core/orchestrator/AgentOrchestrator";

export class VisionAgent implements Agent {
  id = "vision-agent";
  name = "Vision Agent";
  state = AgentState.IDLE;

  canHandle(task: AgentTask): boolean {
    return task.type === "vision";
  }

  async execute(_task: AgentTask): Promise<AgentResult> {
    return { success: true, data: { analysis: {} } };
  }
}