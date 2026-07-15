// src/backend/workflows/WorkflowStore.ts
import type { WorkflowDefinition, WorkflowRun } from "./types";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export class WorkflowStore {
  static async getDefinition(workflowId: string): Promise<WorkflowDefinition | null> {
    const supabase = await admin();
    const { data, error } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      nodes: data.nodes_json,
      edges: data.edges_json,
    };
  }

  static async createRun(workflowId: string, userId: string, input: any): Promise<WorkflowRun> {
    const supabase = await admin();
    const run: WorkflowRun = {
      id: crypto.randomUUID(),
      workflowId,
      userId,
      status: 'pending',
      input,
      nodeOutputs: {},
      startedAt: new Date(),
    };

    await supabase.from('workflow_runs').insert({
      id: run.id,
      workflow_id: run.workflowId,
      user_id: run.userId,
      status: run.status,
      input: run.input,
      started_at: run.startedAt.toISOString(),
    });

    return run;
  }

  static async updateRunStatus(runId: string, status: WorkflowRun['status'], error?: string) {
    const supabase = await admin();
    await supabase.from('workflow_runs').update({
      status,
      error,
      completed_at: new Date().toISOString(),
    }).eq('id', runId);
  }
}