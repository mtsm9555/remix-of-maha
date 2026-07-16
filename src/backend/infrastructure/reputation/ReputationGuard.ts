import type { ReputationScore, TrustLevel } from "./ReputationTypes";

export class ReputationGuard {
  static async evaluateAndEnforce(
    newScore: ReputationScore,
    previousTrustLevel?: TrustLevel,
  ): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (newScore.trustLevel === "UNTRUSTED" && previousTrustLevel !== "UNTRUSTED") {
      console.warn(
        `[ReputationGuard] Agent ${newScore.agentId} dropped to UNTRUSTED. Suspending.`,
      );
      await supabaseAdmin
        .from("agent_registry_persistent")
        .update({ status: "offline", updated_at: new Date().toISOString() })
        .eq("agent_type", newScore.agentId);
      return;
    }

    if (
      newScore.trustLevel === "NOVICE" &&
      (previousTrustLevel === "TRUSTED" || previousTrustLevel === "ELITE")
    ) {
      console.warn(
        `[ReputationGuard] Agent ${newScore.agentId} placed on PROBATION.`,
      );
    }

    if (newScore.trustLevel === "ELITE" && previousTrustLevel !== "ELITE") {
      console.log(
        `[ReputationGuard] Agent ${newScore.agentId} promoted to ELITE.`,
      );
    }
  }
}