import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { BackupManager } from "./BackupManager.server";
import type { BackupType, BackupTarget, BackupStorage } from "./BackupSystemTypes";

function computeNextRun(freq: string, from: Date): Date {
  const d = new Date(from);
  switch (freq) {
    case "hourly": d.setHours(d.getHours() + 1); break;
    case "daily": d.setDate(d.getDate() + 1); break;
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    default: d.setDate(d.getDate() + 1);
  }
  return d;
}

export class BackupScheduler {
  static async tickPolicies(): Promise<number> {
    const now = new Date();
    const { data: policies } = await supabaseAdmin
      .from("backup_policies")
      .select("*")
      .eq("is_active", true)
      .or(`next_run_at.is.null,next_run_at.lte.${now.toISOString()}`);
    let executed = 0;
    for (const policy of policies ?? []) {
      const job = await BackupManager.createBackupJob(
        String(policy.tenant_id),
        policy.type as BackupType,
        policy.target as BackupTarget,
        policy.storage as BackupStorage,
        {
          includeTables: (policy.include_tables as string[]) ?? [],
          excludeTables: (policy.exclude_tables as string[]) ?? [],
          retentionDays: Number(policy.retention_days ?? 30),
        }
      );
      await BackupManager.executeBackup(job.id);
      await supabaseAdmin
        .from("backup_policies")
        .update({
          last_run_at: now.toISOString(),
          next_run_at: computeNextRun(String(policy.frequency), now).toISOString(),
        })
        .eq("id", policy.id);
      executed++;
    }
    return executed;
  }
}