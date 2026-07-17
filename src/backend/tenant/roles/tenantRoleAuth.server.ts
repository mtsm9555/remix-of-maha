import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function isTenantAdmin(tenantId: string, userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  const role = (data as any)?.role;
  return role === "owner" || role === "admin";
}

export async function isTenantMember(tenantId: string, userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("tenant_members")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}