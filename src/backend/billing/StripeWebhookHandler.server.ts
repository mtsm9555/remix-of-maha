import type Stripe from "stripe";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function findTenantIdByCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("subscriptions").select("tenant_id")
    .eq("stripe_customer_id", customerId).maybeSingle();
  return (data as any)?.tenant_id ?? null;
}

export class StripeWebhookHandler {
  static async handle(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await this.onSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await this.onSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_succeeded":
        await this.onPaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await this.onPaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        // ignore other events
        break;
    }
  }

  private static async onSubscriptionUpsert(s: Stripe.Subscription) {
    const tenantId = await findTenantIdByCustomer(String(s.customer));
    if (!tenantId) return;
    await supabaseAdmin.from("subscriptions").update({
      stripe_subscription_id: s.id,
      status: s.status,
      current_period_start: new Date((s as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((s as any).current_period_end * 1000).toISOString(),
      trial_start: s.trial_start ? new Date(s.trial_start * 1000).toISOString() : null,
      trial_end: s.trial_end ? new Date(s.trial_end * 1000).toISOString() : null,
      canceled_at: s.cancel_at ? new Date(s.cancel_at * 1000).toISOString() : null,
    }).eq("tenant_id", tenantId);
  }

  private static async onSubscriptionDeleted(s: Stripe.Subscription) {
    const tenantId = await findTenantIdByCustomer(String(s.customer));
    if (!tenantId) return;
    await supabaseAdmin.from("subscriptions").update({
      status: "canceled", canceled_at: new Date().toISOString(),
    }).eq("tenant_id", tenantId);
  }

  private static async onPaymentSucceeded(inv: Stripe.Invoice) {
    const tenantId = await findTenantIdByCustomer(String(inv.customer));
    if (!tenantId) return;
    await supabaseAdmin.from("billing_invoices").insert({
      tenant_id: tenantId,
      stripe_invoice_id: inv.id,
      amount_usd: (inv.amount_paid ?? 0) / 100,
      currency: inv.currency ?? "usd",
      status: "paid",
      period_start: new Date((inv.period_start ?? Date.now() / 1000) * 1000).toISOString(),
      period_end: new Date((inv.period_end ?? Date.now() / 1000) * 1000).toISOString(),
      paid_at: new Date().toISOString(),
    });
  }

  private static async onPaymentFailed(inv: Stripe.Invoice) {
    const tenantId = await findTenantIdByCustomer(String(inv.customer));
    if (!tenantId) return;
    await supabaseAdmin.from("subscriptions")
      .update({ status: "past_due" }).eq("tenant_id", tenantId);
  }
}