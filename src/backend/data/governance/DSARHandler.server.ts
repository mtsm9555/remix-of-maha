import { ComplianceAuditLogger } from "./ComplianceAuditLogger.server";
import type { DSARRequest, DSARScope } from "./DataGovernanceTypes";

const SCOPE_TABLES: Record<string, string> = {
  user_memory: "user_memories",
};

export class DSARHandler {
  static async createRequest(
    userId: string,
    requestType: DSARRequest["requestType"],
    scope: DSARScope,
  ): Promise<DSARRequest> {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const id = `dsar_${crypto.randomUUID()}`;
    const requestedAt = new Date();
    const { error } = await supabaseAdmin.from("dsar_requests").insert({
      id,
      user_id: userId,
      request_type: requestType,
      status: "pending",
      scope: scope as never,
      requested_at: requestedAt.toISOString(),
      processed_by: "system",
    });
    if (error) throw new Error(`Failed to create DSAR: ${error.message}`);
    return {
      id,
      userId,
      requestType,
      status: "pending",
      scope,
      requestedAt,
      processedBy: "system",
    };
  }

  static async processRequest(
    requestId: string,
  ): Promise<{ success: boolean; details: unknown }> {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: reqRow } = await supabaseAdmin
      .from("dsar_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();
    if (!reqRow) throw new Error("DSAR request not found");

    await supabaseAdmin
      .from("dsar_requests")
      .update({ status: "processing" })
      .eq("id", requestId);

    const scope = (reqRow.scope as unknown as DSARScope) ?? { dataTypes: [] };
    let result: unknown;
    switch (reqRow.request_type) {
      case "deletion":
        result = await DSARHandler.handleDeletion(reqRow.user_id, scope);
        break;
      case "access":
        result = await DSARHandler.handleAccess(reqRow.user_id, scope);
        break;
      case "portability": {
        const access = await DSARHandler.handleAccess(reqRow.user_id, scope);
        result = {
          action: "portability",
          exportFormat: "json",
          data: access.dataExport,
        };
        break;
      }
      case "correction":
        result = {
          action: "correction",
          message: "Correction request logged for manual review",
        };
        break;
      default:
        result = { action: "unknown" };
    }

    await supabaseAdmin
      .from("dsar_requests")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        notes: JSON.stringify(result),
      })
      .eq("id", requestId);

    await ComplianceAuditLogger.log({
      eventType: "dsar_processed",
      userId: reqRow.user_id,
      details: {
        requestId: reqRow.id,
        requestType: reqRow.request_type,
        result,
      },
      performedBy: "system",
    });
    return { success: true, details: result };
  }

  private static async handleDeletion(userId: string, scope: DSARScope) {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    let totalDeleted = 0;
    for (const dt of scope.dataTypes) {
      const table = SCOPE_TABLES[dt];
      if (!table) continue;
      const { data } = await supabaseAdmin
        .from(table as never)
        .delete()
        .eq("user_id", userId)
        .select("id");
      totalDeleted += (data ?? []).length;
    }
    return { action: "deletion", recordsDeleted: totalDeleted };
  }

  private static async handleAccess(userId: string, scope: DSARScope) {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const dataExport: Record<string, unknown[]> = {};
    for (const dt of scope.dataTypes) {
      const table = SCOPE_TABLES[dt];
      if (!table) continue;
      const { data } = await supabaseAdmin
        .from(table as never)
        .select("*")
        .eq("user_id", userId);
      dataExport[table] = (data ?? []) as unknown[];
    }
    return { action: "access", dataExport };
  }
}