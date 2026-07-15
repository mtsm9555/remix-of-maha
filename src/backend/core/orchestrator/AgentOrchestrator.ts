// Browser-safe orchestrator (no Node "events" dependency)

export enum AgentState {
  IDLE = "IDLE",
  RUNNING = "RUNNING",
  WAITING = "WAITING",
  FAILED = "FAILED",
  COMPLETE = "COMPLETE",
}

export interface AgentTask {
  id: string;
  type: string;
  payload: any;
  createdAt: Date;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface Agent {
  id: string;
  name: string;
  state: AgentState;
  canHandle(task: AgentTask): boolean;
  execute(task: AgentTask): Promise<AgentResult>;
}

export interface ExecutionContext {
  taskId: string;
  assignedAgent: string;
  startedAt: Date;
}

type Listener = (payload?: any) => void;

export class AgentOrchestrator {
  private agents: Agent[] = [];
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, payload?: any) {
    this.listeners.get(event)?.forEach((l) => l(payload));
  }

  registerAgent(agent: Agent) {
    this.agents.push(agent);
    this.emit("agent_registered", { id: agent.id, name: agent.name });
  }

  getAgents() {
    return this.agents;
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const agent = this.findAgent(task);
    if (!agent) {
      return { success: false, error: `No agent found for task ${task.type}` };
    }

    const context: ExecutionContext = {
      taskId: task.id,
      assignedAgent: agent.name,
      startedAt: new Date(),
    };

    this.emit("task_started", context);

    try {
      agent.state = AgentState.RUNNING;
      const result = await agent.execute(task);
      agent.state = AgentState.COMPLETE;
      this.emit("task_completed", { ...context, result });
      return result;
    } catch (error: any) {
      agent.state = AgentState.FAILED;
      this.emit("task_failed", { ...context, error: error.message });
      return { success: false, error: error.message };
    }
  }

  private findAgent(task: AgentTask): Agent | undefined {
    return this.agents.find((agent) => agent.canHandle(task));
  }
}