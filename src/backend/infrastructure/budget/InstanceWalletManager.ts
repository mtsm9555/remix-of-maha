import type {
  AgentInstanceWallet,
  MicroTransaction,
  ResourceType,
  ThrottleState,
} from "./BudgetManagerTypes";
import type { Department } from "../../agents/departments/types";

/**
 * Supabase-backed wallet. Replaces the Redis wallet cache because the Worker
 * runtime has no persistent Redis client; Postgres row updates provide the
 * atomic ledger + wallet state.
 */
export class InstanceWalletManager {
  static async initializeWallet(
    instanceId: string,
    agentType: string,
    department: Department,
    allocationUSD: number,
  ): Promise<AgentInstanceWallet> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date();
    const wallet: AgentInstanceWallet = {
      instanceId,
      agentType,
      department,
      currentBalanceUSD: allocationUSD,
      initialAllocationUSD: allocationUSD,
      totalSpentUSD: 0,
      throttleState: "NORMAL",
      updatedAt: now,
    };

    await supabaseAdmin.from("agent_instance_wallets").upsert(
      {
        instance_id: instanceId,
        agent_type: agentType,
        department,
        current_balance_usd: allocationUSD,
        initial_allocation_usd: allocationUSD,
        total_spent_usd: 0,
        throttle_state: "NORMAL",
        updated_at: now.toISOString(),
      },
      { onConflict: "instance_id" },
    );

    await this.recordTransaction({
      id: `txn_init_${instanceId}`,
      instanceId,
      agentType,
      department,
      amountUSD: allocationUSD,
      resourceType: "top_up",
      referenceId: "initial_allocation",
      balanceAfter: allocationUSD,
      timestamp: now,
    });

    return wallet;
  }

  static async deductFunds(
    instanceId: string,
    amountUSD: number,
    resourceType: ResourceType,
    referenceId: string,
  ): Promise<{ success: boolean; newBalance: number }> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const wallet = await this.getWallet(instanceId);
    if (!wallet) return { success: false, newBalance: 0 };

    if (wallet.currentBalanceUSD < amountUSD) {
      await supabaseAdmin
        .from("agent_instance_wallets")
        .update({ throttle_state: "INSUFFICIENT_FUNDS", updated_at: new Date().toISOString() })
        .eq("instance_id", instanceId);
      return { success: false, newBalance: wallet.currentBalanceUSD };
    }

    const newBalance = wallet.currentBalanceUSD - amountUSD;
    const totalSpent = wallet.totalSpentUSD + amountUSD;
    const usagePct = (totalSpent / wallet.initialAllocationUSD) * 100;
    let throttleState: ThrottleState = "NORMAL";
    if (usagePct > 90) throttleState = "PAUSED";
    else if (usagePct > 75) throttleState = "THROTTLED";

    await supabaseAdmin
      .from("agent_instance_wallets")
      .update({
        current_balance_usd: newBalance,
        total_spent_usd: totalSpent,
        throttle_state: throttleState,
        updated_at: new Date().toISOString(),
      })
      .eq("instance_id", instanceId);

    await this.recordTransaction({
      id: `txn_${crypto.randomUUID()}`,
      instanceId,
      agentType: wallet.agentType,
      department: wallet.department,
      amountUSD: -amountUSD,
      resourceType,
      referenceId,
      balanceAfter: newBalance,
      timestamp: new Date(),
    });

    return { success: true, newBalance };
  }

  static async applyTopUp(instanceId: string, amountUSD: number): Promise<number> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const wallet = await this.getWallet(instanceId);
    if (!wallet) throw new Error("Wallet not found");

    const newBalance = wallet.currentBalanceUSD + amountUSD;
    const now = new Date();

    await supabaseAdmin
      .from("agent_instance_wallets")
      .update({
        current_balance_usd: newBalance,
        throttle_state: "NORMAL",
        last_topup_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("instance_id", instanceId);

    await this.recordTransaction({
      id: `txn_topup_${crypto.randomUUID()}`,
      instanceId,
      agentType: wallet.agentType,
      department: wallet.department,
      amountUSD,
      resourceType: "top_up",
      referenceId: "manager_approval",
      balanceAfter: newBalance,
      timestamp: now,
    });

    return newBalance;
  }

  static async getWallet(instanceId: string): Promise<AgentInstanceWallet | null> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("agent_instance_wallets")
      .select("*")
      .eq("instance_id", instanceId)
      .maybeSingle();
    if (!data) return null;
    return {
      instanceId: data.instance_id,
      agentType: data.agent_type,
      department: data.department as Department,
      currentBalanceUSD: data.current_balance_usd,
      initialAllocationUSD: data.initial_allocation_usd,
      totalSpentUSD: data.total_spent_usd,
      throttleState: data.throttle_state as ThrottleState,
      lastTopUpAt: data.last_topup_at ? new Date(data.last_topup_at) : undefined,
      updatedAt: new Date(data.updated_at),
    };
  }

  private static async recordTransaction(txn: MicroTransaction): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("micro_transaction_ledger").insert({
      id: txn.id,
      instance_id: txn.instanceId,
      agent_type: txn.agentType,
      department: txn.department,
      amount_usd: txn.amountUSD,
      resource_type: txn.resourceType,
      reference_id: txn.referenceId,
      balance_after: txn.balanceAfter,
      timestamp: txn.timestamp.toISOString(),
    });
  }
}