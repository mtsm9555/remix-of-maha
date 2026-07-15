// src/backend/workflows/types.ts

export type NodeType = 'agent_task' | 'tool_call' | 'llm_prompt' | 'condition' | 'memory_save';

export interface WorkflowNode {
  id: string;
  name: string;
  type: NodeType;
  config: Record<string, any>;
}

export interface WorkflowEdge {
  source: string;
  target: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface WorkflowRun {
  id: string;
  workflowId: string;
  userId: string;
  status: RunStatus;
  input: any;
  nodeOutputs: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface WorkflowContext {
  runId: string;
  userId: string;
  input: any;
  nodeOutputs: Record<string, any>;
}