import type { AgentTask, AgentResult, AgentStatus } from "./types";

export abstract class BaseAgent {
  abstract id: string;
  abstract name: string;
  status: AgentStatus = "IDLE";

  abstract canHandle(task: AgentTask): boolean;
  abstract execute(task: AgentTask): Promise<AgentResult>;
}