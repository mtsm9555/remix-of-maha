import { ComplianceAuditLogger } from "./ComplianceAuditLogger.server";
import type { RetentionPolicy } from "./DataGovernanceTypes";

const DATA_TYPE_TO_TABLE: Record<string, string> = {
  user_memory: "user_memories",
  department_memory: "department_memories",
  project_memory: "project_memories",
  shared_memory: "shared_memories",
  context_snapshot: "context_snapshots",
};

export class RetentionManager {
  static async enforceRetentionPolicies(): Promise<void> {
    const policies = await RetentionManager.getActivePolicies();
    for (const policy of policies) {
      await RetentionManager.enforcePolicy(policy);
    }
  }

  private static async enforcePolicy(policy: RetentionPolicy) {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - policy.retention_days);
    const dataTypes = policy.applies_to?.dataTypes ?? [];

    for (const dataType of dataTypes) {
      const tableName = DATA_TYPE_TO_TABLE[dataType];
      if (!tableName) continue;

      const { data: expired } = await supabaseAdmin
        .from(tableName as never)
        .select("id, created_at")
        .lt("created_at", cutoff.toISOString())
        .limit(1000);

      const rows = (expired ?? []) as Array<{ id: string }>;
      if (rows.length === 0) continue;

      const ids = rows.map((r) => r.id);
      const held = await RetentionManager.getLegalHolds(dataType, ids);
      const processable = ids.filter((id) => !held.includes(id));
      if (processable.length === 0) continue;

      switch (policy.action_after_retention) {
        case "delete":
          await supabaseAdmin
            .from(tableName as never)
            .delete()
            .in("id", processable);
          break;
        case "archive":
          await supabaseAdmin
            .from(tableName as never)
            .update({ metadata: { archived: true } } as never)
            .in("id", processable);
          break;
        case "anonymize":
          await supabaseAdmin
            .from(tableName as never)
            .update({
              content: "[ANONYMIZED - Retention policy applied]",
              metadata: { anonymized: true },
            } as never)
            .in("id", processable);
          break;
      }

      await ComplianceAuditLogger.log({
        eventType: "retention_enforced",
        details: {
          policyId: policy.id,
          policyName: policy.name,
          dataType,
          action: policy.action_after_retention,
          recordsAffected: processable.length,
          cutoffDate: cutoff.toISOString(),
        },
        performedBy: "system",
      });
    }
  }

  private static async getActivePolicies(): Promise<RetentionPolicy[]> {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data } = await supabaseAdmin
      .from("retention_policies")
      .select("*")
      .eq("is_active", true);
    return (data ?? []) as unknown as RetentionPolicy[];
  }

  private static async getLegalHolds(
    entityType: string,
    recordIds: string[],
  ): Promise<string[]> {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data } = await supabaseAdmin
      .from("legal_holds")
      .select("entity_id")
      .eq("entity_type", entityType)
      .in("entity_id", recordIds);
    return (data ?? []).map((r) => r.entity_id);
  }

  static async placeLegalHold(
    entityType: string,
    entityIds: string[],
    reason: string,
    requestedBy: string,
  ): Promise<void> {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const rows = entityIds.map((entity_id) => ({
      entity_type: entityType,
      entity_id,
      reason,
      requested_by: requestedBy,
      placed_at: new Date().toISOString(),
    }));
    await supabaseAdmin.from("legal_holds").insert(rows);
  }
}