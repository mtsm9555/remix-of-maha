import { Agent, AgentTask, AgentResult, AgentState } from "../core/orchestrator/AgentOrchestrator";

export class PlannerAgent implements Agent {
  id = "planner-agent";
  name = "Planner Agent";
  state = AgentState.IDLE;

  canHandle(task: AgentTask): boolean {
    return task.type === "planning";
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const goal = task.payload?.goal;
    return {
      success: true,
      data: {
        goal,
        plan: [
          { step: 1, action: "research" },
          { step: 2, action: "analyze" },
          { step: 3, action: "summarize" },
        ],
      },
    };
  }
}