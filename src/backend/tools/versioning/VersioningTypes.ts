export interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

export type VersionStatus = "active" | "deprecated" | "archived" | "rolling_back";
export type UpdatePolicy = "auto_minor_patch" | "manual_major" | "pinned";

export interface ToolVersionRecord {
  id: string;
  toolName: string;
  version: string;
  semver: SemVer;
  status: VersionStatus;
  manifest: unknown;
  publishedAt: Date;
  deprecatedAt?: Date;
  archivedAt?: Date;
  changelog: string;
}

export interface AgentToolPin {
  agentId: string;
  department: string;
  toolName: string;
  pinnedVersion: string;
  reason: string;
  pinnedAt: Date;
}