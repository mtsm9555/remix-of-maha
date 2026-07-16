import { ToolPolicyEvaluator } from "./ToolPolicyEvaluator.server";
import type { PolicyDecision, ToolPolicyContext } from "./ToolPolicyTypes";

export class ToolPolicyInterceptor {
  static async intercept(
    context: ToolPolicyContext,
  ): Promise<{ decision: PolicyDecision; args: Record<string, unknown> }> {
    const startTime = Date.now();
    const decision = await ToolPolicyEvaluator.evaluate(context);
    await this.log(context, decision, Date.now() - startTime);
    return { decision, args: decision.transformedArgs ?? context.args };
  }

  private static async log(
    context: ToolPolicyContext,
    decision: PolicyDecision,
    latencyMs: number,
  ) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("tool_policy_logs").insert({
        tool_name: context.toolName,
        agent_id: context.agentId,
        department: context.department,
        policy_id: decision.appliedRuleId,
        action: decision.action,
        allowed: decision.allowed,
        reason: decision.reason,
        latency_ms: latencyMs,
      });
    } catch (err) {
      console.error("[ToolPolicyInterceptor] log failed", err);
    }
  }
}