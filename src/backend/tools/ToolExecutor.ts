// src/backend/tools/ToolExecutor.ts
import { BaseTool, ToolCall, ToolResult, ToolExecutionContext, ToolRiskLevel } from "./types";
import { ToolRegistry } from "./ToolRegistry";
import { ToolPermissionEngine, PermissionResult } from "./ToolPermissionEngine";
import { ToolMonitor } from "./ToolMonitor";
import { Logger } from "../observability/Logger";

export interface ExecutorOptions {
  defaultTimeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class ToolExecutor {
  private logger = new Logger();

  constructor(
    private registry: ToolRegistry,
    private permissions: ToolPermissionEngine,
    private monitor: ToolMonitor,
    private options: ExecutorOptions = {},
  ) {}

  async execute(call: ToolCall): Promise<ToolResult> {
    const start = Date.now();
    const tool = this.registry.get(call.tool);

    // Record call start
    this.monitor.recordCall(call);

    // Tool not found
    if (!tool) {
      const result: ToolResult = {
        callId: call.id,
        tool: call.tool,
        success: false,
        error: `Tool "${call.tool}" not found in registry`,
        durationMs: Date.now() - start,
        riskLevel: "safe",
        approved: false,
        timestamp: new Date().toISOString(),
      };
      this.monitor.recordResult(result);
      return result;
    }

    const schema = tool.schema;
    const userId = call.userId ?? "anonymous";

    // Permission check
    const permCheck = this.permissions.check(schema, userId);
    if (!permCheck.allowed) {
      const result: ToolResult = {
        callId: call.id,
        tool: call.tool,
        success: false,
        error: permCheck.reason ?? "Permission denied",
        durationMs: Date.now() - start,
        riskLevel: schema.risk,
        approved: false,
        timestamp: new Date().toISOString(),
      };
      this.monitor.recordResult(result);
      return result;
    }

    // Validation
    const validationError = tool.validate(call.parameters);
    if (validationError) {
      const result: ToolResult = {
        callId: call.id,
        tool: call.tool,
        success: false,
        error: validationError,
        durationMs: Date.now() - start,
        riskLevel: schema.risk,
        approved: permCheck.allowed,
        timestamp: new Date().toISOString(),
      };
      this.monitor.recordResult(result);
      return result;
    }

    // Build execution context
    const context: ToolExecutionContext = {
      call,
      policy: this.permissions.getPolicy(userId),
      timeoutMs: this.options.defaultTimeoutMs ?? 30000,
    };

    // Execute with timeout
    try {
      const data = await this.runWithTimeout(
        () => tool.execute(call.parameters, context),
        context.timeoutMs,
      );

      this.permissions.incrementQuota(userId);

      const result: ToolResult = {
        callId: call.id,
        tool: call.tool,
        success: true,
        data,
        durationMs: Date.now() - start,
        riskLevel: schema.risk,
        approved: true,
        timestamp: new Date().toISOString(),
      };
      this.monitor.recordResult(result);
      return result;
    } catch (error: any) {
      const result: ToolResult = {
        callId: call.id,
        tool: call.tool,
        success: false,
        error: error?.message ?? String(error),
        durationMs: Date.now() - start,
        riskLevel: schema.risk,
        approved: permCheck.allowed,
        timestamp: new Date().toISOString(),
      };
      this.monitor.recordResult(result);
      return result;
    }
  }

  async executeBatch(calls: ToolCall[]): Promise<ToolResult[]> {
    return Promise.all(calls.map((call) => this.execute(call)));
  }

  private async runWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Tool execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }
}
