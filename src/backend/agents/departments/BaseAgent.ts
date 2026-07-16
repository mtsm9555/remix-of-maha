import type { Department, DepartmentAgent, AgentStatus, AgentMemory, AgentEvent } from "./types";
import { globalEventBus } from "../../events/EventBus";
import { AgentChannel, EventType } from "../../events/types";
import { generateText } from "ai";

export abstract class BaseAgent implements DepartmentAgent {
  id: string;
  name: string;
  department: Department;
  role: string;
  goal: string;
  status: AgentStatus = "idle";
  currentTask?: string;
  tools: string[];
  memory: AgentMemory;
  events: AgentEvent[] = [];
  createdAt: Date;
  lastActiveAt: Date;

  constructor(config: {
    id: string;
    name: string;
    department: Department;
    role: string;
    goal: string;
    tools: string[];
  }) {
    this.id = config.id;
    this.name = config.name;
    this.department = config.department;
    this.role = config.role;
    this.goal = config.goal;
    this.tools = config.tools;
    this.memory = { shortTerm: [], longTerm: [], context: {} };
    this.createdAt = new Date();
    this.lastActiveAt = new Date();
  }

  async executeTask(task: string, context: Record<string, any> = {}): Promise<any> {
    console.log(`[${this.name}] Starting task: ${task}`);
    this.status = "working";
    this.currentTask = task;
    this.lastActiveAt = new Date();

    try {
      const prompt = this.buildPrompt(task, context);
      const apiKey = process.env.LOVABLE_API_KEY;
      if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured on the server.");

      const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
      const gateway = createLovableAiGatewayProvider(apiKey);

      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        prompt,
        temperature: 0.7,
      });

      const result = await this.processResponse(text ?? "", context);

      this.status = "completed";
      this.currentTask = undefined;
      this.lastActiveAt = new Date();
      this.logEvent("task.completed", { task, result });

      await globalEventBus.publish({
        id: crypto.randomUUID(),
        type: EventType.TASK_COMPLETED,
        channel: AgentChannel.SYSTEM,
        payload: {
          agentId: this.id,
          agentName: this.name,
          department: this.department,
          task,
          result,
        },
        timestamp: new Date(),
        correlationId: context.correlationId || crypto.randomUUID(),
        sourceAgent: this.name,
      });

      console.log(`[${this.name}] Task completed successfully`);
      return result;
    } catch (error: any) {
      this.status = "failed";
      this.logEvent("task.failed", { task, error: error?.message ?? String(error) });
      console.error(`[${this.name}] Task failed:`, error);
      throw error;
    }
  }

  protected abstract buildPrompt(task: string, context: Record<string, any>): string;
  protected abstract processResponse(response: string, context: Record<string, any>): Promise<any>;

  protected logEvent(type: string, payload: any) {
    this.events.push({ id: crypto.randomUUID(), type, payload, timestamp: new Date() });
    if (this.events.length > 100) this.events = this.events.slice(-100);
  }

  getStatus() {
    return {
      id: this.id,
      name: this.name,
      department: this.department,
      role: this.role,
      status: this.status,
      currentTask: this.currentTask,
      lastActiveAt: this.lastActiveAt,
      eventCount: this.events.length,
    };
  }
}