export type NetworkPolicy = "none" | "restricted_allowlist" | "full";
export type FilesystemPolicy = "readonly" | "scratch_only";

export interface SandboxConfig {
  toolName: string;
  version: string;
  timeoutMs: number;
  memoryLimitMB: number;
  cpuQuota: number;
  networkPolicy: NetworkPolicy;
  allowedDomains?: string[];
  filesystemPolicy: FilesystemPolicy;
  environmentVariables: Record<string, string>;
}

export interface SandboxSecurityViolation {
  type:
    | "NETWORK_BLOCKED"
    | "FILESYSTEM_WRITE_BLOCKED"
    | "TIMEOUT_KILLED"
    | "OOM_KILLED"
    | "PRIVILEGE_ESCALATION";
  details: string;
  timestamp: Date;
}

export interface SandboxExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  memoryUsedMB: number;
  securityViolations: SandboxSecurityViolation[];
}