import { InstanceWalletManager } from "./InstanceWalletManager";
import type { TopUpRequest } from "./BudgetManagerTypes";

export class BudgetThrottler {
  static async evaluateAndEnforce(
    instanceId: string,
    estimatedCostUSD: number,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const wallet = await InstanceWalletManager.getWallet(instanceId);
    if (!wallet) return { allowed: false, reason: "Wallet not found" };

    if (
      wallet.throttleState === "INSUFFICIENT_FUNDS" ||
      wallet.currentBalanceUSD < estimatedCostUSD
    ) {
      await this.requestTopUp(instanceId, estimatedCostUSD - wallet.currentBalanceUSD);
      return {
        allowed: false,
        reason: `Insufficient funds. Top-up requested. Balance: $${wallet.currentBalanceUSD.toFixed(4)}`,
      };
    }

    if (wallet.throttleState === "THROTTLED" || wallet.throttleState === "PAUSED") {
      console.warn(
        `[BudgetThrottler] Instance ${instanceId} is ${wallet.throttleState}. Reducing concurrency.`,
      );
    }

    return { allowed: true };
  }

  private static async requestTopUp(instanceId: string, deficitUSD: number): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const wallet = await InstanceWalletManager.getWallet(instanceId);
    if (!wallet) return;

    const request: TopUpRequest = {
      id: `topup_${crypto.randomUUID()}`,
      instanceId,
      requestedAmountUSD: Math.max(deficitUSD, 10.0),
      reason: `Wallet depleted. Current: $${wallet.currentBalanceUSD.toFixed(4)}, Deficit: $${deficitUSD.toFixed(4)}`,
      status: "pending",
      requestedAt: new Date(),
    };

    await supabaseAdmin.from("budget_topup_requests").insert({
      id: request.id,
      instance_id: request.instanceId,
      requested_amount_usd: request.requestedAmountUSD,
      reason: request.reason,
      status: request.status,
      requested_at: request.requestedAt.toISOString(),
    });
    console.log(
      `[BudgetThrottler] Top-up request ${request.id} for ${instanceId}: $${request.requestedAmountUSD}`,
    );
  }

  static async processApprovedTopUp(requestId: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: request } = await supabaseAdmin
      .from("budget_topup_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();
    if (!request || request.status !== "approved") return;

    await InstanceWalletManager.applyTopUp(request.instance_id, request.requested_amount_usd);

    await supabaseAdmin
      .from("budget_topup_requests")
      .update({ status: "completed", processed_at: new Date().toISOString() })
      .eq("id", requestId);
  }
}