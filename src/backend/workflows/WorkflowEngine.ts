// src/backend/workflows/WorkflowEngine.ts
import { WorkflowStore } from "./WorkflowStore";
import { DAGExecutor } from "./DAGExecutor";
import type { WorkflowContext } from "./types";

export class WorkflowEngine {
  static async trigger(workflowId: string, userId: string, input: any) {
    console.log(`[WorkflowEngine] Triggering workflow: ${workflowId}`);

    const definition = await WorkflowStore.getDefinition(workflowId);
    if (!definition) throw new Error(`Workflow ${workflowId} not found`);

    const run = await WorkflowStore.createRun(workflowId, userId, input);

    const context: WorkflowContext = {
      runId: run.id,
      userId,
      input,
      nodeOutputs: {},
    };

    try {
      await WorkflowStore.updateRunStatus(run.id, 'running');
      await DAGExecutor.execute(definition, context);
      await WorkflowStore.updateRunStatus(run.id, 'completed');
      console.log(`[WorkflowEngine] Workflow ${workflowId} completed successfully.`);
      return { success: true, runId: run.id, outputs: context.nodeOutputs };
    } catch (error: any) {
      console.error(`[WorkflowEngine] Workflow ${workflowId} failed:`, error);
      await WorkflowStore.updateRunStatus(run.id, 'failed', error.message);
      throw error;
    }
  }
}