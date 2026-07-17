import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { WorkflowAgentAPI, WorkflowToolAPI, WorkflowNotificationAPI } from "./WorkflowSDKTypes";
import { AgentManager } from "../agent/AgentManager.server";

export class WorkflowAPIClient {
  constructor(private workflowId: string, private tenantId: string) {}

  createAgentAPI(): WorkflowAgentAPI {
    const tenantId = this.tenantId;
    const manager = new AgentManager();
    const db: any = supabaseAdmin;
    return {
      execute: async (agentId, task) => manager.executeTask(agentId, tenantId, task),
      createTask: async (agentId, task) => {
        const taskId = `task_${crypto.randomUUID()}`;
        await db.from('pm_tasks').insert({
          id: taskId,
          tenant_id: tenantId,
          project_id: task.projectId,
          task_number: taskId.slice(-8),
          reporter_id: agentId,
          title: task.title,
          description: task.description,
          type: task.type || 'task',
          priority: task.priority || 'medium',
          status: 'todo',
          assignee_id: agentId,
          metadata: task.metadata ?? {},
        });
        return taskId;
      },
    };
  }

  createToolAPI(): WorkflowToolAPI {
    return {
      execute: async () => { throw new Error('No tool registry bound'); },
      hasTool: async () => false,
    };
  }

  createNotificationAPI(): WorkflowNotificationAPI {
    const tenantId = this.tenantId;
    const db: any = supabaseAdmin;
    const send = async (userId: string, message: string, metadata?: any) => {
      await db.from('notifications').insert({
        id: `notif_${crypto.randomUUID()}`,
        tenant_id: tenantId,
        user_id: userId,
        message,
        metadata: metadata ?? {},
      });
    };
    return {
      send,
      broadcast: async (message, metadata) => {
        const { data } = await db.from('tenant_members').select('user_id').eq('tenant_id', tenantId);
        for (const u of (data as any[]) || []) await send(u.user_id, message, metadata);
      },
      sendEmail: async (to, subject) => {
        console.log(`[WorkflowAPI] Would send email to ${to}: ${subject}`);
      },
    };
  }
}