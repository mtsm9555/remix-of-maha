export type PolicyScope = "global" | "department" | "agent" | "task";
export type PolicyAction =
  | "ALLOW"
  | "DENY"
  | "MASK_PAYLOAD"
  | "THROTTLE"
  | "REQUIRE_APPROVAL";

export interface ToolPolicyCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "contains" | "regex" | "in";
  value: unknown;
}

export interface ToolPolicyRule {
  id: string;
  name: string;
  description?: string;
  scope: PolicyScope;
  targetToolName: string;
  targetDepartment?: string;
  targetAgentId?: string;
  conditions: ToolPolicyCondition[];
  logic: "AND" | "OR";
  action: PolicyAction;
  actionConfig?: {
    maskPattern?: string;
    replacementString?: string;
    throttleLimitPerMinute?: number;
  };
  priority: number;
  isActive: boolean;
}

export interface ToolPolicyContext {
  toolName: string;
  args: Record<string, unknown>;
  agentId: string;
  agentReputation: number;
  department: string;
  taskSensitivity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
}

export interface PolicyDecision {
  allowed: boolean;
  action: PolicyAction;
  appliedRuleId?: string;
  transformedArgs?: Record<string, unknown>;
  reason: string;
}