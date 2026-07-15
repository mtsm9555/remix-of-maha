export enum AgentChannel {
  PLANNER = "agent.planner",
  RESEARCH = "agent.research",
  VISION = "agent.vision",
  MEMORY = "agent.memory",
  EXECUTION = "agent.execution",
  SYSTEM = "system.broadcast",
}

export enum EventType {
  TASK_DISPATCHED = "task.dispatched",
  TASK_COMPLETED = "task.completed",
  TOOL_REQUESTED = "tool.requested",
  TOOL_EXECUTED = "tool.executed",
  MEMORY_CONSOLIDATION_TRIGGERED = "memory.consolidation.triggered",
  MEMORY_UPDATED = "memory.updated",
  ERROR_OCCURRED = "system.error",
  USER_INPUT_RECEIVED = "system.user_input",
}

export interface AgentEvent<T = any> {
  id: string;
  type: EventType;
  channel: AgentChannel;
  payload: T;
  timestamp: Date;
  correlationId: string;
  sourceAgent: string;
}

export type EventHandler<T = any> = (event: AgentEvent<T>) => Promise<void> | void;