// src/backend/tools/ToolRouter.ts
import { ZodError } from "zod";
import { globalToolRegistry } from "./ToolRegistry";
import { ToolExecutor } from "./ToolExecutor";
import { ToolExecutionContext, ToolResult } from "./types";

export class ToolRouter {
  async route(
    toolName: string,
    rawArgs: any,
    context: ToolExecutionContext,
  ): Promise<ToolResult> {
    console.log(`[ToolRouter] Routing request to: ${toolName}`);

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
    return await ToolExecutor.execute(tool, validatedArgs, context);
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
