import { WorkerSandboxExecutor } from "./WorkerSandboxExecutor.server";
import type { SandboxConfig, SandboxExecutionResult } from "./SandboxTypes";

export interface SandboxRunContext {
  agentId: string;
}

export class SandboxOrchestrator {
  static async executeSandboxedTool(
    toolName: string,
    version: string,
    payloadSource: string,
    args: Record<string, unknown>,
    context: SandboxRunContext,
    manifest?: {
      requestedPermissions?: string[];
      allowedDomains?: string[];
    },
  ): Promise<SandboxExecutionResult> {
    const wantsNetwork =
      manifest?.requestedPermissions?.includes("network_access") ?? false;

    const config: SandboxConfig = {
      toolName,
      version,
      timeoutMs: 5000,
      memoryLimitMB: 128,
      cpuQuota: 50000,
      networkPolicy: wantsNetwork ? "restricted_allowlist" : "none",
      allowedDomains: manifest?.allowedDomains ?? [],
      filesystemPolicy: "readonly",
      environmentVariables: {
        TOOL_ARGS: JSON.stringify(args),
        AGENT_ID: context.agentId,
      },
    };

    const result = await WorkerSandboxExecutor.execute(payloadSource, config);

    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data: exec } = await supabaseAdmin
        .from("sandbox_executions")
        .insert({
          tool_name: toolName,
          tool_version: version,
          agent_id: context.agentId,
          exit_code: result.exitCode,
          execution_time_ms: result.executionTimeMs,
          memory_used_mb: result.memoryUsedMB,
          success: result.success,
          stderr: result.stderr.slice(0, 4000),
        })
        .select("id")
        .single();

      if (exec && result.securityViolations.length > 0) {
        await supabaseAdmin.from("sandbox_security_violations").insert(
          result.securityViolations.map((v) => ({
            execution_id: exec.id,
            tool_name: toolName,
            violation_type: v.type,
            details: v.details,
          })),
        );
      }
    } catch (err) {
      console.error("[SandboxOrchestrator] telemetry write failed", err);
    }

    return result;
  }
}