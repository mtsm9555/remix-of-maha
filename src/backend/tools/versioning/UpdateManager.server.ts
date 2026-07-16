import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { VersionRegistry } from "./VersionRegistry.server";
import type { ToolVersionRecord } from "./VersioningTypes";

const ROLLBACK_ERROR_THRESHOLD = 0.15;

export class UpdateManager {
  /**
   * Publishes an update. MAJOR bumps stay active in registry but require manual
   * pin/rollout; MINOR/PATCH auto-activate and are subject to later health checks.
   * (Health check is triggered by cron -> evaluateVersionHealth, not setTimeout —
   * Workers are stateless.)
   */
  static async publishUpdate(toolName: string, newVersion: ToolVersionRecord): Promise<{ autoDeployed: boolean }> {
    const previous = await VersionRegistry.getLatestActiveVersion(toolName);
    if (!previous || previous.id === newVersion.id) {
      await VersionRegistry.updateStatus(newVersion.id, "active");
      return { autoDeployed: true };
    }

    const isMajor = newVersion.semver.major > previous.semver.major;
    if (isMajor) {
      await VersionRegistry.updateStatus(newVersion.id, "active");
      return { autoDeployed: false };
    }
    await this.activateVersion(toolName, newVersion.id);
    return { autoDeployed: true };
  }

  /**
   * Evaluate the last 30 minutes of execution events for a tool version and
   * roll back if error rate exceeds threshold. Call from a cron endpoint.
   */
  static async evaluateVersionHealth(toolName: string, versionId: string): Promise<{ rolledBack: boolean; errorRate: number }> {
    const cutoff = new Date(Date.now() - 30 * 60_000).toISOString();
    const { data: events } = await supabaseAdmin
      .from("tool_execution_events")
      .select("success")
      .eq("tool_name", toolName)
      .gte("timestamp", cutoff);

    if (!events || events.length < 10) return { rolledBack: false, errorRate: 0 };

    const errorRate = events.filter((e) => !e.success).length / events.length;
    if (errorRate > ROLLBACK_ERROR_THRESHOLD) {
      await this.rollbackVersion(toolName, versionId);
      return { rolledBack: true, errorRate };
    }
    return { rolledBack: false, errorRate };
  }

  static async rollbackVersion(toolName: string, badVersionId: string): Promise<void> {
    await VersionRegistry.updateStatus(badVersionId, "rolling_back");
    const { data: previous } = await supabaseAdmin
      .from("tool_versions")
      .select("id")
      .eq("tool_name", toolName)
      .eq("status", "active")
      .neq("id", badVersionId)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (previous) await VersionRegistry.updateStatus(previous.id as string, "active");
    await VersionRegistry.updateStatus(badVersionId, "archived", { archived_at: new Date().toISOString() });
  }

  private static async activateVersion(toolName: string, versionId: string): Promise<void> {
    await supabaseAdmin
      .from("tool_versions")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .eq("tool_name", toolName)
      .eq("status", "active")
      .neq("id", versionId);
    await VersionRegistry.updateStatus(versionId, "active");
  }
}