import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { StripeClient } from "./StripeClient.server";
import { DunningManager } from "./DunningManager.server";

export class PaymentProcessor {
  static async processPayment(invoiceId: string, _paymentMethodId: string, amountUSD?: number) {
    const { data: invoice } = await supabaseAdmin
      .from('billing_invoices' as any).select('*').eq('id', invoiceId).single();
    if (!invoice) throw new Error('Invoice not found');
    if ((invoice as any).status !== 'open') throw new Error('Invoice is not open for payment');

    const remaining = Number((invoice as any).amount_remaining_usd ?? 0);
    const amount = amountUSD ?? remaining;
    if (amount <= 0) throw new Error('No amount remaining to pay');

    const { data: sub } = await supabaseAdmin
      .from('subscriptions').select('stripe_customer_id').eq('tenant_id', (invoice as any).tenant_id).limit(1).maybeSingle();
    if (!sub?.stripe_customer_id) throw new Error('Tenant has no Stripe customer');

    const intent = await StripeClient.createPaymentIntent(sub.stripe_customer_id, amount, (invoice as any).currency);

    const { data: payment, error } = await supabaseAdmin.from('billing_payments').insert({
      tenant_id: (invoice as any).tenant_id,
      invoice_id: invoiceId,
      stripe_payment_intent_id: intent.id,
      amount_usd: amount,
      currency: (invoice as any).currency,
      status: 'processing',
      payment_method: { type: 'card' },
    }).select().single();
    if (error) throw error;
    return payment;
  }

  static async recordManualPayment(invoiceId: string, amountUSD: number, details: { method: string; reference?: string; notes?: string }, _recordedBy: string) {
    const { data: invoice } = await supabaseAdmin
      .from('billing_invoices' as any).select('*').eq('id', invoiceId).single();
    if (!invoice) throw new Error('Invoice not found');

    const { data: payment, error } = await supabaseAdmin.from('billing_payments').insert({
      tenant_id: (invoice as any).tenant_id,
      invoice_id: invoiceId,
      amount_usd: amountUSD,
      currency: (invoice as any).currency,
      status: 'succeeded',
      payment_method: { type: 'manual', last4: details.reference?.slice(-4) },
      processed_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;

    const newPaid = Number((invoice as any).amount_paid_usd ?? 0) + amountUSD;
    const newRem = Number((invoice as any).amount_usd ?? 0) - newPaid;
    const newStatus = newRem <= 0 ? 'paid' : 'open';
    await supabaseAdmin.from('billing_invoices' as any).update({
      amount_paid_usd: newPaid,
      amount_remaining_usd: newRem,
      status: newStatus,
      paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', invoiceId);

    return payment;
  }

  static async handlePaymentSuccess(paymentId: string, stripeChargeId: string) {
    const { data: payment } = await supabaseAdmin.from('billing_payments').select('*').eq('id', paymentId).single();
    if (!payment) return;
    await supabaseAdmin.from('billing_payments').update({
      status: 'succeeded', stripe_charge_id: stripeChargeId, processed_at: new Date().toISOString(),
    }).eq('id', paymentId);

    if (payment.invoice_id) {
      const { data: invoice } = await supabaseAdmin.from('billing_invoices' as any).select('*').eq('id', payment.invoice_id).single();
      if (invoice) {
        const newPaid = Number((invoice as any).amount_paid_usd ?? 0) + Number(payment.amount_usd);
        const newRem = Number((invoice as any).amount_usd ?? 0) - newPaid;
        const status = newRem <= 0 ? 'paid' : 'open';
        await supabaseAdmin.from('billing_invoices' as any).update({
          amount_paid_usd: newPaid,
          amount_remaining_usd: newRem,
          status,
          paid_at: status === 'paid' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        }).eq('id', (invoice as any).id);
      }
    }
  }

  static async handlePaymentFailure(paymentId: string, _error: string) {
    await supabaseAdmin.from('billing_payments').update({
      status: 'failed', processed_at: new Date().toISOString(),
    }).eq('id', paymentId);

    const { data: payment } = await supabaseAdmin.from('billing_payments')
      .select('invoice_id, tenant_id').eq('id', paymentId).single();
    if (payment?.invoice_id) {
      await DunningManager.initiateDunning(payment.invoice_id, payment.tenant_id);
    }
  }

  static async getPaymentHistory(tenantId: string, limit = 50) {
    const { data } = await supabaseAdmin.from('billing_payments')
      .select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(limit);
    return data ?? [];
  }
}