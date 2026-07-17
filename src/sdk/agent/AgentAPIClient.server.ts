import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type {
  AgentLLMAPI, AgentToolAPI, AgentMemoryAPI, AgentTaskAPI, AgentCommunicationAPI,
  LLMOptions, ChatMessage, MemoryResult, TaskDefinition, AgentMessage,
} from "./AgentSDKTypes";

/**
 * Backend-agnostic API client bound to an agent+tenant.
 * LLM/tools/memory scopes ship as minimal stubs; higher-level modules
 * can override by injecting their own AgentContext.
 */
export class AgentAPIClient {
  constructor(
    private agentId: string,
    private tenantId: string,
    private workspaceId?: string,
  ) {}

  createLLMAPI(): AgentLLMAPI {
    const gatewayUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
    const call = async (messages: ChatMessage[], options?: LLMOptions): Promise<string> => {
      const apiKey = process.env.LOVABLE_API_KEY;
      if (!apiKey) return '';
      const res = await fetch(gatewayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: options?.model ?? 'google/gemini-2.5-flash',
          messages,
          temperature: options?.temperature,
          max_tokens: options?.maxTokens,
        }),
      });
      if (!res.ok) return '';
      const json: any = await res.json();
      return json?.choices?.[0]?.message?.content ?? '';
    };
    return {
      generate: (prompt, options) => call([{ role: 'user', content: prompt }], options),
      chat: (messages, options) => call(messages, options),
      embed: async () => [],
      analyze: async (text, task) => ({ task, text }),
    };
  }

  createToolAPI(): AgentToolAPI {
    return {
      list: async () => [],
      execute: async () => { throw new Error('No tool registry bound'); },
      hasTool: async () => false,
    };
  }

  createMemoryAPI(): AgentMemoryAPI {
    const empty = { store: async () => {}, search: async (): Promise<MemoryResult[]> => [], getRecent: async (): Promise<MemoryResult[]> => [] };
    return {
      project: empty,
      department: empty,
      user: empty,
      shared: { search: async () => [] },
    };
  }

  createTaskAPI(): AgentTaskAPI {
    const tenantId = this.tenantId;
    const workspaceId = this.workspaceId;
    const agentId = this.agentId;
    return {
      create: async (task: TaskDefinition) => {
        const taskId = `task_${crypto.randomUUID()}`;
        await supabaseAdmin.from('pm_tasks').insert({
          id: taskId,
          tenant_id: tenantId,
          workspace_id: workspaceId,
          title: task.title,
          description: task.description,
          type: task.type,
          priority: task.priority,
          status: 'pending',
          assigned_to: task.assignedTo || agentId,
          project_id: task.projectId,
          due_date: task.dueDate?.toISOString(),
          estimated_hours: task.estimatedHours,
          metadata: task.metadata ?? {},
        } as any);
        return taskId;
      },
      update: async (taskId, updates) => {
        await supabaseAdmin.from('pm_tasks').update({
          ...updates,
          due_date: updates.dueDate?.toISOString(),
        } as any).eq('id', taskId).eq('tenant_id', tenantId);
      },
      complete: async (taskId, result) => {
        await supabaseAdmin.from('pm_tasks').update({
          status: 'completed',
          metadata: result ?? {},
        } as any).eq('id', taskId).eq('tenant_id', tenantId);
      },
      fail: async (taskId, error) => {
        await supabaseAdmin.from('pm_tasks').update({
          status: 'failed',
          metadata: { error },
        } as any).eq('id', taskId).eq('tenant_id', tenantId);
      },
      get: async (taskId) => {
        const { data } = await supabaseAdmin.from('pm_tasks').select('*').eq('id', taskId).eq('tenant_id', tenantId).single();
        if (!data) throw new Error('Task not found');
        const d: any = data;
        return {
          id: d.id, title: d.title, description: d.description, type: d.type,
          priority: d.priority, status: d.status, assignedTo: d.assigned_to,
          projectId: d.project_id, dueDate: d.due_date ? new Date(d.due_date) : undefined,
          estimatedHours: d.estimated_hours, metadata: d.metadata,
        };
      },
      list: async (filters?: any) => {
        let query = supabaseAdmin.from('pm_tasks').select('*').eq('tenant_id', tenantId);
        if (filters?.projectId) query = query.eq('project_id', filters.projectId);
        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
        const { data } = await query;
        return (data || []).map((t: any) => ({
          id: t.id, title: t.title, description: t.description, type: t.type,
          priority: t.priority, status: t.status, assignedTo: t.assigned_to,
          projectId: t.project_id, dueDate: t.due_date ? new Date(t.due_date) : undefined,
          estimatedHours: t.estimated_hours, metadata: t.metadata,
        }));
      },
    };
  }

  createCommunicationAPI(): AgentCommunicationAPI {
    const handlers: Array<(m: AgentMessage) => void> = [];
    const agentId = this.agentId;
    const tenantId = this.tenantId;
    const send = async (toAgentId: string, message: AgentMessage) => {
      await supabaseAdmin.from('agent_sdk_messages').insert({
        id: `msg_${crypto.randomUUID()}`,
        from_agent_id: agentId,
        to_agent_id: toAgentId,
        tenant_id: tenantId,
        type: message.type,
        content: message.content,
        metadata: message.metadata ?? {},
        timestamp: new Date().toISOString(),
      });
    };
    return {
      sendMessage: send,
      broadcast: async (message) => {
        const { data } = await supabaseAdmin.from('agent_registrations').select('id').eq('tenant_id', tenantId);
        for (const a of (data as any[]) || []) {
          if (a.id !== agentId) await send(a.id, message);
        }
      },
      onMessage: (handler) => { handlers.push(handler); },
      requestHelp: async (task, context) => {
        const req: AgentMessage = {
          from: agentId, to: 'broadcast', type: 'help',
          content: task, metadata: context, timestamp: new Date(),
        };
        await this.createCommunicationAPI().broadcast(req);
        return { from: 'assistant', to: agentId, type: 'response', content: 'Help acknowledged', timestamp: new Date() };
      },
    };
  }
}