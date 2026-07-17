import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type {
  FailoverEvent,
  FailoverPlan,
  FailoverStep,
  FailoverTrigger,
} from "./DisasterRecoveryTypes";
import { DRRegionManager } from "./DRRegionManager.server";

function defaultSteps(targetRegionId: string): FailoverStep[] {
  return [
    { id: `step_${crypto.randomUUID()}`, order: 1, name: "Verify Source Region Failure", description: "Confirm the primary is down", action: "verify_services", config: { checkDatabase: true, checkAPI: true }, timeoutSeconds: 60, retryAttempts: 3 },
    { id: `step_${crypto.randomUUID()}`, order: 2, name: "Promote Replica", description: "Promote replica to primary", action: "promote_replica", config: { targetRegionId }, timeoutSeconds: 300, retryAttempts: 2 },
    { id: `step_${crypto.randomUUID()}`, order: 3, name: "Update DNS", description: "Update DNS records", action: "update_dns", config: { ttl: 60 }, timeoutSeconds: 120, retryAttempts: 3 },
    { id: `step_${crypto.randomUUID()}`, order: 4, name: "Switch Traffic", description: "Route traffic to new primary", action: "switch_traffic", config: { gradual: true, percentage: 100 }, timeoutSeconds: 180, retryAttempts: 2 },
    { id: `step_${crypto.randomUUID()}`, order: 5, name: "Verify Services", description: "Verify all services are up", action: "verify_services", config: { checkAll: true }, timeoutSeconds: 120, retryAttempts: 3 },
    { id: `step_${crypto.randomUUID()}`, order: 6, name: "Notify Stakeholders", description: "Send notifications", action: "notify_stakeholders", config: { channels: ["email", "slack"] }, timeoutSeconds: 30, retryAttempts: 1 },
  ];
}

export class FailoverOrchestrator {
  static async createFailoverPlan(
    tenantId: string,
    name: string,
    config: {
      sourceRegionId: string;
      targetRegionId: string;
      failoverType: "automatic" | "manual";
      rtoSeconds: number;
      rpoSeconds: number;
      triggers?: FailoverTrigger[];
      steps?: FailoverStep[];
      description?: string;
    },
  ): Promise<FailoverPlan> {
    const id = `plan_${crypto.randomUUID()}`;
    const steps = config.steps ?? defaultSteps(config.targetRegionId);
    const { data, error } = await supabaseAdmin
      .from("failover_plans" as never)
      .insert({
        id,
        tenant_id: tenantId,
        name,
        description: config.description ?? null,
        source_region_id: config.sourceRegionId,
        target_region_id: config.targetRegionId,
        failover_type: config.failoverType,
        triggers: config.triggers ?? [],
        rto_seconds: config.rtoSeconds,
        rpo_seconds: config.rpoSeconds,
        steps,
        is_active: true,
      } as never)
      .select()
      .single();
    if (error) throw error;
    const row = data as Record<string, unknown>;
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      name: String(row.name),
      description: (row.description as string | null) ?? undefined,
      sourceRegionId: String(row.source_region_id),
      targetRegionId: String(row.target_region_id),
      failoverType: row.failover_type as FailoverPlan["failoverType"],
      triggers: (row.triggers as FailoverTrigger[]) ?? [],
      rtoSeconds: Number(row.rto_seconds),
      rpoSeconds: Number(row.rpo_seconds),
      steps: (row.steps as FailoverStep[]) ?? [],
      isActive: Boolean(row.is_active),
      createdAt: new Date(String(row.created_at)),
      updatedAt: new Date(String(row.updated_at)),
    };
  }

  static async listFailoverPlans(tenantId: string): Promise<FailoverPlan[]> {
    const { data } = await supabaseAdmin
      .from("failover_plans" as never)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    return (data ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id),
        tenantId: String(row.tenant_id),
        name: String(row.name),
        description: (row.description as string | null) ?? undefined,
        sourceRegionId: String(row.source_region_id),
        targetRegionId: String(row.target_region_id),
        failoverType: row.failover_type as FailoverPlan["failoverType"],
        triggers: (row.triggers as FailoverTrigger[]) ?? [],
        rtoSeconds: Number(row.rto_seconds),
        rpoSeconds: Number(row.rpo_seconds),
        steps: (row.steps as FailoverStep[]) ?? [],
        isActive: Boolean(row.is_active),
        createdAt: new Date(String(row.created_at)),
        updatedAt: new Date(String(row.updated_at)),
      } satisfies FailoverPlan;
    });
  }

  static async initiateFailover(
    tenantId: string,
    planId: string,
    triggerType: FailoverTrigger["type"],
    triggerReason: string,
  ): Promise<FailoverEvent> {
    const { data: plan, error: planErr } = await supabaseAdmin
      .from("failover_plans" as never)
      .select("*")
      .eq("id", planId)
      .eq("tenant_id", tenantId)
      .single();
    if (planErr || !plan) throw new Error(`Failover plan ${planId} not found`);
    const p = plan as Record<string, unknown>;
    const id = `failover_${crypto.randomUUID()}`;
    const nowIso = new Date().toISOString();
    await supabaseAdmin.from("failover_events" as never).insert({
      id,
      tenant_id: tenantId,
      plan_id: planId,
      trigger_type: triggerType,
      trigger_reason: triggerReason,
      source_region_id: p.source_region_id,
      target_region_id: p.target_region_id,
      status: "initiated",
      initiated_at: nowIso,
      steps_completed: 0,
      steps_failed: 0,
      rolled_back: false,
      metadata: {},
    } as never);

    const event: FailoverEvent = {
      id,
      tenantId,
      planId,
      triggerType,
      triggerReason,
      sourceRegionId: String(p.source_region_id),
      targetRegionId: String(p.target_region_id),
      status: "initiated",
      initiatedAt: new Date(nowIso),
      stepsCompleted: 0,
      stepsFailed: 0,
      rolledBack: false,
      metadata: {},
      createdAt: new Date(nowIso),
      updatedAt: new Date(nowIso),
    };

    await this.executeFailover(event, {
      steps: (p.steps as FailoverStep[]) ?? [],
      targetRegionId: String(p.target_region_id),
      rtoSeconds: Number(p.rto_seconds),
    });
    return event;
  }

  private static async executeFailover(
    event: FailoverEvent,
    plan: { steps: FailoverStep[]; targetRegionId: string; rtoSeconds: number },
  ): Promise<void> {
    const startTime = Date.now();
    await supabaseAdmin
      .from("failover_events" as never)
      .update({ status: "in_progress" } as never)
      .eq("id", event.id);

    const steps = [...plan.steps].sort((a, b) => a.order - b.order);
    let stepsCompleted = 0;
    let stepsFailed = 0;

    for (const step of steps) {
      await supabaseAdmin
        .from("failover_events" as never)
        .update({ current_step_id: step.id } as never)
        .eq("id", event.id);
      try {
        await this.executeStep(step);
        stepsCompleted++;
      } catch (err) {
        stepsFailed++;
        const msg = err instanceof Error ? err.message : String(err);
        if (step.action === "promote_replica" || step.action === "switch_traffic") {
          await this.rollbackFailover(event.id, `Step ${step.name} failed: ${msg}`);
          return;
        }
      }
    }

    await DRRegionManager.promoteToPrimary(plan.targetRegionId, event.tenantId);
    const actualRTOSeconds = (Date.now() - startTime) / 1000;
    await supabaseAdmin
      .from("failover_events" as never)
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        actual_rto_seconds: actualRTOSeconds,
        actual_rpo_seconds: 0,
        steps_completed: stepsCompleted,
        steps_failed: stepsFailed,
      } as never)
      .eq("id", event.id);
  }

  private static async executeStep(step: FailoverStep): Promise<void> {
    // Stub actions — real implementations would call external systems.
    switch (step.action) {
      case "verify_services":
      case "promote_replica":
      case "update_dns":
      case "switch_traffic":
      case "notify_stakeholders":
      case "rollback":
        return;
      default:
        throw new Error(`Unknown step action: ${step.action}`);
    }
  }

  static async rollbackFailover(eventId: string, reason: string): Promise<void> {
    await supabaseAdmin
      .from("failover_events" as never)
      .update({
        status: "rolled_back",
        rolled_back: true,
        rollback_at: new Date().toISOString(),
        rollback_reason: reason,
      } as never)
      .eq("id", eventId);
  }

  static async getFailoverHistory(tenantId: string, limit = 50): Promise<FailoverEvent[]> {
    const { data } = await supabaseAdmin
      .from("failover_events" as never)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("initiated_at", { ascending: false })
      .limit(limit);
    return (data ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id),
        tenantId: String(row.tenant_id),
        planId: String(row.plan_id),
        triggerType: row.trigger_type as FailoverTrigger["type"],
        triggerReason: String(row.trigger_reason),
        sourceRegionId: String(row.source_region_id),
        targetRegionId: String(row.target_region_id),
        status: row.status as FailoverEvent["status"],
        currentStepId: (row.current_step_id as string | null) ?? undefined,
        initiatedAt: new Date(String(row.initiated_at)),
        completedAt: row.completed_at ? new Date(String(row.completed_at)) : undefined,
        actualRTOSeconds: row.actual_rto_seconds != null ? Number(row.actual_rto_seconds) : undefined,
        actualRPOSeconds: row.actual_rpo_seconds != null ? Number(row.actual_rpo_seconds) : undefined,
        stepsCompleted: Number(row.steps_completed ?? 0),
        stepsFailed: Number(row.steps_failed ?? 0),
        errorMessage: (row.error_message as string | null) ?? undefined,
        rolledBack: Boolean(row.rolled_back),
        rollbackAt: row.rollback_at ? new Date(String(row.rollback_at)) : undefined,
        rollbackReason: (row.rollback_reason as string | null) ?? undefined,
        metadata: (row.metadata as Record<string, unknown>) ?? {},
        createdAt: new Date(String(row.created_at)),
        updatedAt: new Date(String(row.updated_at)),
      } satisfies FailoverEvent;
    });
  }
}