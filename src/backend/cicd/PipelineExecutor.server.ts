import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { JobRunner } from "./JobRunner";
import type {
  PipelineRun,
  PipelineStatus,
  StageRun,
  JobRun,
  PipelineDefinition,
  JobStatus,
} from "./CICDPlatformTypes";

export class PipelineExecutor {
  static async execute(
    pipelineId: string,
    tenantId: string,
    triggeredBy: string,
    triggerType: string,
    context: {
      commitHash?: string;
      commitMessage?: string;
      branch?: string;
      tag?: string;
      variables?: Record<string, string>;
    } = {},
  ): Promise<PipelineRun> {
    const { data: pipeline, error } = await supabaseAdmin
      .from("pipelines")
      .select("*")
      .eq("id", pipelineId)
      .eq("tenant_id", tenantId)
      .single();
    if (error || !pipeline) throw new Error("Pipeline not found");

    const runId = `run_${crypto.randomUUID()}`;
    const startedAt = new Date();
    const variables = {
      ...((pipeline.variables as Record<string, string> | null) ?? {}),
      ...(context.variables ?? {}),
    };

    await supabaseAdmin.from("pipeline_runs").insert({
      id: runId,
      pipeline_id: pipelineId,
      tenant_id: tenantId,
      triggered_by: triggeredBy,
      trigger_type: triggerType,
      commit_hash: context.commitHash,
      commit_message: context.commitMessage,
      branch: context.branch ?? pipeline.branch,
      tag: context.tag,
      status: "running",
      started_at: startedAt.toISOString(),
      variables,
    });

    const definition = pipeline.definition as unknown as PipelineDefinition;
    const stageRuns: StageRun[] = [];
    let overall: PipelineStatus = "success";

    for (const stageDef of definition.stages) {
      const stageId = `stage_${crypto.randomUUID()}`;
      const stageStart = new Date();
      const jobRuns: JobRun[] = [];
      let stageStatus: JobStatus = "success";

      const jobPromises = stageDef.jobs.map(async (jobDef) => {
        const jobId = `job_${crypto.randomUUID()}`;
        const jobStart = new Date();
        const result = await JobRunner.execute({
          jobId,
          job: jobDef,
          environment: { ...variables, ...(jobDef.environment ?? {}) },
        });
        const jobEnd = new Date();
        const status: JobStatus = result.exitCode === 0 ? "success" : "failed";
        const run: JobRun = {
          id: jobId,
          stageId,
          name: jobDef.name,
          image: jobDef.image ?? "node:18-alpine",
          commands: jobDef.commands,
          status,
          startedAt: jobStart,
          completedAt: jobEnd,
          durationSeconds: Math.round((jobEnd.getTime() - jobStart.getTime()) / 1000),
          logs: result.logs,
          exitCode: result.exitCode,
          artifacts: result.artifacts,
          retryCount: 0,
          maxRetries: jobDef.retry ?? 0,
        };
        return run;
      });

      const results = stageDef.parallel
        ? await Promise.all(jobPromises)
        : await (async () => {
            const acc: JobRun[] = [];
            for (const p of jobPromises) acc.push(await p);
            return acc;
          })();

      jobRuns.push(...results);
      if (results.some((r) => r.status === "failed")) {
        stageStatus = "failed";
        if (!stageDef.allowFailure) overall = "failed";
      }
      const stageEnd = new Date();
      stageRuns.push({
        id: stageId,
        runId,
        name: stageDef.name,
        status: stageStatus,
        startedAt: stageStart,
        completedAt: stageEnd,
        durationSeconds: Math.round((stageEnd.getTime() - stageStart.getTime()) / 1000),
        jobs: jobRuns,
      });
      if (overall === "failed") break;
    }

    const completedAt = new Date();
    const durationSeconds = Math.round((completedAt.getTime() - startedAt.getTime()) / 1000);

    await supabaseAdmin
      .from("pipeline_runs")
      .update({
        status: overall,
        completed_at: completedAt.toISOString(),
        duration_seconds: durationSeconds,
        stages: stageRuns as unknown as never,
      })
      .eq("id", runId);

    await supabaseAdmin
      .from("pipelines")
      .update({
        last_run_at: completedAt.toISOString(),
        last_run_status: overall,
        run_count: (pipeline.run_count ?? 0) + 1,
      })
      .eq("id", pipelineId);

    return {
      id: runId,
      pipelineId,
      tenantId,
      triggeredBy,
      triggerType: triggerType as PipelineRun["triggerType"],
      commitHash: context.commitHash,
      commitMessage: context.commitMessage,
      branch: context.branch ?? pipeline.branch,
      tag: context.tag,
      status: overall,
      startedAt,
      completedAt,
      durationSeconds,
      stages: stageRuns,
      artifacts: [],
      variables,
      createdAt: startedAt,
    };
  }
}