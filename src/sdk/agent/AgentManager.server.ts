import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { AgentManifest, AgentContext, AgentRegistration } from "./AgentSDKTypes";
import { AgentBase } from "./AgentBase";
import { AgentAPIClient } from "./AgentAPIClient.server";
import { AgentLoggerImpl } from "./AgentLogger.server";

export class AgentManager {
  private agents = new Map<string, AgentBase>();

  async registerAgent(
    manifest: AgentManifest,
    agentClass: new (manifest: AgentManifest) => AgentBase,
    tenantId: string,
    workspaceId?: string,
    config: Record<string, any> = {},
  ): Promise<AgentRegistration> {
    const db: any = supabaseAdmin;
    const { data: existing } = await db
      .from('agent_registrations')
      .select('id')
      .eq('manifest_id', manifest.id)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (existing) throw new Error(`Agent ${manifest.name} is already registered`);

    const agent = new agentClass(manifest);
    const context = this.createContext(manifest.id, tenantId, workspaceId, config);
    await agent.onInitialize(context);
    this.agents.set(`${manifest.id}:${tenantId}`, agent);

    const registration: AgentRegistration = {
      id: `reg_${crypto.randomUUID()}`,
      manifest,
      tenantId,
      workspaceId,
      status: 'idle',
      config,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.from('agent_registrations').insert({
      id: registration.id,
      manifest_id: manifest.id,
      manifest,
      tenant_id: tenantId,
      workspace_id: workspaceId,
      status: 'idle',
      config,
    });
    return registration;
  }

  async executeTask(agentId: string, tenantId: string, task: string, taskId?: string): Promise<any> {
    const agent = this.agents.get(`${agentId}:${tenantId}`);
    if (!agent) throw new Error(`Agent ${agentId} not found`);
    const context = agent.getContext();
    if (!context) throw new Error(`Agent ${agentId} not initialized`);
    try {
      if (taskId) await agent.onTaskStart(taskId, context);
      const result = await agent.execute(task, context);
      if (taskId) {
        await agent.onTaskComplete(taskId, result, context);
        await context.tasks.complete(taskId, result);
      }
      return result;
    } catch (error: any) {
      if (taskId) {
        await agent.onTaskFail(taskId, error.message, context);
        await context.tasks.fail(taskId, error.message);
      }
      throw error;
    }
  }

  private createContext(agentId: string, tenantId: string, workspaceId?: string, config: Record<string, any> = {}): AgentContext {
    const api = new AgentAPIClient(agentId, tenantId, workspaceId);
    const logger = new AgentLoggerImpl(agentId, tenantId);
    return {
      agentId, tenantId, workspaceId,
      llm: api.createLLMAPI(),
      tools: api.createToolAPI(),
      memory: api.createMemoryAPI(),
      tasks: api.createTaskAPI(),
      communication: api.createCommunicationAPI(),
      state: {
        conversationHistory: [],
        workingMemory: {},
        metrics: { tasksCompleted: 0, tokensUsed: 0, costUSD: 0, activeTime: 0 },
      },
      config,
      logger,
    };
  }

  async getRegisteredAgents(tenantId: string): Promise<AgentRegistration[]> {
    const db: any = supabaseAdmin;
    const { data } = await db.from('agent_registrations').select('*').eq('tenant_id', tenantId);
    return ((data as any[]) || []).map((r) => ({
      id: r.id,
      manifest: r.manifest,
      tenantId: r.tenant_id,
      workspaceId: r.workspace_id,
      status: r.status,
      config: r.config,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
    }));
  }

  async shutdownAgent(agentId: string, tenantId: string): Promise<void> {
    const agent = this.agents.get(`${agentId}:${tenantId}`);
    if (!agent) throw new Error(`Agent ${agentId} not found`);
    const context = agent.getContext();
    if (context) await agent.onShutdown(context);
    this.agents.delete(`${agentId}:${tenantId}`);
  }
}