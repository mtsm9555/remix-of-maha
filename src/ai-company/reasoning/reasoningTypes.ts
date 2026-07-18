// src/reasoning/reasoningTypes.ts

export type ReasoningStepType =
  | "understand_goal"
  | "breakdown"
  | "tool_choice"
  | "plan"
  | "reflection"
  | "final";

export type ReasoningStep = {
  id: string;
  type: ReasoningStepType;
  content: string;
  createdAt: string;
};

export type ReasoningInput = {
  agentId: string;
  goal: string;
  context?: Record<string, any>;
};

export type ReasoningOutput = {
  agentId: string;
  goal: string;
  steps: ReasoningStep[];
  summary: string;
  createdAt: string;
};
