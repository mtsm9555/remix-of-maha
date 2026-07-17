import type { Tenant, TenantConfig } from "./TenantTypes";

const DEFAULT_CONFIG: TenantConfig = {
  maxAgents: 10,
  maxMemoryRecords: 10000,
  allowedModels: ["google/gemini-3-flash-preview"],
  monthlyBudgetLimitUSD: 500,
};

export class TenantStore {
  static async createTenant(
    name: string,
    slug: string,
    ownerUserId: string,
  ): Promise<Tenant> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("tenants" as never)
      .insert({
        name,
        slug,
        plan: "trial",
        status: "active",
        config: DEFAULT_CONFIG as never,
      } as never)
      .select()
      .single();
    if (error) throw new Error(`Failed to create tenant: ${error.message}`);
    const tenant = data as { id: string; slug: string } & Record<string, unknown>;

    const { error: memberErr } = await supabaseAdmin
      .from("tenant_members" as never)
      .insert({ tenant_id: tenant.id, user_id: ownerUserId, role: "owner" } as never);
    if (memberErr) throw new Error(`Failed to add owner: ${memberErr.message}`);

    return tenant as unknown as Tenant;
  }

  static async suspendTenant(tenantId: string, reason: string) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: current } = await supabaseAdmin
      .from("tenants" as never)
      .select("config")
      .eq("id", tenantId)
      .single();
    const config = { ...((current as { config?: Record<string, unknown> } | null)?.config ?? {}), suspensionReason: reason };
    const { error } = await supabaseAdmin
      .from("tenants" as never)
      .update({ status: "suspended", config } as never)
      .eq("id", tenantId);
    if (error) throw new Error(`Failed to suspend tenant: ${error.message}`);
  }

  static async getTenant(tenantId: string): Promise<Tenant | null> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("tenants" as never)
      .select("*")
      .eq("id", tenantId)
      .single();
    return (data as unknown as Tenant) ?? null;
  }

  static async getUserTenants(userId: string): Promise<Array<Tenant & { role: string }>> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("tenant_members" as never)
      .select("role, tenant:tenants(*)")
      .eq("user_id", userId);
    return ((data ?? []) as Array<{ role: string; tenant: Tenant }>).map((r) => ({
      ...r.tenant,
      role: r.role,
    }));
  }
}