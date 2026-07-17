import { supabaseAdmin } from "@/integrations/supabase/client.server";

export class CreditManager {
  static async issueCredit(tenantId: string, amountUSD: number, reason: string, issuedBy: string, expiresAt?: Date) {
    const { data, error } = await supabaseAdmin.from('billing_credits').insert({
      tenant_id: tenantId,
      amount_usd: amountUSD,
      remaining_usd: amountUSD,
      currency: 'usd',
      status: 'available',
      reason, issued_by: issuedBy,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
    }).select().single();
    if (error) throw error;

    await supabaseAdmin.from('billing_events').insert({
      tenant_id: tenantId, event_type: 'credit_issued',
      amount_usd: amountUSD, details: { creditId: data.id, reason },
    });
    return data;
  }

  static async applyCredit(creditId: string, invoiceId: string) {
    const { data: credit } = await supabaseAdmin.from('billing_credits')
      .select('*').eq('id', creditId).eq('status', 'available').single();
    if (!credit) throw new Error('Credit not found or not available');

    const { data: invoice } = await supabaseAdmin.from('billing_invoices' as any)
      .select('*').eq('id', invoiceId).eq('status', 'open').single();
    if (!invoice) throw new Error('Invoice not found or not open');

    const rem = Number((invoice as any).amount_remaining_usd);
    const use = Math.min(Number(credit.remaining_usd), rem);

    const newCreditRem = Number(credit.remaining_usd) - use;
    await supabaseAdmin.from('billing_credits').update({
      remaining_usd: newCreditRem,
      status: newCreditRem === 0 ? 'applied' : 'available',
      applied_at: new Date().toISOString(),
    }).eq('id', creditId);

    const newInvRem = rem - use;
    await supabaseAdmin.from('billing_invoices' as any).update({
      amount_remaining_usd: newInvRem,
      status: newInvRem <= 0 ? 'paid' : 'open',
      paid_at: newInvRem <= 0 ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', invoiceId);

    await supabaseAdmin.from('billing_events').insert({
      tenant_id: (invoice as any).tenant_id, event_type: 'credit_applied',
      invoice_id: invoiceId, amount_usd: use, details: { creditId },
    });
  }

  static async getAvailableCredits(tenantId: string) {
    const { data } = await supabaseAdmin.from('billing_credits')
      .select('*').eq('tenant_id', tenantId).eq('status', 'available')
      .order('created_at', { ascending: true });
    return data ?? [];
  }

  static async getCreditHistory(tenantId: string, limit = 50) {
    const { data } = await supabaseAdmin.from('billing_credits')
      .select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(limit);
    return data ?? [];
  }

  static async expireOldCredits() {
    const { data } = await supabaseAdmin.from('billing_credits')
      .select('id').eq('status', 'available').lt('expires_at', new Date().toISOString());
    for (const c of data ?? []) {
      await supabaseAdmin.from('billing_credits').update({ status: 'expired' }).eq('id', c.id);
    }
  }
}