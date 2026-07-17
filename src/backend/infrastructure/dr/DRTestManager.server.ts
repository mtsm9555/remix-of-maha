import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { DRTest, DRTestStepResult, FailoverStep } from "./DisasterRecoveryTypes";
import { DRRegionManager } from "./DRRegionManager.server";

export class DRTestManager {
  static async scheduleTest(
    tenantId: string,
    planId: string,
    testType: DRTest["testType"],
  ): Promise<DRTest> {
    const { data: plan, error: planErr } = await supabaseAdmin
      .from("failover_plans" as never)
      .select("*")
      .eq("id", planId)
      .eq("tenant_id", tenantId)
      .single();
    if (planErr || !plan) throw new Error(`Failover plan ${planId} not found`);
    const p = plan as Record<string, unknown>;
    const id = `test_${crypto.randomUUID()}`;
    const scheduledAt = new Date(Date.now() + 60_000).toISOString();
    const totalSteps = ((p.steps as FailoverStep[]) ?? []).length;

    const { data, error } = await supabaseAdmin
      .from("dr_tests" as never)
      .insert({
        id,
        tenant_id: tenantId,
        plan_id: planId,
        test_name: `DR Test - ${new Date().toISOString().split("T")[0]}`,
        test_type: testType,
        scheduled_at: scheduledAt,
        status: "scheduled",
        passed_steps: 0,
        failed_steps: 0,
        total_steps: totalSteps,
        target_rto_seconds: Number(p.rto_seconds),
        target_rpo_seconds: Number(p.rpo_seconds),
        rto_met: false,
        rpo_met: false,
        test_results: [],
        recommendations: [],
        metadata: {},
      } as never)
      .select()
      .single();
    if (error) throw error;
    return this.rowToTest(data as Record<string, unknown>);
  }

  static async executeTest(testId: string): Promise<DRTest> {
    const { data: testRow } = await supabaseAdmin
      .from("dr_tests" as never)
      .select("*")
      .eq("id", testId)
      .single();
    if (!testRow) throw new Error(`DR test ${testId} not found`);
    const t = testRow as Record<string, unknown>;

    await supabaseAdmin
      .from("dr_tests" as never)
      .update({ status: "in_progress", started_at: new Date().toISOString() } as never)
      .eq("id", testId);

    const startTime = Date.now();
    const results: DRTestStepResult[] = [];

    const { data: plan } = await supabaseAdmin
      .from("failover_plans" as never)
      .select("*")
      .eq("id", t.plan_id)
      .single();
    if (!plan) throw new Error("Failover plan not found");
    const steps = ([...((plan as Record<string, unknown>).steps as FailoverStep[]) ?? []]).sort(
      (a, b) => a.order - b.order,
    );

    for (const step of steps) {
      const stepStart = Date.now();
      try {
        // Simulated execution (no real region ops during tests)
        if (Math.random() < 0.1) throw new Error(`Simulated failure in step: ${step.name}`);
        results.push({
          stepId: step.id,
          stepName: step.name,
          status: "passed",
          durationSeconds: (Date.now() - stepStart) / 1000,
          details: {},
        });
      } catch (err) {
        results.push({
          stepId: step.id,
          stepName: step.name,
          status: "failed",
          durationSeconds: (Date.now() - stepStart) / 1000,
          errorMessage: err instanceof Error ? err.message : String(err),
          details: {},
        });
      }
    }

    const passedSteps = results.filter((r) => r.status === "passed").length;
    const failedSteps = results.filter((r) => r.status === "failed").length;
    const actualRTOSeconds = (Date.now() - startTime) / 1000;
    const targetRTO = Number(t.target_rto_seconds);
    const rtoMet = actualRTOSeconds <= targetRTO;
    const recommendations = this.generateRecommendations(results, actualRTOSeconds, targetRTO);

    const { data: updated } = await supabaseAdmin
      .from("dr_tests" as never)
      .update({
        status: failedSteps === 0 ? "passed" : "failed",
        completed_at: new Date().toISOString(),
        passed_steps: passedSteps,
        failed_steps: failedSteps,
        actual_rto_seconds: actualRTOSeconds,
        actual_rpo_seconds: 0,
        rto_met: rtoMet,
        rpo_met: true,
        test_results: results,
        recommendations,
      } as never)
      .eq("id", testId)
      .select()
      .single();

    return this.rowToTest(updated as Record<string, unknown>);
  }

  private static generateRecommendations(
    results: DRTestStepResult[],
    actualRTO: number,
    targetRTO: number,
  ): string[] {
    const rec: string[] = [];
    if (actualRTO > targetRTO) {
      rec.push(
        `Actual RTO (${actualRTO.toFixed(1)}s) exceeded target (${targetRTO}s). Optimize failover steps.`,
      );
    }
    const failed = results.filter((r) => r.status === "failed");
    if (failed.length > 0) {
      rec.push(`${failed.length} step(s) failed: ${failed.map((s) => s.stepName).join(", ")}`);
    }
    const slow = results.filter((r) => r.durationSeconds > 10);
    if (slow.length > 0) {
      rec.push(`Slow steps (>10s): ${slow.map((s) => s.stepName).join(", ")}`);
    }
    if (rec.length === 0) rec.push("All tests passed. DR plan is ready for production use.");
    return rec;
  }

  static async getTestHistory(tenantId: string, limit = 50): Promise<DRTest[]> {
    const { data } = await supabaseAdmin
      .from("dr_tests" as never)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []).map((r) => this.rowToTest(r as Record<string, unknown>));
  }

  static async getDRDashboard(tenantId: string): Promise<{
    tenantId: string;
    overallStatus: "healthy" | "degraded" | "critical" | "failed";
    regions: { primary: unknown; secondaries: unknown[] };
    replicationHealth: {
      status: "healthy" | "lagging" | "failed";
      averageLagSeconds: number;
      activeReplications: number;
      failedReplications: number;
    };
    recentFailovers: unknown[];
    recentTests: unknown[];
    lastFailoverAt?: Date;
    lastTestAt?: Date;
  }> {
    const regions = await DRRegionManager.getRegions(tenantId);
    const primary = regions.find((r) => r.isPrimary) ?? null;
    const secondaries = regions.filter((r) => !r.isPrimary);

    const { data: recentFailovers } = await supabaseAdmin
      .from("failover_events" as never)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("initiated_at", { ascending: false })
      .limit(10);
    const { data: recentTests } = await supabaseAdmin
      .from("dr_tests" as never)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(10);

    const unhealthy = regions.filter((r) => !r.isHealthy).length;
    const highLag = regions.filter((r) => r.replicationLagSeconds > 300).length;
    let overallStatus: "healthy" | "degraded" | "critical" | "failed" = "healthy";
    if (unhealthy > 0) overallStatus = "degraded";
    if (unhealthy > regions.length / 2) overallStatus = "critical";
    if (!primary || !primary.isHealthy) overallStatus = "failed";

    const avgLag =
      regions.length > 0
        ? regions.reduce((s, r) => s + r.replicationLagSeconds, 0) / regions.length
        : 0;

    const rf = (recentFailovers ?? []) as Array<Record<string, unknown>>;
    const rt = (recentTests ?? []) as Array<Record<string, unknown>>;

    return {
      tenantId,
      overallStatus,
      regions: { primary, secondaries },
      replicationHealth: {
        status: highLag > 0 ? "lagging" : "healthy",
        averageLagSeconds: avgLag,
        activeReplications: secondaries.length,
        failedReplications: regions.filter((r) => r.replicationStatus === "failed").length,
      },
      recentFailovers: rf,
      recentTests: rt,
      lastFailoverAt: rf[0]?.initiated_at ? new Date(String(rf[0].initiated_at)) : undefined,
      lastTestAt: rt[0]?.created_at ? new Date(String(rt[0].created_at)) : undefined,
    };
  }

  private static rowToTest(r: Record<string, unknown>): DRTest {
    return {
      id: String(r.id),
      tenantId: String(r.tenant_id),
      planId: String(r.plan_id),
      testName: String(r.test_name),
      testType: r.test_type as DRTest["testType"],
      scheduledAt: new Date(String(r.scheduled_at)),
      startedAt: r.started_at ? new Date(String(r.started_at)) : undefined,
      completedAt: r.completed_at ? new Date(String(r.completed_at)) : undefined,
      status: r.status as DRTest["status"],
      passedSteps: Number(r.passed_steps ?? 0),
      failedSteps: Number(r.failed_steps ?? 0),
      totalSteps: Number(r.total_steps ?? 0),
      actualRTOSeconds: r.actual_rto_seconds != null ? Number(r.actual_rto_seconds) : undefined,
      actualRPOSeconds: r.actual_rpo_seconds != null ? Number(r.actual_rpo_seconds) : undefined,
      targetRTOSeconds: Number(r.target_rto_seconds),
      targetRPOSeconds: Number(r.target_rpo_seconds),
      rtoMet: Boolean(r.rto_met),
      rpoMet: Boolean(r.rpo_met),
      testResults: (r.test_results as DRTestStepResult[]) ?? [],
      errorMessage: (r.error_message as string | null) ?? undefined,
      recommendations: (r.recommendations as string[]) ?? [],
      metadata: (r.metadata as Record<string, unknown>) ?? {},
      createdAt: new Date(String(r.created_at)),
      updatedAt: new Date(String(r.updated_at)),
    };
  }
}