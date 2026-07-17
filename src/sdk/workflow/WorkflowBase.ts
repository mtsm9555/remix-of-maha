import type { WorkflowManifest, WorkflowContext, WorkflowStep } from "./WorkflowSDKTypes";

export abstract class WorkflowBase {
  protected manifest: WorkflowManifest;

  constructor(manifest: WorkflowManifest) {
    this.manifest = manifest;
  }

  abstract defineSteps(): WorkflowStep[];

  getManifest(): WorkflowManifest {
    return { ...this.manifest, steps: this.defineSteps() };
  }

  protected createAgentStep(
    id: string, name: string, agentId: string,
    taskBuilder: (context: WorkflowContext) => string,
    options: Partial<WorkflowStep> = {},
  ): WorkflowStep {
    return {
      id, name, type: 'agent_task',
      execute: async (context) => context.agents.execute(agentId, taskBuilder(context), context.state),
      config: { agentId }, ...options,
    };
  }

  protected createToolStep(
    id: string, name: string, toolName: string,
    argsBuilder: (context: WorkflowContext) => any,
    options: Partial<WorkflowStep> = {},
  ): WorkflowStep {
    return {
      id, name, type: 'tool_execution',
      execute: async (context) => context.tools.execute(toolName, argsBuilder(context)),
      config: { toolName }, ...options,
    };
  }

  protected createConditionStep(
    id: string, name: string,
    condition: (context: WorkflowContext) => boolean,
    trueStepId: string, falseStepId?: string,
    options: Partial<WorkflowStep> = {},
  ): WorkflowStep {
    return {
      id, name, type: 'condition',
      execute: async (context) => {
        const result = condition(context);
        context.state.conditionResult = result;
        context.state.nextStepId = result ? trueStepId : falseStepId;
        return { conditionMet: result };
      },
      config: { trueStepId, falseStepId }, ...options,
    };
  }

  protected createDelayStep(id: string, name: string, delayMs: number, options: Partial<WorkflowStep> = {}): WorkflowStep {
    return {
      id, name, type: 'delay',
      execute: async (context) => { await context.utils.delay(delayMs); return { delayed: delayMs }; },
      config: { delayMs }, ...options,
    };
  }

  protected createNotificationStep(
    id: string, name: string,
    messageBuilder: (context: WorkflowContext) => string,
    recipientBuilder?: (context: WorkflowContext) => string,
    options: Partial<WorkflowStep> = {},
  ): WorkflowStep {
    return {
      id, name, type: 'notification',
      execute: async (context) => {
        const message = messageBuilder(context);
        if (recipientBuilder) await context.notifications.send(recipientBuilder(context), message);
        else await context.notifications.broadcast(message);
        return { notified: true };
      },
      config: {}, ...options,
    };
  }
}