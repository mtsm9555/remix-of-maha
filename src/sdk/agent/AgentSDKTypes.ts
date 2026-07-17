export type AgentType = 'assistant' | 'specialist' | 'coordinator' | 'analyst' | 'creator' | 'custom';
export type AgentStatus = 'idle' | 'working' | 'waiting' | 'error' | 'offline';
export type MemoryAccessLevel = 'none' | 'read' | 'write' | 'full';

export interface AgentManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: AgentType;
  category: string;
  tags: string[];
  capabilities: AgentCapability[];
  requiredTools: string[];
  requiredPermissions: AgentPermission[];
  memoryAccess: {
    project: MemoryAccessLevel;
    department: MemoryAccessLevel;
    user: MemoryAccessLevel;
    shared: MemoryAccessLevel;
  };
  systemPrompt?: string;
  personality?: AgentPersonality;
  maxConcurrentTasks: number;
  budgetLimitUSD?: number;
  icon?: string;
  homepage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentCapability {
  name: string;
  description: string;
  category: 'reasoning' | 'creation' | 'analysis' | 'communication' | 'integration';
}

export interface AgentPermission {
  resource: string;
  level: 'read' | 'write' | 'execute' | 'admin';
  description: string;
}

export interface AgentPersonality {
  tone: 'formal' | 'casual' | 'technical' | 'friendly' | 'professional';
  verbosity: 'concise' | 'balanced' | 'detailed';
  proactiveness: number;
  creativity: number;
}

export interface AgentContext {
  agentId: string;
  tenantId: string;
  workspaceId?: string;
  llm: AgentLLMAPI;
  tools: AgentToolAPI;
  memory: AgentMemoryAPI;
  tasks: AgentTaskAPI;
  communication: AgentCommunicationAPI;
  state: AgentState;
  config: Record<string, any>;
  logger: AgentLogger;
}

export interface AgentLLMAPI {
  generate(prompt: string, options?: LLMOptions): Promise<string>;
  chat(messages: ChatMessage[], options?: LLMOptions): Promise<string>;
  embed(text: string): Promise<number[]>;
  analyze(text: string, task: 'sentiment' | 'summary' | 'classification' | 'extraction'): Promise<any>;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  responseFormat?: 'text' | 'json';
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface AgentToolAPI {
  list(): Promise<ToolInfo[]>;
  execute(toolName: string, args: any): Promise<any>;
  hasTool(toolName: string): Promise<boolean>;
}

export interface ToolInfo {
  name: string;
  description: string;
  parameters: Record<string, any>;
  category: string;
}

export interface MemoryScopeAPI {
  store(content: string, type: string, metadata?: any): Promise<void>;
  search(query: string, limit?: number): Promise<MemoryResult[]>;
  getRecent(limit?: number): Promise<MemoryResult[]>;
}

export interface AgentMemoryAPI {
  project: MemoryScopeAPI;
  department: MemoryScopeAPI;
  user: MemoryScopeAPI;
  shared: { search(query: string, limit?: number): Promise<MemoryResult[]> };
}

export interface MemoryResult {
  id: string;
  content: string;
  type: string;
  relevanceScore: number;
  metadata: any;
  createdAt: Date;
}

export interface AgentTaskAPI {
  create(task: TaskDefinition): Promise<string>;
  update(taskId: string, updates: Partial<TaskDefinition>): Promise<void>;
  complete(taskId: string, result?: any): Promise<void>;
  fail(taskId: string, error: string): Promise<void>;
  get(taskId: string): Promise<TaskDefinition>;
  list(filters?: any): Promise<TaskDefinition[]>;
}

export interface TaskDefinition {
  id?: string;
  title: string;
  description?: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  projectId?: string;
  dueDate?: Date;
  estimatedHours?: number;
  metadata?: Record<string, any>;
}

export interface AgentCommunicationAPI {
  sendMessage(agentId: string, message: AgentMessage): Promise<void>;
  broadcast(message: AgentMessage): Promise<void>;
  onMessage(handler: (message: AgentMessage) => void): void;
  requestHelp(task: string, context?: any): Promise<AgentMessage>;
}

export interface AgentMessage {
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification' | 'help';
  content: string;
  metadata?: any;
  timestamp: Date;
}

export interface AgentState {
  currentTask?: string;
  conversationHistory: ChatMessage[];
  workingMemory: Record<string, any>;
  metrics: {
    tasksCompleted: number;
    tokensUsed: number;
    costUSD: number;
    activeTime: number;
  };
}

export interface AgentLogger {
  info(message: string, metadata?: any): void;
  warn(message: string, metadata?: any): void;
  error(message: string, metadata?: any): void;
  debug(message: string, metadata?: any): void;
}

export interface AgentLifecycle {
  onInitialize?(context: AgentContext): Promise<void>;
  onTaskStart?(taskId: string, context: AgentContext): Promise<void>;
  onTaskComplete?(taskId: string, result: any, context: AgentContext): Promise<void>;
  onTaskFail?(taskId: string, error: string, context: AgentContext): Promise<void>;
  onShutdown?(context: AgentContext): Promise<void>;
}

export interface AgentRegistration {
  id: string;
  manifest: AgentManifest;
  tenantId: string;
  workspaceId?: string;
  status: AgentStatus;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}