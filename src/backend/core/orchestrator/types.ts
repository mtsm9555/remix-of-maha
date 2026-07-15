export type AgentStatus =
  | "IDLE"
  | "RUNNING"
  | "WAITING"
  | "FAILED"
  | "COMPLETE";

export interface AgentTask {
  id: string;
  type: string;
  payload: any;
  dependencies?: string[];
}

export interface AgentResult {
  taskId: string;
  agent: string;
  success: boolean;
  data?: any;
  error?: string;
}