import type { JobDefinition } from "./CICDPlatformTypes";

/**
 * Worker-runtime job runner stub.
 * Cloudflare Workers cannot spawn containers or child processes.
 * This implementation simulates execution and records logs, so pipelines
 * can be modeled end-to-end without a real build agent. Wire a remote
 * build agent by calling out to an HTTP runner instead of expanding this.
 */
export class JobRunner {
  static async execute(config: {
    jobId: string;
    job: JobDefinition;
    environment: Record<string, string>;
  }): Promise<{ logs: string[]; exitCode: number; artifacts: string[] }> {
    const logs: string[] = [];
    logs.push(`[runner] image=${config.job.image ?? "node:18-alpine"}`);
    for (const cmd of config.job.commands) {
      logs.push(`$ ${cmd}`);
      logs.push(`(simulated) ok`);
    }
    return { logs, exitCode: 0, artifacts: config.job.artifacts?.paths ?? [] };
  }
}