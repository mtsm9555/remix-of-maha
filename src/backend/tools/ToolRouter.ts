// src/backend/tools/ToolRouter.ts
import { ZodError } from "zod";
import { globalToolRegistry } from "./ToolRegistry";
import { ToolExecutor } from "./ToolExecutor";
import { ToolExecutionContext, ToolResult } from "./types";
import { PermissionEngine } from "../auth/PermissionEngine";
import type { AuthContext } from "../auth/types";
import { DepartmentToolPermissions } from "../os/permissions/DepartmentToolPermissions";
import { ApprovalBridge } from "../os/approvals/ApprovalBridge";
import { AgentBudgetEngine } from "../os/budgeting/AgentBudgetEngine";
import { CostCalculator } from "../os/budgeting/CostCalculator";
import type { Department } from "../agents/departments/types";

export class ToolRouter {
  async route(
    toolName: string,
    rawArgs: any,
    context: ToolExecutionContext,
    authContext?: AuthContext,
  ): Promise<ToolResult> {
    console.log(`[ToolRouter] Routing request to: ${toolName}`);

    // Department-level tool permission (Zero Trust): only enforced when a department is provided.
    if (context.department) {
      const decision = DepartmentToolPermissions.evaluateAccess({
        agentId: context.agentName ?? "unknown",
        department: context.department as Department,
        toolName,
        arguments: rawArgs,
      });
      void this.logDecision(context, toolName, rawArgs, decision);
      if (!decision.allowed) {
        if (decision.requiresApproval) {
          const approvalId =
            decision.approvalId ??
            `apr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          console.log(`[ToolRouter] Pausing execution for tool: ${toolName}`);
          const approved = await ApprovalBridge.requestApproval(
            approvalId,
            decision,
            `Agent ${context.agentName ?? "unknown"} wants to use tool: ${toolName}`,
          );
          if (!approved) {
            return {
              success: false,
              error: `Execution rejected by human operator.`,
              executionTimeMs: 0,
            };
          }
        } else {
          return {
            success: false,
            error: `Access Denied: ${decision.reason}`,
            executionTimeMs: 0,
          };
        }
      }
    }

    if (authContext) {
      try {
        PermissionEngine.requirePermission(authContext, "tool", "execute", toolName);
      } catch (error: any) {
        return { success: false, error: error.message, executionTimeMs: 0 };
      }
    }

    const tool = globalToolRegistry.get(toolName);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${toolName}" not found in registry.`,
        executionTimeMs: 0,
      };
    }

    // 1. Validate arguments against Zod schema
    let validatedArgs: any;
    try {
      validatedArgs = tool.parameters.parse(rawArgs);
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          error: `Invalid arguments for ${toolName}: ${error.message}`,
          executionTimeMs: 0,
        };
      }
      throw error;
    }

    // 2. Check auth requirement
    if (tool.requiresAuth && !context.userId) {
      return {
        success: false,
        error: `Authentication required for tool: ${toolName}`,
        executionTimeMs: 0,
      };
    }

    // 3. Delegate to Executor
    const result = await ToolExecutor.execute(tool, validatedArgs, context);

    if (context.agentName) {
      const toolCost = CostCalculator.calculateToolCost(toolName);
      void AgentBudgetEngine.recordTransaction({
        agentId: context.agentName,
        department: (context.department as Department) ?? ("operations" as Department),
        resourceType: "tool_execution",
        amount: 1,
        costUSD: toolCost,
        metadata: { toolName, taskId: context.sessionId, timestamp: new Date() },
      });
    }

    return result;
  }

  private async logDecision(
    context: ToolExecutionContext,
    toolName: string,
    args: any,
    decision: { allowed: boolean; requiresApproval: boolean; reason: string },
  ) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("tool_access_logs").insert({
        agent_id: context.agentName ?? "unknown",
        department: context.department ?? "unknown",
        tool_name: toolName,
        arguments: args ?? {},
        decision: decision.allowed
          ? "allowed"
          : decision.requiresApproval
            ? "approval_required"
            : "denied",
        reason: decision.reason,
      });
    } catch (err) {
      console.error("[ToolRouter] Failed to log tool access decision:", err);
    }
  }

  async routeBatch(
    calls: Array<{ toolName: string; args: any }>,
    context: ToolExecutionContext,
    options?: { parallel?: boolean },
  ): Promise<ToolResult[]> {
    if (options?.parallel) {
      return Promise.all(calls.map((c) => this.route(c.toolName, c.args, context)));
    }
    const results: ToolResult[] = [];
    for (const c of calls) {
      results.push(await this.route(c.toolName, c.args, context));
    }
    return results;
  }

  listAvailableTools() {
    return globalToolRegistry.getAll().map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
      requiresAuth: t.requiresAuth ?? false,
    }));
  }

  describeTool(name: string) {
    const t = globalToolRegistry.get(name);
    if (!t) return null;
    return {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
      requiresAuth: t.requiresAuth ?? false,
    };
  }

  searchTools(query: string) {
    return globalToolRegistry.search(query).map((t) => ({
      name: t.name,
      description: t.description,
    }));
  }
}

export const globalToolRouter = new ToolRouter();
export const toolRouter = globalToolRouter;
