import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { InvoiceLineItem } from "./BillingOpsTypes";

export class InvoiceGenerator {
  static async createInvoice(
    tenantId: string,
    lineItems: Omit<InvoiceLineItem, 'id'>[],
    options: { subscriptionId?: string; dueDate?: Date; notes?: string; metadata?: Record<string, any> } = {}
  ) {
    const subtotal = lineItems.reduce((s, i) => s + i.totalUSD, 0);
    const discount = lineItems.filter(i => i.type === 'discount').reduce((s, i) => s + i.totalUSD, 0);
    const taxable = subtotal - discount;
    const tax = await this.calculateTax(tenantId, taxable);
    const total = taxable + tax;

    const invoiceDate = new Date();
    const dueDate = options.dueDate ?? new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const items = lineItems.map(i => ({ ...i, id: crypto.randomUUID() }));

    const { data, error } = await supabaseAdmin
      .from('billing_invoices' as any)
      .insert({
        tenant_id: tenantId,
        subscription_id: options.subscriptionId ?? null,
        subtotal_usd: subtotal,
        discount_usd: discount,
        tax_usd: tax,
        amount_usd: total,
        amount_paid_usd: 0,
        amount_remaining_usd: total,
        currency: 'usd',
        line_items: items,
        invoice_date: invoiceDate.toISOString(),
        due_date: dueDate.toISOString(),
        status: 'draft',
        attempt_count: 0,
        notes: options.notes ?? null,
        metadata: options.metadata ?? {},
      })
      .select()
      .single();
    if (error) throw error;

    await this.logBillingEvent(tenantId, 'invoice_created', (data as any).id, {
      totalUSD: total, lineItemCount: lineItems.length,
    });

    return data;
  }

  static async finalizeInvoice(invoiceId: string) {
    const { data: invoice, error } = await supabaseAdmin
      .from('billing_invoices' as any).select('*').eq('id', invoiceId).single();
    if (error || !invoice) throw new Error('Invoice not found');
    if ((invoice as any).status !== 'draft') throw new Error('Invoice is not in draft status');

    const total = Number((invoice as any).amount_usd ?? 0);
    const applied = await this.applyAvailableCredits((invoice as any).tenant_id, total);
    const remaining = total - applied;

    const { data: updated, error: upErr } = await supabaseAdmin
      .from('billing_invoices' as any)
      .update({
        status: 'open',
        amount_remaining_usd: remaining,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single();
    if (upErr) throw upErr;
    return updated;
  }

  private static async calculateTax(_tenantId: string, amountUSD: number): Promise<number> {
    // Simplified: no per-tenant tax rate column yet.
    return amountUSD * 0;
  }

  private static async applyAvailableCredits(tenantId: string, amountUSD: number): Promise<number> {
    const { data: credits } = await supabaseAdmin
      .from('billing_credits')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'available')
      .order('created_at', { ascending: true });

    let applied = 0;
    for (const c of credits ?? []) {
      if (applied >= amountUSD) break;
      const use = Math.min(Number(c.remaining_usd), amountUSD - applied);
      const newRem = Number(c.remaining_usd) - use;
      await supabaseAdmin.from('billing_credits').update({
        remaining_usd: newRem,
        status: newRem === 0 ? 'applied' : 'available',
        applied_at: new Date().toISOString(),
      }).eq('id', c.id);
      applied += use;
    }
    return applied;
  }

  static async logBillingEvent(
    tenantId: string,
    eventType: string,
    invoiceId?: string | null,
    details: Record<string, any> = {},
    amountUSD?: number,
  ) {
    await supabaseAdmin.from('billing_events').insert({
      tenant_id: tenantId,
      event_type: eventType,
      invoice_id: invoiceId ?? null,
      amount_usd: amountUSD ?? null,
      details,
    });
  }
}