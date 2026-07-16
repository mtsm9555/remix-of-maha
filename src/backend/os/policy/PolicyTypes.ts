export type PolicyAction = "ALLOW" | "DENY" | "REQUIRE_APPROVAL";
export type PolicyLogic = "AND" | "OR";
export type PolicyOperator =
  | "eq"
  | "neq"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "contains"
  | "regex"
  | "in";

export interface PolicyCondition {
  field: string;
  operator: PolicyOperator;
  value: any;
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  conditions: PolicyCondition[];
  logic: PolicyLogic;
  action: PolicyAction;
  priority: number;
  isActive: boolean;
  department?: string | null;
}

export interface PolicyContext {
  agentId: string;
  agentReputationScore: number;
  department: string;
  actionType: string;
  toolName?: string;
  payload: Record<string, any>;
  timestamp: Date;
  estimatedCostUSD: number;
}

export interface PolicyEvaluationResult {
  action: PolicyAction;
  matchedRuleId?: string;
  matchedRuleName?: string;
  reason: string;
}