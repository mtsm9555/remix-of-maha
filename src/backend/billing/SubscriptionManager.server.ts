import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { StripeClient } from "./StripeClient.server";
import type {
  BillingCycle, PricingPlan, Subscription, SubscriptionStatus, SubscriptionUsage,
} from "./SubscriptionTypes";

const EMPTY_USAGE: SubscriptionUsage = {
  activeAgents: 0, teamMembers: 0, memoryRecords: 0, storageUsedGB: 0, apiCallsThisMonth: 0,
};

function mapPlan(r: any): PricingPlan {
  return {
    id: r.id, name: r.name, tier: r.tier, description: r.description ?? "",
    monthlyPriceUSD: Number(r.monthly_price_usd), yearlyPriceUSD: Number(r.yearly_price_usd),
    stripeMonthlyPriceId: r.stripe_monthly_price_id, stripeYearlyPriceId: r.stripe_yearly_price_id,
    quotas: r.quotas, features: r.features, isActive: r.is_active,
  };
}

function mapSub(r: any): Subscription {
  return {
    id: r.id, tenantId: r.tenant_id, planId: r.plan_id, status: r.status,
    billingCycle: r.billing_cycle, stripeCustomerId: r.stripe_customer_id,
    stripeSubscriptionId: r.stripe_subscription_id,
    currentPeriodStart: new Date(r.current_period_start),
    currentPeriodEnd: new Date(r.current_period_end),
    trialStart: r.trial_start ? new Date(r.trial_start) : null,
    trialEnd: r.trial_end ? new Date(r.trial_end) : null,
    canceledAt: r.canceled_at ? new Date(r.canceled_at) : null,
    usage: { ...EMPTY_USAGE, ...(r.usage ?? {}) },
    createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at),
  };
}

async function tenantOwnerEmail(tenantId: string): Promise<{ email: string; name: string } | null> {
  const { data: tenant } = await supabaseAdmin
    .from("tenants").select("name").eq("id", tenantId).maybeSingle();
  const { data: owner } = await supabaseAdmin
    .from("tenant_members").select("user_id").eq("tenant_id", tenantId).eq("role", "owner").maybeSingle();
  if (!tenant || !owner) return null;
  const { data: user } = await supabaseAdmin.auth.admin.getUserById((owner as any).user_id);
  return { email: user?.user?.email ?? "", name: (tenant as any).name };
}

export class SubscriptionManager {
  static async getAllPlans(): Promise<PricingPlan[]> {
    const { data } = await supabaseAdmin
      .from("pricing_plans").select("*").eq("is_active", true).order("monthly_price_usd");
    return (data ?? []).map(mapPlan);
  }

  static async getPlan(planId: string): Promise<PricingPlan | null> {
    const { data } = await supabaseAdmin
      .from("pricing_plans").select("*").eq("id", planId).eq("is_active", true).maybeSingle();
    return data ? mapPlan(data) : null;
  }

  static async getActiveSubscription(tenantId: string): Promise<Subscription | null> {
    const { data } = await supabaseAdmin
      .from("subscriptions").select("*").eq("tenant_id", tenantId)
      .in("status", ["active", "trialing", "past_due"]).maybeSingle();
    return data ? mapSub(data) : null;
  }

  static async createSubscription(
    tenantId: string, planId: string, billingCycle: BillingCycle, trialDays = 14,
  ): Promise<Subscription> {
    const plan = await this.getPlan(planId);
    if (!plan) throw new Error("Plan not found");

    const existing = await this.getActiveSubscription(tenantId);
    if (existing) throw new Error("Tenant already has an active subscription");

    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions").select("stripe_customer_id").eq("tenant_id", tenantId).maybeSingle();
    let stripeCustomerId: string | null = (existingSub as any)?.stripe_customer_id ?? null;
    let stripeSubscriptionId: string | null = null;
    let currentPeriodStart = new Date();
    let currentPeriodEnd = new Date(Date.now() + 30 * 86400_000);
    let trialStart: Date | null = null;
    let trialEnd: Date | null = null;
    let status: SubscriptionStatus = plan.tier === "free" ? "active" : "trialing";

    const priceId = billingCycle === "monthly"
      ? plan.stripeMonthlyPriceId : plan.stripeYearlyPriceId;

    if (plan.tier !== "free" && priceId && process.env.STRIPE_SECRET_KEY) {
      if (!stripeCustomerId) {
        const contact = await tenantOwnerEmail(tenantId);
        if (!contact) throw new Error("Tenant owner not found");
        stripeCustomerId = await StripeClient.createCustomer(tenantId, contact.email, contact.name);
      }
      const s = await StripeClient.createSubscription(stripeCustomerId, priceId, trialDays);
      stripeSubscriptionId = s.id;
      status = s.status as SubscriptionStatus;
      currentPeriodStart = new Date((s as any).current_period_start * 1000);
      currentPeriodEnd = new Date((s as any).current_period_end * 1000);
      trialStart = s.trial_start ? new Date(s.trial_start * 1000) : null;
      trialEnd = s.trial_end ? new Date(s.trial_end * 1000) : null;
    }

    const { data, error } = await supabaseAdmin.from("subscriptions").upsert({
      tenant_id: tenantId, plan_id: planId, status, billing_cycle: billingCycle,
      stripe_customer_id: stripeCustomerId, stripe_subscription_id: stripeSubscriptionId,
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      trial_start: trialStart?.toISOString() ?? null,
      trial_end: trialEnd?.toISOString() ?? null,
      usage: EMPTY_USAGE as any,
    }, { onConflict: "tenant_id" }).select("*").single();
    if (error) throw error;
    return mapSub(data);
  }

  static async changePlan(tenantId: string, newPlanId: string): Promise<Subscription> {
    const sub = await this.getActiveSubscription(tenantId);
    if (!sub) throw new Error("No active subscription");
    const newPlan = await this.getPlan(newPlanId);
    if (!newPlan) throw new Error("Plan not found");

    if (sub.stripeSubscriptionId) {
      const priceId = sub.billingCycle === "monthly"
        ? newPlan.stripeMonthlyPriceId : newPlan.stripeYearlyPriceId;
      if (priceId) await StripeClient.updateSubscription(sub.stripeSubscriptionId, priceId);
    }

    const { data, error } = await supabaseAdmin.from("subscriptions")
      .update({ plan_id: newPlanId })
      .eq("id", sub.id).select("*").single();
    if (error) throw error;
    return mapSub(data);
  }

  static async cancelSubscription(tenantId: string, atPeriodEnd = true): Promise<void> {
    const sub = await this.getActiveSubscription(tenantId);
    if (!sub) throw new Error("No active subscription");
    if (sub.stripeSubscriptionId) {
      await StripeClient.cancelSubscription(sub.stripeSubscriptionId, atPeriodEnd);
    }
    await supabaseAdmin.from("subscriptions").update({
      status: atPeriodEnd ? sub.status : "canceled",
      canceled_at: atPeriodEnd ? null : new Date().toISOString(),
    }).eq("id", sub.id);
  }

  static async checkQuota(
    tenantId: string, metric: keyof SubscriptionUsage,
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    const sub = await this.getActiveSubscription(tenantId);
    if (!sub) return { allowed: false, current: 0, limit: 0 };
    const plan = await this.getPlan(sub.planId);
    if (!plan) return { allowed: false, current: 0, limit: 0 };
    const quotaMap: Record<keyof SubscriptionUsage, keyof typeof plan.quotas> = {
      activeAgents: "maxAgents", teamMembers: "maxTeamMembers",
      memoryRecords: "maxMemoryRecords", storageUsedGB: "maxStorageGB",
      apiCallsThisMonth: "maxAgents",
    };
    const current = sub.usage[metric] ?? 0;
    const limit = (plan.quotas as any)[quotaMap[metric]] ?? 0;
    return { allowed: limit === -1 || current < limit, current, limit };
  }

  static async updateUsage(tenantId: string, updates: Partial<SubscriptionUsage>): Promise<void> {
    const sub = await this.getActiveSubscription(tenantId);
    if (!sub) return;
    await supabaseAdmin.from("subscriptions").update({
      usage: { ...sub.usage, ...updates } as any,
    }).eq("id", sub.id);
  }
}