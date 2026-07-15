import { Agent, AgentTask, AgentResult, AgentState } from "../core/orchestrator/AgentOrchestrator";

export class ExecutionAgent implements Agent {
  id = "execution-agent";
  name = "Execution Agent";
  state = AgentState.IDLE;

  canHandle(task: AgentTask): boolean {
    return task.type === "execution";
  }

  async execute(_task: AgentTask): Promise<AgentResult> {
    return { success: true, data: { executed: true } };
  }
}