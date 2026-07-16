import { z } from "zod";

export interface ToolContext {
  agentId: string;
  sessionId: string;
  department: string;
  correlationId: string;
  budgetRemainingUSD: number;
}

export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTimeMs: number;
    tokensUsed?: number;
    externalApiCalls?: number;
  };
}

export interface ToolDefinition<TArgs = any, TResult = any> {
  name: string;
  description: string;
  parameters: z.ZodType<TArgs>;
  execute: (args: TArgs, context: ToolContext) => Promise<ToolResult<TResult>>;
}