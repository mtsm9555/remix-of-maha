import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import type { SemVer, ToolVersionRecord, VersionStatus } from "./VersioningTypes";

function rowToRecord(row: {
  id: string; tool_name: string; version: string;
  major: number; minor: number; patch: number;
  status: string; manifest: unknown; changelog: string | null;
  published_at: string; deprecated_at: string | null; archived_at: string | null;
}): ToolVersionRecord {
  return {
    id: row.id,
    toolName: row.tool_name,
    version: row.version,
    semver: { major: row.major, minor: row.minor, patch: row.patch },
    status: row.status as VersionStatus,
    manifest: row.manifest,
    publishedAt: new Date(row.published_at),
    deprecatedAt: row.deprecated_at ? new Date(row.deprecated_at) : undefined,
    archivedAt: row.archived_at ? new Date(row.archived_at) : undefined,
    changelog: row.changelog ?? "",
  };
}

export class VersionRegistry {
  static parseSemVer(version: string): SemVer {
    const m = version.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
    if (!m) throw new Error(`Invalid SemVer: ${version}`);
    return { major: parseInt(m[1], 10), minor: parseInt(m[2], 10), patch: parseInt(m[3], 10) };
  }

  static async registerVersion(
    toolName: string,
    versionString: string,
    manifest: Json,
    changelog: string,
  ): Promise<ToolVersionRecord> {
    const semver = this.parseSemVer(versionString);
    const row = {
      id: `ver_${toolName}_${versionString}`,
      tool_name: toolName,
      version: versionString,
      major: semver.major,
      minor: semver.minor,
      patch: semver.patch,
      status: "active" as const,
      manifest,
      changelog,
      published_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin.from("tool_versions").insert(row);
    if (error) throw new Error(`Failed to register version: ${error.message}`);
    return rowToRecord({ ...row, deprecated_at: null, archived_at: null });
  }

  static async getVersion(toolName: string, version: string): Promise<ToolVersionRecord | null> {
    const { data } = await supabaseAdmin
      .from("tool_versions")
      .select("*")
      .eq("tool_name", toolName)
      .eq("version", version)
      .maybeSingle();
    return data ? rowToRecord(data as never) : null;
  }

  static async getLatestActiveVersion(toolName: string): Promise<ToolVersionRecord | null> {
    const { data } = await supabaseAdmin
      .from("tool_versions")
      .select("*")
      .eq("tool_name", toolName)
      .eq("status", "active")
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ? rowToRecord(data as never) : null;
  }

  static async resolveVersionForAgent(
    agentId: string,
    department: string,
    toolName: string,
  ): Promise<ToolVersionRecord | null> {
    const { data: pin } = await supabaseAdmin
      .from("agent_tool_pins")
      .select("pinned_version")
      .eq("agent_id", agentId)
      .eq("tool_name", toolName)
      .maybeSingle();
    if (pin) return this.getVersion(toolName, pin.pinned_version as string);

    const { data: deptPin } = await supabaseAdmin
      .from("agent_tool_pins")
      .select("pinned_version")
      .eq("agent_id", `dept:${department}`)
      .eq("tool_name", toolName)
      .maybeSingle();
    if (deptPin) return this.getVersion(toolName, deptPin.pinned_version as string);

    return this.getLatestActiveVersion(toolName);
  }

  static async updateStatus(versionId: string, status: VersionStatus, extra: Record<string, string> = {}) {
    await supabaseAdmin.from("tool_versions").update({ status, ...extra }).eq("id", versionId);
  }
}