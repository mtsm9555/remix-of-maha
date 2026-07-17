import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SCHEDULE = [
  { daysAfterFailure: 1, attemptNumber: 1 },
  { daysAfterFailure: 3, attemptNumber: 2 },
  { daysAfterFailure: 7, attemptNumber: 3 },
  { daysAfterFailure: 14, attemptNumber: 4 },
];

export class DunningManager {
  static async initiateDunning(invoiceId: string, tenantId: string) {
    for (const s of SCHEDULE) {
      await supabaseAdmin.from('billing_dunning_attempts').insert({
        invoice_id: invoiceId,
        tenant_id: tenantId,
        attempt_number: s.attemptNumber,
        status: 'pending',
        scheduled_at: new Date(Date.now() + s.daysAfterFailure * 86400_000).toISOString(),
      });
    }
    await supabaseAdmin.from('billing_invoices' as any).update({
      status: 'open', updated_at: new Date().toISOString(),
    }).eq('id', invoiceId);
  }

  static async processScheduledAttempts() {
    const { data: attempts } = await supabaseAdmin.from('billing_dunning_attempts')
      .select('*').eq('status', 'pending').lte('scheduled_at', new Date().toISOString());
    for (const a of attempts ?? []) {
      await this.executeAttempt(a);
    }
  }

  private static async executeAttempt(attempt: any) {
    try {
      const { data: invoice } = await supabaseAdmin.from('billing_invoices' as any)
        .select('*').eq('id', attempt.invoice_id).single();
      if (!invoice) throw new Error('Invoice not found');

      console.log(`[Dunning] Attempt #${attempt.attempt_number} for invoice ${attempt.invoice_id}`);

      await supabaseAdmin.from('billing_dunning_attempts').update({
        status: 'sent', sent_at: new Date().toISOString(), result: 'Notification sent',
      }).eq('id', attempt.id);

      await supabaseAdmin.from('billing_invoices' as any).update({
        attempt_count: Number((invoice as any).attempt_count ?? 0) + 1,
        last_attempt_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', attempt.invoice_id);

      await supabaseAdmin.from('billing_events').insert({
        tenant_id: attempt.tenant_id,
        event_type: 'dunning_attempt',
        invoice_id: attempt.invoice_id,
        details: { attemptNumber: attempt.attempt_number },
      });
    } catch (e: any) {
      await supabaseAdmin.from('billing_dunning_attempts').update({
        status: 'failed', result: e.message,
      }).eq('id', attempt.id);
    }
  }

  static async cancelDunning(invoiceId: string) {
    await supabaseAdmin.from('billing_dunning_attempts').update({
      status: 'failed', result: 'Cancelled - payment received',
    }).eq('invoice_id', invoiceId).eq('status', 'pending');
  }
}