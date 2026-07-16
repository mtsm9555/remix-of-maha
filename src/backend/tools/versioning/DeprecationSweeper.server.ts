import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { VersionRegistry } from "./VersionRegistry.server";

const DEPRECATION_GRACE_MS = 90 * 24 * 60 * 60_000;
const ARCHIVAL_GRACE_MS = 180 * 24 * 60 * 60_000;

export class DeprecationSweeper {
  /**
   * Run once per day via cron (/api/public/tools/versioning/sweep).
   */
  static async runLifecycleChecks(): Promise<{ deprecated: number; archived: number }> {
    const now = new Date();
    let deprecated = 0;
    let archived = 0;

    const { data: oldActive } = await supabaseAdmin
      .from("tool_versions")
      .select("id, tool_name, published_at")
      .eq("status", "active")
      .lt("published_at", new Date(now.getTime() - DEPRECATION_GRACE_MS).toISOString());

    for (const v of oldActive ?? []) {
      const newer = await VersionRegistry.getLatestActiveVersion(v.tool_name as string);
      if (newer && newer.publishedAt.toISOString() > (v.published_at as string) && newer.id !== v.id) {
        await supabaseAdmin
          .from("tool_versions")
          .update({ status: "deprecated", deprecated_at: now.toISOString() })
          .eq("id", v.id as string);
        deprecated++;
      }
    }

    const { data: oldDeprecated } = await supabaseAdmin
      .from("tool_versions")
      .select("id")
      .eq("status", "deprecated")
      .lt("deprecated_at", new Date(now.getTime() - ARCHIVAL_GRACE_MS).toISOString());

    for (const v of oldDeprecated ?? []) {
      await supabaseAdmin
        .from("tool_versions")
        .update({ status: "archived", archived_at: now.toISOString() })
        .eq("id", v.id as string);
      archived++;
    }

    return { deprecated, archived };
  }
}