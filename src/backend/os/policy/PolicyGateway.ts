import { PolicyEvaluator } from "./PolicyEvaluator";
import { PolicyStore } from "./PolicyStore";
import { PolicyContextEnricher } from "./PolicyContextEnricher";
import type { PolicyContext } from "./PolicyTypes";
import { ApprovalBridge } from "../approvals/ApprovalBridge";

export class PolicyGateway {
  static async evaluateAndEnforce(baseContext: Partial<PolicyContext>): Promise<boolean> {
    const fullContext = await PolicyContextEnricher.enrichContext(baseContext);
    const rules = await PolicyStore.getActiveRules();
    const result = PolicyEvaluator.evaluate(fullContext, rules);

    console.log(
      `[PolicyGateway] Action: ${fullContext.actionType} | Rule: ${result.matchedRuleName ?? "Default"} | Decision: ${result.action}`,
    );

    if (result.action === "DENY") {
      console.warn(`[PolicyGateway] BLOCKED: ${result.reason}`);
      return false;
    }
    if (result.action === "REQUIRE_APPROVAL") {
      const approvalId = `policy_${crypto.randomUUID()}`;
      const approved = await ApprovalBridge.requestApproval(
        approvalId,
        { reason: result.reason, context: `Policy Check: ${result.matchedRuleName ?? "Default"}` } as any,
        result.reason,
      );
      return approved;
    }
    return true;
  }
}