import type { ComplianceAuditEvent } from "./DataGovernanceTypes";

export class ComplianceAuditLogger {
  static async log(
    event: Omit<ComplianceAuditEvent, "id" | "timestamp">,
  ): Promise<void> {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const id = `audit_${crypto.randomUUID()}`;
    const { error } = await supabaseAdmin.from("compliance_audit_log").insert({
      id,
      event_type: event.eventType,
      entity_id: event.entityId ?? null,
      entity_type: event.entityType ?? null,
      user_id: event.userId ?? null,
      details: event.details as never,
      performed_by: event.performedBy,
      timestamp: new Date().toISOString(),
    });
    if (error) console.error("[AuditLogger] insert failed:", error.message);
  }

  static async queryLogs(filters: {
    eventType?: string;
    userId?: string;
    dateRange?: { start: Date; end: Date };
    limit?: number;
  }) {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    let query = supabaseAdmin.from("compliance_audit_log").select("*");
    if (filters.eventType) query = query.eq("event_type", filters.eventType);
    if (filters.userId) query = query.eq("user_id", filters.userId);
    if (filters.dateRange) {
      query = query
        .gte("timestamp", filters.dateRange.start.toISOString())
        .lte("timestamp", filters.dateRange.end.toISOString());
    }
    const { data } = await query
      .order("timestamp", { ascending: false })
      .limit(filters.limit ?? 100);
    return data ?? [];
  }
}