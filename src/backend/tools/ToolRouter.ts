// src/backend/tools/ToolRouter.ts
import { ToolCall, ToolResult } from "./types";
import { ToolRegistry } from "./ToolRegistry";
import { ToolExecutor } from "./ToolExecutor";
import { ToolPermissionEngine } from "./ToolPermissionEngine";
import { ToolMonitor } from "./ToolMonitor";
import { Logger } from "../observability/Logger";

export interface RouterOptions {
  parallel?: boolean;
  timeoutMs?: number;
}

export class ToolRouter {
  private executor: ToolExecutor;
  private logger = new Logger();

  constructor(
    private registry: ToolRegistry,
    permissions: ToolPermissionEngine,
    monitor: ToolMonitor,
  ) {
    this.executor = new ToolExecutor(registry, permissions, monitor, {
      defaultTimeoutMs: 30000,
    });
  }

  async route(call: ToolCall, options?: RouterOptions): Promise<ToolResult> {
    this.logger.info(`Routing tool call: ${call.tool}`, { callId: call.id });
    return this.executor.execute(call);
  }

  async routeBatch(calls: ToolCall[], options?: RouterOptions): Promise<ToolResult[]> {
    if (options?.parallel) {
      return this.executor.executeBatch(calls);
    }
    // Sequential execution
    const results: ToolResult[] = [];
    for (const call of calls) {
      results.push(await this.executor.execute(call));
    }
    return results;
  }

  listAvailableTools(): any[] {
    return this.registry.list().map((schema) => ({
      name: schema.name,
      description: schema.description,
      category: schema.category,
      risk: schema.risk,
      parameters: schema.parameters,
    }));
  }

  describeTool(name: string): any | null {
    const schema = this.registry.getSchema(name);
    if (!schema) return null;
    return {
      name: schema.name,
      description: schema.description,
      category: schema.category,
      risk: schema.risk,
      parameters: schema.parameters,
      returns: schema.returns,
      examples: schema.examples,
    };
  }

  searchTools(query: string): any[] {
    return this.registry.search(query).map((schema) => ({
      name: schema.name,
      description: schema.description,
      category: schema.category,
      risk: schema.risk,
    }));
  }
}

export const toolRouter = new ToolRouter(toolRegistry, toolPermissionEngine, toolMonitor);
