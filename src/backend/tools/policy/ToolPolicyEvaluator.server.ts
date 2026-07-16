import type {
  PolicyDecision,
  ToolPolicyCondition,
  ToolPolicyContext,
  ToolPolicyRule,
} from "./ToolPolicyTypes";
import { ToolPolicyStore } from "./ToolPolicyStore.server";

export class ToolPolicyEvaluator {
  static async evaluate(context: ToolPolicyContext): Promise<PolicyDecision> {
    const policies = await ToolPolicyStore.getActivePolicies();
    const applicable = policies.filter((p) => {
      const toolMatch = p.targetToolName === "*" || p.targetToolName === context.toolName;
      const deptMatch = !p.targetDepartment || p.targetDepartment === context.department;
      const agentMatch = !p.targetAgentId || p.targetAgentId === context.agentId;
      return toolMatch && deptMatch && agentMatch;
    });

    for (const policy of applicable) {
      if (this.evaluateConditions(policy.conditions, policy.logic, context)) {
        return this.generateDecision(policy, context);
      }
    }
    return { allowed: true, action: "ALLOW", reason: "No matching policies. Default allow." };
  }

  private static evaluateConditions(
    conditions: ToolPolicyCondition[],
    logic: "AND" | "OR",
    context: ToolPolicyContext,
  ): boolean {
    if (conditions.length === 0) return true;
    const results = conditions.map((c) => this.evaluateCondition(c, context));
    return logic === "AND" ? results.every(Boolean) : results.some(Boolean);
  }

  private static evaluateCondition(
    condition: ToolPolicyCondition,
    context: ToolPolicyContext,
  ): boolean {
    const actual = this.resolveValue(condition.field, context);
    switch (condition.operator) {
      case "eq": return actual === condition.value;
      case "neq": return actual !== condition.value;
      case "gt": return Number(actual) > Number(condition.value);
      case "lt": return Number(actual) < Number(condition.value);
      case "contains": return String(actual).includes(String(condition.value));
      case "regex": return new RegExp(String(condition.value)).test(String(actual));
      case "in":
        return Array.isArray(condition.value) && (condition.value as unknown[]).includes(actual);
      default: return false;
    }
  }

  private static resolveValue(field: string, context: ToolPolicyContext): unknown {
    if (field.startsWith("args.")) return context.args[field.slice(5)];
    if (field.startsWith("context.")) {
      const key = field.slice(8);
      if (key === "time.hour") return new Date().getHours();
      return (context as unknown as Record<string, unknown>)[key];
    }
    return undefined;
  }

  private static generateDecision(
    policy: ToolPolicyRule,
    context: ToolPolicyContext,
  ): PolicyDecision {
    if (policy.action === "DENY") {
      return {
        allowed: false,
        action: "DENY",
        appliedRuleId: policy.id,
        reason: `Denied by policy: ${policy.name}`,
      };
    }
    if (policy.action === "MASK_PAYLOAD" && policy.actionConfig?.maskPattern) {
      const transformed: Record<string, unknown> = { ...context.args };
      const regex = new RegExp(policy.actionConfig.maskPattern, "g");
      const replacement = policy.actionConfig.replacementString ?? "[REDACTED]";
      for (const key of Object.keys(transformed)) {
        const v = transformed[key];
        if (typeof v === "string") transformed[key] = v.replace(regex, replacement);
      }
      return {
        allowed: true,
        action: "MASK_PAYLOAD",
        appliedRuleId: policy.id,
        transformedArgs: transformed,
        reason: `Payload masked by policy: ${policy.name}`,
      };
    }
    if (policy.action === "REQUIRE_APPROVAL") {
      return {
        allowed: false,
        action: "REQUIRE_APPROVAL",
        appliedRuleId: policy.id,
        reason: `Requires human approval: ${policy.name}`,
      };
    }
    return {
      allowed: true,
      action: policy.action,
      appliedRuleId: policy.id,
      reason: `${policy.action} by policy: ${policy.name}`,
    };
  }
}