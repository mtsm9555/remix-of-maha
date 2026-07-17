export type WorkflowType = 'automation' | 'approval' | 'integration' | 'notification' | 'data_processing' | 'custom';
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'error' | 'completed';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type TriggerType = 'event' | 'schedule' | 'manual' | 'webhook' | 'api';
export type StepType = 'agent_task' | 'tool_execution' | 'condition' | 'parallel' | 'delay' | 'notification' | 'custom';

export interface WorkflowManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: WorkflowType;
  category: string;
  tags: string[];
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  maxExecutionTime: number;
  maxRetries: number;
  errorHandling: 'stop' | 'continue' | 'retry';
  requiredPermissions: WorkflowPermission[];
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  eventName?: string;
  eventFilters?: Record<string, any>;
  cronExpression?: string;
  timezone?: string;
  webhookPath?: string;
  webhookSecret?: string;
  isActive: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  execute: (context: WorkflowContext) => Promise<any>;
  config: Record<string, any>;
  nextStepId?: string;
  condition?: WorkflowCondition;
  onError?: 'stop' | 'continue' | 'retry' | 'skip';
  retryCount?: number;
  retryDelayMs?: number;
  description?: string;
  timeoutMs?: number;
}

export interface WorkflowCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'exists';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface WorkflowPermission {
  resource: string;
  level: 'read' | 'write' | 'execute';
  description: string;
}

export interface WorkflowContext {
  workflowId: string;
  executionId: string;
  tenantId: string;
  workspaceId?: string;
  input: Record<string, any>;
  state: Record<string, any>;
  output: Record<string, any>;
  agents: WorkflowAgentAPI;
  tools: WorkflowToolAPI;
  notifications: WorkflowNotificationAPI;
  logger: WorkflowLogger;
  utils: WorkflowUtils;
}

export interface WorkflowAgentAPI {
  execute(agentId: string, task: string, context?: any): Promise<any>;
  createTask(agentId: string, task: any): Promise<string>;
}

export interface WorkflowToolAPI {
  execute(toolName: string, args: any): Promise<any>;
  hasTool(toolName: string): Promise<boolean>;
}

export interface WorkflowNotificationAPI {
  send(userId: string, message: string, metadata?: any): Promise<void>;
  broadcast(message: string, metadata?: any): Promise<void>;
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

export interface WorkflowUtils {
  delay(ms: number): Promise<void>;
  retry<T>(fn: () => Promise<T>, maxRetries: number, delayMs: number): Promise<T>;
  parallel<T>(tasks: Array<() => Promise<T>>): Promise<T[]>;
  transform(data: any, transformer: (data: any) => any): any;
}

export interface WorkflowLogger {
  info(message: string, metadata?: any): void;
  warn(message: string, metadata?: any): void;
  error(message: string, metadata?: any): void;
  debug(message: string, metadata?: any): void;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  tenantId: string;
  status: WorkflowStatus;
  currentStepId?: string;
  startedAt: Date;
  completedAt?: Date;
  input: Record<string, any>;
  output: Record<string, any>;
  state: Record<string, any>;
  stepResults: StepResult[];
  error?: string;
  errorStepId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StepResult {
  stepId: string;
  status: StepStatus;
  result?: any;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs: number;
}

export interface WorkflowRegistration {
  id: string;
  manifest: WorkflowManifest;
  tenantId: string;
  workspaceId?: string;
  status: WorkflowStatus;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}