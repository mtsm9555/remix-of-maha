// Minimal policy engine stub. Extend with real rules as needed.
import type { Department } from "../agents/departments/types";

export interface ActionContext {
  userId: string;
  department?: Department;
  action: string;
  metadata?: Record<string, any>;
}

export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
  requiresApproval?: boolean;
}

export class PolicyEngine {
  static evaluate(ctx: ActionContext): PolicyDecision {
    // Default-allow; block anything explicitly marked as destructive without approval.
    if (ctx.metadata?.destructive) {
      return { allowed: true, requiresApproval: true, reason: "Destructive action requires approval" };
    }
    return { allowed: true };
  }
}