// src/backend/tools/types.ts

export type ToolCategory =
  | "web"
  | "browser"
  | "code"
  | "file"
  | "shell"
  | "http"
  | "calc"
  | "memory"
  | "vision"
  | "custom";

export type ToolRiskLevel = "safe" | "low" | "medium" | "high" | "critical";

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required?: boolean;
  default?: any;
  enum?: any[];
}

export interface ToolSchema {
  name: string;
  description: string;
  category: ToolCategory;
  risk: ToolRiskLevel;
  parameters: ToolParameter[];
  returns: {
    type: string;
    description: string;
  };
  examples?: string[];
}

export interface ToolCall {
  id: string;
  tool: string;
  parameters: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp: string;
}

export interface ToolResult {
  callId: string;
  tool: string;
  success: boolean;
  data?: any;
  error?: string;
  durationMs: number;
  riskLevel: ToolRiskLevel;
  approved: boolean;
  timestamp: string;
}

export interface ToolPolicy {
  userId: string;
  allowedCategories: ToolCategory[];
  blockedTools: string[];
  maxRiskLevel: ToolRiskLevel;
  requireApprovalAbove: ToolRiskLevel;
  dailyQuota: number;
  usedQuota: number;
}

export interface ToolExecutionContext {
  call: ToolCall;
  policy: ToolPolicy;
  timeoutMs: number;
  abortSignal?: AbortSignal;
}

export abstract class BaseTool {
  abstract readonly schema: ToolSchema;

  abstract execute(
    params: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<any>;

  validate(params: Record<string, any>): string | null {
    for (const param of this.schema.parameters) {
      if (param.required && !(param.name in params)) {
        return `Missing required parameter: ${param.name}`;
      }
      if (param.enum && params[param.name] !== undefined) {
        if (!param.enum.includes(params[param.name])) {
          return `Invalid value for ${param.name}. Must be one of: ${param.enum.join(", ")}`;
        }
      }
    }
    return null;
  }
}
