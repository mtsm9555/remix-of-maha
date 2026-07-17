import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  _stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" as any });
  return _stripe;
}

export class StripeClient {
  static async createCustomer(tenantId: string, email: string, name: string): Promise<string> {
    const customer = await getStripe().customers.create({
      email, name, metadata: { tenantId },
    });
    return customer.id;
  }

  static async createSubscription(stripeCustomerId: string, priceId: string, trialDays?: number) {
    return getStripe().subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      trial_period_days: trialDays,
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });
  }

  static async updateSubscription(subscriptionId: string, newPriceId: string) {
    const sub = await getStripe().subscriptions.retrieve(subscriptionId);
    return getStripe().subscriptions.update(subscriptionId, {
      items: [{ id: sub.items.data[0].id, price: newPriceId }],
      proration_behavior: "always_invoice",
    });
  }

  static async cancelSubscription(subscriptionId: string, atPeriodEnd = true): Promise<void> {
    if (atPeriodEnd) {
      await getStripe().subscriptions.update(subscriptionId, { cancel_at_period_end: true });
    } else {
      await getStripe().subscriptions.cancel(subscriptionId);
    }
  }

  static async createPaymentIntent(stripeCustomerId: string, amountUSD: number, currency = "usd") {
    return getStripe().paymentIntents.create({
      amount: Math.round(amountUSD * 100), currency, customer: stripeCustomerId,
    });
  }

  static async createSetupIntent(stripeCustomerId: string) {
    return getStripe().setupIntents.create({
      customer: stripeCustomerId, payment_method_types: ["card"],
    });
  }

  static async listPaymentMethods(stripeCustomerId: string) {
    const res = await getStripe().paymentMethods.list({
      customer: stripeCustomerId, type: "card",
    });
    return res.data;
  }

  static constructWebhookEvent(payload: string, signature: string): Stripe.Event {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    return getStripe().webhooks.constructEvent(payload, signature, secret);
  }
}