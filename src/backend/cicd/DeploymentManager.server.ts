import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Deployment } from "./CICDPlatformTypes";

export class DeploymentManager {
  static async deploy(
    environmentId: string,
    runId: string,
    tenantId: string,
    deployedBy: string,
    approvedBy?: string,
  ): Promise<Deployment> {
    const { data: env } = await supabaseAdmin
      .from("environments")
      .select("*")
      .eq("id", environmentId)
      .eq("tenant_id", tenantId)
      .single();
    if (!env) throw new Error("Environment not found");
    if (env.require_approval && !approvedBy) throw new Error("Deployment requires approval");

    const { data: run } = await supabaseAdmin
      .from("pipeline_runs")
      .select("*")
      .eq("id", runId)
      .eq("tenant_id", tenantId)
      .single();
    if (!run) throw new Error("Pipeline run not found");

    const { data: previous } = await supabaseAdmin
      .from("deployments")
      .select("id")
      .eq("environment_id", environmentId)
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const id = `deploy_${crypto.randomUUID()}`;
    const startedAt = new Date();
    const version = run.commit_hash ?? run.tag ?? "unknown";

    await supabaseAdmin.from("deployments").insert({
      id,
      environment_id: environmentId,
      run_id: runId,
      tenant_id: tenantId,
      version,
      commit_hash: run.commit_hash,
      strategy: env.deployment_strategy,
      status: "deploying",
      started_at: startedAt.toISOString(),
      deployed_by: deployedBy,
      approved_by: approvedBy,
      previous_deployment_id: previous?.id,
      health_check_url: env.url,
    });

    // Stubbed deploy — mark success immediately.
    const completedAt = new Date();
    await supabaseAdmin
      .from("deployments")
      .update({
        status: "success",
        completed_at: completedAt.toISOString(),
        duration_seconds: Math.round((completedAt.getTime() - startedAt.getTime()) / 1000),
        health_check_passed: true,
      })
      .eq("id", id);

    return {
      id,
      environmentId,
      runId,
      tenantId,
      version,
      commitHash: run.commit_hash ?? undefined,
      strategy: env.deployment_strategy as Deployment["strategy"],
      status: "success",
      startedAt,
      completedAt,
      durationSeconds: Math.round((completedAt.getTime() - startedAt.getTime()) / 1000),
      deployedBy,
      approvedBy,
      previousDeploymentId: previous?.id,
      healthCheckPassed: true,
      healthCheckUrl: env.url ?? undefined,
      createdAt: startedAt,
    };
  }

  static async rollback(deploymentId: string, tenantId: string, reason: string) {
    const { data: dep } = await supabaseAdmin
      .from("deployments")
      .select("*")
      .eq("id", deploymentId)
      .eq("tenant_id", tenantId)
      .single();
    if (!dep) throw new Error("Deployment not found");
    await supabaseAdmin
      .from("deployments")
      .update({ status: "rolled_back", rollback_reason: reason })
      .eq("id", deploymentId);
    return { ok: true, previousDeploymentId: dep.previous_deployment_id };
  }
}