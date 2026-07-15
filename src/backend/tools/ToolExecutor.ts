// src/backend/tools/ToolExecutor.ts
import { ToolDefinition, ToolExecutionContext, ToolResult } from "./types";

export class ToolExecutor {
  static async execute(
    tool: ToolDefinition,
    args: any,
    context: ToolExecutionContext,
  ): Promise<ToolResult> {
    const startTime = Date.now();
    let result: ToolResult;

    try {
      console.log(`[ToolExecutor] Executing ${tool.name}`);
      result = await tool.execute(args, context);
    } catch (error: any) {
      result = {
        success: false,
        error: `Execution failed: ${error?.message ?? String(error)}`,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Log execution (best-effort; never throws)
    void this.logExecution(tool.name, args, result, context);

    return result;
  }

  private static async logExecution(
    toolName: string,
    args: any,
    result: ToolResult,
    context: ToolExecutionContext,
  ) {
    try {
      // Only log server-side; skip in the browser bundle
      if (typeof window !== "undefined") return;
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("tool_executions").insert({
        tool_name: toolName,
        agent_name: context.agentName ?? null,
        user_id: context.userId ?? null,
        session_id: context.sessionId ?? null,
        args: args as any,
        result: result as any,
        execution_time_ms: result.executionTimeMs,
      });

      if (error) {
        console.error("[ToolExecutor] Failed to log execution:", error.message);
      }
    } catch (err) {
      console.error("[ToolExecutor] Critical logging failure:", err);
    }
  }
}
