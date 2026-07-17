import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { WorkflowManifest, WorkflowContext, WorkflowExecution, StepResult, WorkflowRegistration, WorkflowStep } from "./WorkflowSDKTypes";
import { WorkflowBase } from "./WorkflowBase";
import { WorkflowAPIClient } from "./WorkflowAPIClient.server";
import { WorkflowUtilsImpl } from "./WorkflowUtils";
import { WorkflowLoggerImpl } from "./WorkflowLogger.server";

export class WorkflowEngine {
  private workflows = new Map<string, WorkflowBase>();

  async registerWorkflow(
    workflow: WorkflowBase,
    tenantId: string,
    workspaceId?: string,
    config: Record<string, any> = {},
  ): Promise<WorkflowRegistration> {
    const manifest = workflow.getManifest();
    const db: any = supabaseAdmin;
    const { data: existing } = await db
      .from('workflow_registrations')
      .select('id')
      .eq('manifest_id', manifest.id)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (existing) throw new Error(`Workflow ${manifest.name} is already registered`);

    this.workflows.set(`${manifest.id}:${tenantId}`, workflow);

    const registration: WorkflowRegistration = {
      id: `reg_${crypto.randomUUID()}`,
      manifest, tenantId, workspaceId,
      status: 'active', config,
      createdAt: new Date(), updatedAt: new Date(),
    };
    await db.from('workflow_registrations').insert({
      id: registration.id,
      manifest_id: manifest.id,
      manifest,
      tenant_id: tenantId,
      workspace_id: workspaceId,
      status: 'active',
      config,
    });
    return registration;
  }

  async executeWorkflow(
    workflowId: string, tenantId: string, input: Record<string, any> = {},
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(`${workflowId}:${tenantId}`);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);
    const manifest = workflow.getManifest();
    const executionId = `exec_${crypto.randomUUID()}`;
    const db: any = supabaseAdmin;

    const execution: WorkflowExecution = {
      id: executionId, workflowId, tenantId,
      status: 'active', input, output: {}, state: {},
      stepResults: [],
      startedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
    };
    await db.from('workflow_executions').insert({
      id: execution.id,
      workflow_id: execution.workflowId,
      tenant_id: execution.tenantId,
      status: 'active',
      input, state: execution.state,
      started_at: execution.startedAt.toISOString(),
    });

    const context = this.createContext(workflowId, executionId, tenantId, input, execution.state);

    try {
      const steps = manifest.steps;
      let currentStepId: string | undefined = steps[0]?.id;
      while (currentStepId) {
        const step = steps.find((s) => s.id === currentStepId);
        if (!step) break;
        execution.currentStepId = currentStepId;
        const stepResult = await this.executeStep(step, context, manifest);
        execution.stepResults.push(stepResult);
        if (stepResult.result) execution.state[step.id] = stepResult.result;

        if (stepResult.status === 'failed' && manifest.errorHandling === 'stop') {
          execution.status = 'error';
          execution.error = stepResult.error;
          execution.errorStepId = step.id;
          break;
        }

        if (execution.state.nextStepId) {
          currentStepId = execution.state.nextStepId as string;
          delete execution.state.nextStepId;
        } else if (step.nextStepId) {
          currentStepId = step.nextStepId;
        } else {
          const idx = steps.findIndex((s) => s.id === currentStepId);
          currentStepId = steps[idx + 1]?.id;
        }
      }

      if (execution.status === 'active') execution.status = 'completed';
      execution.completedAt = new Date();
      execution.output = execution.state;

      await db.from('workflow_executions').update({
        status: execution.status,
        completed_at: execution.completedAt.toISOString(),
        output: execution.output,
        state: execution.state,
        error: execution.error,
        error_step_id: execution.errorStepId,
      }).eq('id', executionId);
      return execution;
    } catch (error: any) {
      execution.status = 'error';
      execution.error = error.message;
      execution.completedAt = new Date();
      await db.from('workflow_executions').update({
        status: 'error',
        error: error.message,
        completed_at: execution.completedAt.toISOString(),
      }).eq('id', executionId);
      throw error;
    }
  }

  private async executeStep(step: WorkflowStep, context: WorkflowContext, manifest: WorkflowManifest): Promise<StepResult> {
    const startTime = Date.now();
    const db: any = supabaseAdmin;
    try {
      const timeoutMs = step.timeoutMs || manifest.maxExecutionTime * 1000;
      const result = await Promise.race([
        step.execute(context),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Step timeout')), timeoutMs)),
      ]);
      const sr: StepResult = {
        stepId: step.id, status: 'completed', result,
        startedAt: new Date(startTime), completedAt: new Date(),
        durationMs: Date.now() - startTime,
      };
      await db.from('workflow_step_results').insert({
        id: `sr_${crypto.randomUUID()}`,
        execution_id: context.executionId,
        step_id: step.id,
        status: 'completed',
        result,
        started_at: sr.startedAt.toISOString(),
        completed_at: sr.completedAt!.toISOString(),
        duration_ms: sr.durationMs,
      });
      return sr;
    } catch (error: any) {
      const sr: StepResult = {
        stepId: step.id, status: 'failed', error: error.message,
        startedAt: new Date(startTime), completedAt: new Date(),
        durationMs: Date.now() - startTime,
      };
      await db.from('workflow_step_results').insert({
        id: `sr_${crypto.randomUUID()}`,
        execution_id: context.executionId,
        step_id: step.id,
        status: 'failed',
        error: error.message,
        started_at: sr.startedAt.toISOString(),
        completed_at: sr.completedAt!.toISOString(),
        duration_ms: sr.durationMs,
      });
      return sr;
    }
  }

  private createContext(
    workflowId: string, executionId: string, tenantId: string,
    input: Record<string, any>, state: Record<string, any>,
  ): WorkflowContext {
    const api = new WorkflowAPIClient(workflowId, tenantId);
    const utils = new WorkflowUtilsImpl();
    const logger = new WorkflowLoggerImpl(workflowId, executionId, tenantId);
    return {
      workflowId, executionId, tenantId,
      input, state, output: {},
      agents: api.createAgentAPI(),
      tools: api.createToolAPI(),
      notifications: api.createNotificationAPI(),
      logger, utils,
    };
  }

  async getRegisteredWorkflows(tenantId: string): Promise<WorkflowRegistration[]> {
    const db: any = supabaseAdmin;
    const { data } = await db.from('workflow_registrations').select('*').eq('tenant_id', tenantId);
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
}