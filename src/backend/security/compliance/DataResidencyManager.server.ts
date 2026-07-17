import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { DataResidencyRequirement } from "./ComplianceLayerTypes";

const EU = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
]);

export class DataResidencyManager {
  static async createPolicy(
    tenantId: string,
    name: string,
    requirement: DataResidencyRequirement,
    options: {
      description?: string;
      allowedCountries?: string[];
      allowedRegions?: string[];
      enforceOnCreate?: boolean;
      enforceOnUpdate?: boolean;
      blockNonCompliant?: boolean;
    } = {},
  ) {
    const policy = {
      id: `policy_${crypto.randomUUID()}`,
      tenant_id: tenantId,
      name,
      description: options.description ?? null,
      requirement,
      allowed_countries: options.allowedCountries ?? [],
      allowed_regions: options.allowedRegions ?? [],
      enforce_on_create: options.enforceOnCreate !== false,
      enforce_on_update: options.enforceOnUpdate !== false,
      block_non_compliant: options.blockNonCompliant ?? false,
      monitor_continuously: true,
      alert_on_violation: true,
      is_active: true,
      violations: 0,
    };
    await supabaseAdmin.from("data_residency_policies").insert(policy);
    return policy;
  }

  static async listPolicies(tenantId: string) {
    const { data } = await supabaseAdmin
      .from("data_residency_policies")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    return data ?? [];
  }

  static async validateDataLocation(tenantId: string, dataLocation: string) {
    const { data: policies } = await supabaseAdmin
      .from("data_residency_policies")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true);
    if (!policies || policies.length === 0) return { compliant: true, reason: "No policies configured" };
    const upper = dataLocation.toUpperCase();
    for (const p of policies) {
      let ok = false;
      switch (p.requirement) {
        case "eu_only":
          ok = EU.has(upper);
          break;
        case "us_only":
          ok = upper === "US";
          break;
        case "specific_countries":
          ok = (p.allowed_countries ?? []).map((c: string) => c.toUpperCase()).includes(upper);
          break;
        case "no_restrictions":
          ok = true;
          break;
      }
      if (!ok) {
        await supabaseAdmin
          .from("data_residency_policies")
          .update({ violations: (p.violations ?? 0) + 1, last_violation_at: new Date().toISOString() })
          .eq("id", p.id);
        return { compliant: false, policy: p, reason: `Violates ${p.requirement}` };
      }
    }
    return { compliant: true };
  }
}