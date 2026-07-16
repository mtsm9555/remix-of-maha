import type { Department } from "../../agents/departments/types";

export type PermissionLevel = "allow" | "deny" | "require_approval";

export interface ParameterConstraint {
  field: string;
  operator:
    | "equals"
    | "eq"
    | "not_equals"
    | "contains"
    | "in"
    | "max_value"
    | "min_value"
    | "gt"
    | "lt"
    | "regex";
  value: any;
}

export interface ToolPermissionRule {
  id: string;
  toolName: string;
  allowedDepartments: Department[] | "ALL";
  level: PermissionLevel;
  parameterConstraints?: ParameterConstraint[];
  maxExecutionsPerHour?: number;
  description: string;
}

export interface ToolAccessRequest {
  agentId: string;
  department: Department;
  toolName: string;
  arguments: Record<string, any>;
  estimatedCost?: number;
}

export interface ToolAccessDecision {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
  appliedConstraints?: ParameterConstraint[];
  approvalId?: string;
}