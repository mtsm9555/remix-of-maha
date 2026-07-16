// src/backend/tools/types.ts
import { z } from "zod";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodTypeAny;
  execute: (args: any, context: ToolExecutionContext) => Promise<ToolResult>;
  requiresAuth?: boolean;
  requiredPermissions?: string[];
}

export interface ToolExecutionContext {
  userId?: string;
  sessionId?: string;
  agentName?: string;
  department?: string;
  supabaseClient?: any;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTimeMs: number;
}

export interface ToolExecutionLog {
  id: string;
  toolName: string;
  agentName?: string;
  userId?: string;
  args: any;
  result: ToolResult;
  timestamp: Date;
}
