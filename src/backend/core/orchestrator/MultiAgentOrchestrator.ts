import { BaseAgent } from "./BaseAgent";
import type { AgentTask } from "./types";
import { MultiAgentExecutor } from "./MultiAgentExecutor";
import { ResultAggregator } from "./ResultAggregator";

export class MultiAgentOrchestrator {
  private executor: MultiAgentExecutor;
  private aggregator = new ResultAggregator();

  constructor(private agents: BaseAgent[]) {
    this.executor = new MultiAgentExecutor(agents);
  }

  getAgents() {
    return this.agents;
  }

  async run(tasks: AgentTask[]) {
    const results = await this.executor.executeTasks(tasks);
    return this.aggregator.aggregate(results);
  }
}