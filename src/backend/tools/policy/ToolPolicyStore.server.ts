import type { ToolPolicyRule } from "./ToolPolicyTypes";

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { at: number; rules: ToolPolicyRule[] } | null = null;

function mapRow(row: Record<string, unknown>): ToolPolicyRule {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? undefined,
    scope: row.scope as ToolPolicyRule["scope"],
    targetToolName: row.target_tool_name as string,
    targetDepartment: (row.target_department as string | null) ?? undefined,
    targetAgentId: (row.target_agent_id as string | null) ?? undefined,
    conditions: (row.conditions as ToolPolicyRule["conditions"]) ?? [],
    logic: row.logic as ToolPolicyRule["logic"],
    action: row.action as ToolPolicyRule["action"],
    actionConfig: (row.action_config as ToolPolicyRule["actionConfig"]) ?? undefined,
    priority: (row.priority as number) ?? 0,
    isActive: (row.is_active as boolean) ?? true,
  };
}

export class ToolPolicyStore {
  static async getActivePolicies(): Promise<ToolPolicyRule[]> {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.rules;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("tool_policies")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false });
    if (error) throw new Error(`Policy fetch failed: ${error.message}`);

    const rules = (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
    cache = { at: Date.now(), rules };
    return rules;
  }

  static invalidateCache() {
    cache = null;
  }
}