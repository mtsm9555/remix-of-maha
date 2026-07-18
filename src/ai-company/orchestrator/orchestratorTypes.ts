// src/orchestrator/orchestratorTypes.ts

export type GoalStatus = "new" | "planned" | "running" | "completed" | "failed";

export type Goal = {
  id: string;
  title: string;
  description: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
};

export type SubTask = {
  id: string;
  goalId: string;
  title: string;
  description: string;
  assignedAgentId?: string;
  status: "pending" | "assigned" | "running" | "done" | "failed";
  createdAt: string;
  updatedAt: string;
};
