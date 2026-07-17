import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ApprovalExecution } from "./ApprovalGatesTypes";

export class ApprovalExecutionEngine {
  static async executeApprovedRequest(requestId: string, executedBy: string): Promise<ApprovalExecution> {
    const { data: request } = await (supabaseAdmin as any)
      .from('approval_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'approved')
      .maybeSingle();
    if (!request) throw new Error('Request not found or not approved');
    if (request.executed_at) throw new Error('Request already executed');

    const execution: ApprovalExecution = {
      id: `exec_${crypto.randomUUID()}`,
      requestId,
      action: request.action,
      payload: request.request_data || {},
      status: 'executing',
      executedBy,
      createdAt: new Date(),
    };
    await (supabaseAdmin as any).from('approval_executions').insert({
      id: execution.id,
      request_id: execution.requestId,
      action: execution.action,
      payload: execution.payload,
      status: execution.status,
      executed_by: executedBy,
    });

    try {
      const result = await this.executeAction(request.action, request.request_data || {});
      const executedAt = new Date().toISOString();
      await (supabaseAdmin as any).from('approval_executions').update({
        status: 'completed', executed_at: executedAt, result,
      }).eq('id', execution.id);
      await (supabaseAdmin as any).from('approval_requests').update({
        executed_at: executedAt, executed_by: executedBy, execution_result: result, updated_at: executedAt,
      }).eq('id', requestId);
      return { ...execution, status: 'completed', executedAt: new Date(executedAt), result };
    } catch (error: any) {
      await (supabaseAdmin as any).from('approval_executions').update({
        status: 'failed', error: error?.message || String(error),
      }).eq('id', execution.id);
      throw error;
    }
  }

  private static async executeAction(action: string, payload: Record<string, any>): Promise<any> {
    switch (action) {
      case 'agent.create': return { agentId: `agent_${crypto.randomUUID()}`, status: 'created', payload };
      case 'agent.deploy': return { deploymentId: `deploy_${crypto.randomUUID()}`, status: 'deployed', payload };
      case 'tool.install': return { toolId: `tool_${crypto.randomUUID()}`, status: 'installed', payload };
      case 'secret.access': return { secretValue: '[REDACTED]', status: 'accessed' };
      case 'data.export': return { exportId: `export_${crypto.randomUUID()}`, fileUrl: '/exports/data.csv', status: 'exported' };
      case 'production.deploy': return { deploymentId: `prod_deploy_${crypto.randomUUID()}`, status: 'deployed' };
      default: throw new Error(`Unknown action: ${action}`);
    }
  }

  static async getExecutionHistory(requestId: string): Promise<ApprovalExecution[]> {
    const { data } = await (supabaseAdmin as any)
      .from('approval_executions')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });
    return (data || []).map((e: any) => ({
      id: e.id,
      requestId: e.request_id,
      action: e.action,
      payload: e.payload || {},
      status: e.status,
      executedAt: e.executed_at ? new Date(e.executed_at) : undefined,
      executedBy: e.executed_by ?? undefined,
      result: e.result ?? undefined,
      error: e.error ?? undefined,
      createdAt: new Date(e.created_at),
    }));
  }
}