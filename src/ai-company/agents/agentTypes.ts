export type AgentStatus = "idle" | "working" | "paused" | "failed" | "archived";

export type AgentRole = "planner" | "worker" | "reviewer" | "manager" | "recovery";

export type Agent = {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  skills: string[];
  createdAt: string;
  updatedAt: string;
};