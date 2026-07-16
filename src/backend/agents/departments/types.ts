export type Department =
  | "development"
  | "marketing"
  | "sales"
  | "design"
  | "operations"
  | "research"
  | "support"
  | "finance"
  | "hr";

export type AgentStatus = "idle" | "working" | "completed" | "failed";

export interface DepartmentAgent {
  id: string;
  name: string;
  department: Department;
  role: string;
  goal: string;
  status: AgentStatus;
  currentTask?: string;
  tools: string[];
  memory: AgentMemory;
  events: AgentEvent[];
  createdAt: Date;
  lastActiveAt: Date;
  executeTask(task: string, context?: Record<string, any>): Promise<any>;
  getStatus(): {
    id: string;
    name: string;
    department: Department;
    role: string;
    status: AgentStatus;
    currentTask?: string;
    lastActiveAt: Date;
    eventCount: number;
  };
}

export interface AgentMemory {
  shortTerm: any[];
  longTerm: string[];
  context: Record<string, any>;
}

export interface AgentEvent {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
}

export interface DepartmentConfig {
  name: Department;
  displayName: string;
  description: string;
  agents: string[];
  tools: string[];
  workflows: string[];
}