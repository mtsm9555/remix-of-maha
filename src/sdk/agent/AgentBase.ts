import type { AgentManifest, AgentContext, AgentLifecycle, MemoryResult } from "./AgentSDKTypes";

export abstract class AgentBase implements AgentLifecycle {
  protected manifest: AgentManifest;
  protected context: AgentContext | null = null;

  constructor(manifest: AgentManifest) {
    this.manifest = manifest;
  }

  async onInitialize(context: AgentContext): Promise<void> {
    this.context = context;
    context.logger.info(`Agent ${this.manifest.name} initialized`);
  }
  async onTaskStart(taskId: string, context: AgentContext): Promise<void> {
    context.logger.info(`Task ${taskId} started`);
  }
  async onTaskComplete(taskId: string, _result: any, context: AgentContext): Promise<void> {
    context.logger.info(`Task ${taskId} completed`);
  }
  async onTaskFail(taskId: string, error: string, context: AgentContext): Promise<void> {
    context.logger.error(`Task ${taskId} failed: ${error}`);
  }
  async onShutdown(context: AgentContext): Promise<void> {
    context.logger.info(`Agent ${this.manifest.name} shutting down`);
  }

  abstract execute(task: string, context: AgentContext): Promise<any>;

  getManifest(): AgentManifest { return this.manifest; }
  getContext(): AgentContext | null { return this.context; }

  protected buildSystemPrompt(): string {
    const personality = this.manifest.personality;
    let prompt = this.manifest.systemPrompt || `You are ${this.manifest.name}, an AI agent.`;
    if (personality) {
      prompt += `\n\nPersonality:`;
      prompt += `\n- Tone: ${personality.tone}`;
      prompt += `\n- Verbosity: ${personality.verbosity}`;
      prompt += `\n- Proactiveness: ${personality.proactiveness}%`;
      prompt += `\n- Creativity: ${personality.creativity}%`;
    }
    prompt += `\n\nCapabilities:`;
    for (const cap of this.manifest.capabilities) {
      prompt += `\n- ${cap.name}: ${cap.description}`;
    }
    return prompt;
  }

  protected async generate(prompt: string, options?: any): Promise<string> {
    if (!this.context) throw new Error('Agent not initialized');
    return await this.context.llm.generate(prompt, options);
  }

  protected async useTool(toolName: string, args: any): Promise<any> {
    if (!this.context) throw new Error('Agent not initialized');
    return await this.context.tools.execute(toolName, args);
  }

  protected async remember(content: string, scope: 'project' | 'department' | 'user', type: string = 'note'): Promise<void> {
    if (!this.context) throw new Error('Agent not initialized');
    await this.context.memory[scope].store(content, type);
  }

  protected async recall(query: string, scope: 'project' | 'department' | 'user' | 'shared', limit: number = 5): Promise<MemoryResult[]> {
    if (!this.context) throw new Error('Agent not initialized');
    return await this.context.memory[scope].search(query, limit);
  }
}