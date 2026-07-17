import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getStripe } from "./StripeClient.server";

export class RefundProcessor {
  static async initiateRefund(paymentId: string, amountUSD: number, reason: string, requestedBy: string) {
    const { data: payment } = await supabaseAdmin.from('billing_payments')
      .select('*').eq('id', paymentId).eq('status', 'succeeded').single();
    if (!payment) throw new Error('Payment not found or not successful');
    if (amountUSD > Number(payment.amount_usd)) throw new Error('Refund amount exceeds payment amount');

    const { data: refund, error } = await supabaseAdmin.from('billing_refunds').insert({
      payment_id: paymentId,
      tenant_id: payment.tenant_id,
      amount_usd: amountUSD,
      currency: payment.currency,
      status: 'pending',
      reason,
      requested_by: requestedBy,
    }).select().single();
    if (error) throw error;

    if (payment.stripe_charge_id) {
      try {
        const stripeRefund = await getStripe().refunds.create({
          charge: payment.stripe_charge_id,
          amount: Math.round(amountUSD * 100),
        });
        await supabaseAdmin.from('billing_refunds').update({
          stripe_refund_id: stripeRefund.id,
          status: 'succeeded',
          processed_at: new Date().toISOString(),
          processed_by: 'system',
        }).eq('id', refund.id);

        const newStatus = amountUSD === Number(payment.amount_usd) ? 'refunded' : 'partially_refunded';
        await supabaseAdmin.from('billing_payments').update({ status: newStatus }).eq('id', paymentId);
        if (payment.invoice_id) {
          await supabaseAdmin.from('billing_invoices' as any).update({ status: 'refunded' }).eq('id', payment.invoice_id);
        }
      } catch (e: any) {
        await supabaseAdmin.from('billing_refunds').update({
          status: 'failed', processed_at: new Date().toISOString(),
        }).eq('id', refund.id);
        throw e;
      }
    } else {
      await supabaseAdmin.from('billing_refunds').update({
        status: 'succeeded',
        processed_at: new Date().toISOString(),
        processed_by: requestedBy,
      }).eq('id', refund.id);
    }

    await supabaseAdmin.from('billing_events').insert({
      tenant_id: payment.tenant_id,
      event_type: 'refund_issued',
      payment_id: paymentId,
      amount_usd: amountUSD,
      details: { refundId: refund.id, reason },
    });

    return refund;
  }

  static async getRefundHistory(tenantId: string, limit = 50) {
    const { data } = await supabaseAdmin.from('billing_refunds')
      .select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(limit);
    return data ?? [];
  }
}