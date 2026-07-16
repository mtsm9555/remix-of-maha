import { Agent, AgentTask, AgentResult, AgentState } from "../core/orchestrator/AgentOrchestrator";
import { generateText, tool, stepCountIs } from "ai";
import type { AuthContext } from "../auth/types";
import type { BuiltContext } from "../context/types";
import { globalToolRegistry } from "../tools/ToolRegistry";
import { globalToolRouter } from "../tools/ToolRouter";
import { JARVIS_SYSTEM_PROMPT } from "./prompts";

export interface PlannerInput {
  query: string;
  context?: BuiltContext;
  authContext?: AuthContext;
  correlationId?: string;
  sessionId?: string;
}

export interface PlannerOutput {
  text: string;
  steps: number;
  toolCalls: Array<{ name: string; args: unknown }>;
}

/**
 * PlannerAgent — ReAct-style planner backed by the Lovable AI Gateway.
 *
 * Keeps the classic Agent interface (canHandle/execute) so it can still be
 * registered with the AgentOrchestrator, and adds a static `handleQuery`
 * entry point used by server functions.
 */
export class PlannerAgent implements Agent {
  id = "planner-agent";
  name = "Planner Agent";
  state = AgentState.IDLE;

  private static MAX_STEPS = 5;
  private static DEFAULT_MODEL = "google/gemini-3-flash-preview";

  canHandle(task: AgentTask): boolean {
    return task.type === "planning" || task.type === "query";
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const query: string = task.payload?.query ?? task.payload?.goal ?? "";
    if (!query) {
      return { success: false, error: "Planner requires a `query` or `goal` in payload." };
    }
    try {
      const result = await PlannerAgent.handleQuery({
        query,
        authContext: task.payload?.authContext,
        context: task.payload?.context,
        sessionId: task.payload?.sessionId,
        correlationId: task.id,
      });
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error?.message ?? String(error) };
    }
  }

  static async handleQuery(input: PlannerInput): Promise<PlannerOutput> {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured on the server.");

    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(apiKey);

    // Build tool set from the registry, executing via the ToolRouter so RBAC
    // and Zod validation still apply.
    const registered = globalToolRegistry.getAll();
    const toolCalls: Array<{ name: string; args: unknown }> = [];
    const tools: Record<string, ReturnType<typeof tool>> = {};
    for (const t of registered) {
      tools[t.name] = tool({
        description: t.description,
        inputSchema: t.parameters,
        execute: async (args: unknown) => {
          toolCalls.push({ name: t.name, args });
          const res = await globalToolRouter.route(
            t.name,
            args,
            {
              userId: input.authContext?.userId,
              sessionId: input.sessionId ?? input.authContext?.sessionId,
              agentName: "planner-agent",
            },
            input.authContext,
          );
          return res;
        },
      });
    }

    const systemParts: string[] = [JARVIS_SYSTEM_PROMPT];
    if (input.context?.aggregatedContext) {
      systemParts.push(`RELEVANT CONTEXT:\n${input.context.aggregatedContext}`);
    }

    const result = await generateText({
      model: gateway(PlannerAgent.DEFAULT_MODEL),
      system: systemParts.join("\n\n"),
      prompt: input.query,
      tools,
      stopWhen: stepCountIs(PlannerAgent.MAX_STEPS),
      temperature: 0.7,
    });

    return {
      text: result.text ?? "",
      steps: result.steps?.length ?? 0,
      toolCalls,
    };
  }
}