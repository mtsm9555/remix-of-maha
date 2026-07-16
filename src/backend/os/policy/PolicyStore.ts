import type { PolicyRule } from "./PolicyTypes";

export class PolicyStore {
  private static cachedRules: PolicyRule[] = [];
  private static lastLoaded: Date = new Date(0);
  private static CACHE_TTL_MS = 60_000;

  static async getActiveRules(): Promise<PolicyRule[]> {
    const now = new Date();
    if (now.getTime() - this.lastLoaded.getTime() < this.CACHE_TTL_MS && this.cachedRules.length > 0) {
      return this.cachedRules;
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin
        .from("enterprise_policies")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false });

      if (error) {
        console.error("[PolicyStore] Failed to load policies:", error);
        return this.cachedRules;
      }

      this.cachedRules = ((data as any[]) ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        conditions: row.conditions,
        logic: row.logic,
        action: row.action,
        priority: row.priority,
        isActive: row.is_active,
        department: row.department,
      }));
      this.lastLoaded = now;
    } catch (err) {
      console.error("[PolicyStore] Persistence unavailable:", err);
    }
    return this.cachedRules;
  }

  static invalidateCache() {
    this.lastLoaded = new Date(0);
    console.log("[PolicyStore] Policy cache invalidated.");
  }
}