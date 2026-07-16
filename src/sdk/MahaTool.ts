import { z } from "zod";
import type { ToolContext, ToolResult, ToolDefinition } from "./ToolSDKTypes";

export abstract class MahaTool<TArgs = any, TResult = any> {
  public readonly name: string;
  public readonly description: string;
  public readonly parameters: z.ZodType<TArgs>;

  constructor(definition: Omit<ToolDefinition<TArgs, TResult>, "execute">) {
    this.name = definition.name;
    this.description = definition.description;
    this.parameters = definition.parameters;
  }

  protected abstract run(args: TArgs, context: ToolContext): Promise<TResult>;

  async execute(args: TArgs, context: ToolContext): Promise<ToolResult<TResult>> {
    const startTime = Date.now();
    try {
      const validated = this.parameters.parse(args);
      const data = await this.run(validated, context);
      return { success: true, data, metadata: { executionTimeMs: Date.now() - startTime } };
    } catch (error: any) {
      const errorMessage =
        error instanceof z.ZodError
          ? `Validation Error: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
          : error?.message ?? "Unknown execution error";
      console.error(`[MahaTool:${this.name}] Execution failed:`, errorMessage);
      return { success: false, error: errorMessage, metadata: { executionTimeMs: Date.now() - startTime } };
    }
  }

  /**
   * MCP-compatible descriptor. The handler runs the tool with a stub OS
   * context — the MCP Gateway is responsible for enforcing budget and
   * permissions before dispatching.
   */
  toMCPServerConfig() {
    const shape = (this.parameters as any)?.shape ?? {};
    return {
      name: this.name,
      description: this.description,
      inputSchema: shape,
      handler: async (args: any) => {
        const stubContext: ToolContext = {
          agentId: "mcp_client",
          sessionId: "mcp_session",
          department: "external",
          correlationId: "mcp_corr",
          budgetRemainingUSD: 0,
        };
        return this.execute(args, stubContext);
      },
    };
  }
}