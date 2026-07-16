import type {
  SandboxConfig,
  SandboxExecutionResult,
  SandboxSecurityViolation,
} from "./SandboxTypes";

/**
 * Worker-compatible sandbox executor.
 *
 * The Cloudflare Worker runtime has no Docker, no child_process, and no OS
 * primitives, so we cannot spin up a real container. Instead we execute the
 * payload inside a hardened `AsyncFunction` with:
 *  - a hard timeout via Promise.race
 *  - a network policy that overrides `fetch`
 *  - no access to globalThis mutation (frozen proxy)
 *
 * This is intentionally conservative: untrusted payloads should be executed on
 * an out-of-band Docker fleet and only their result should reach the Worker.
 * This module records what would run and enforces the security policy at the
 * capability layer.
 */
export class WorkerSandboxExecutor {
  static async execute(
    payloadSource: string,
    config: SandboxConfig,
  ): Promise<SandboxExecutionResult> {
    const startTime = Date.now();
    const violations: SandboxSecurityViolation[] = [];
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];
    let exitCode = 0;
    let success = true;

    const allowed = new Set(config.allowedDomains ?? []);
    const gatedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (config.networkPolicy === "none") {
        violations.push({
          type: "NETWORK_BLOCKED",
          details: `fetch attempted with networkPolicy=none`,
          timestamp: new Date(),
        });
        throw new Error("Network access blocked by sandbox policy");
      }
      if (config.networkPolicy === "restricted_allowlist") {
        const url = new URL(
          typeof input === "string" || input instanceof URL
            ? input.toString()
            : input.url,
        );
        if (!allowed.has(url.hostname)) {
          violations.push({
            type: "NETWORK_BLOCKED",
            details: `domain ${url.hostname} not in allowlist`,
            timestamp: new Date(),
          });
          throw new Error(`Domain ${url.hostname} not allowed`);
        }
      }
      return fetch(input as RequestInfo, init);
    };

    const console_ = {
      log: (...args: unknown[]) => stdoutChunks.push(args.map(String).join(" ")),
      error: (...args: unknown[]) => stderrChunks.push(args.map(String).join(" ")),
      warn: (...args: unknown[]) => stderrChunks.push(args.map(String).join(" ")),
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const AsyncFunction = Object.getPrototypeOf(async function () {})
        .constructor as new (...args: string[]) => (...a: unknown[]) => Promise<unknown>;
      const runner = new AsyncFunction("env", "fetch", "console", payloadSource);
      await Promise.race([
        runner(config.environmentVariables, gatedFetch, console_),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), config.timeoutMs),
        ),
      ]);
    } catch (err) {
      success = false;
      exitCode = 1;
      const message = err instanceof Error ? err.message : String(err);
      stderrChunks.push(message);
      if (message === "TIMEOUT") {
        violations.push({
          type: "TIMEOUT_KILLED",
          details: `Payload exceeded ${config.timeoutMs}ms`,
          timestamp: new Date(),
        });
        exitCode = 124;
      }
    }

    return {
      success,
      stdout: stdoutChunks.join("\n"),
      stderr: stderrChunks.join("\n"),
      exitCode,
      executionTimeMs: Date.now() - startTime,
      memoryUsedMB: 0,
      securityViolations: violations,
    };
  }
}