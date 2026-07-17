import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { JITRoleElevation } from "./AdvancedRoleTypes";

function mapRow(r: any): JITRoleElevation {
  return {
    id: r.id,
    userId: r.user_id,
    tenantId: r.tenant_id,
    targetRoleId: r.target_role_id,
    reason: r.reason,
    requestedAt: new Date(r.requested_at),
    approvedAt: r.approved_at ? new Date(r.approved_at) : null,
    approvedBy: r.approved_by,
    expiresAt: new Date(r.expires_at),
    status: r.status,
  };
}

export class JITRoleElevationManager {
  static async requestElevation(
    userId: string,
    tenantId: string,
    targetRoleId: string,
    reason: string,
    durationHours = 2,
  ): Promise<JITRoleElevation> {
    const expiresAt = new Date(Date.now() + durationHours * 3600_000);
    const { data, error } = await supabaseAdmin
      .from("advanced_jit_role_elevations" as any)
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        target_role_id: targetRoleId,
        reason,
        expires_at: expiresAt.toISOString(),
        status: "pending",
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapRow(data);
  }

  static async approveElevation(elevationId: string, approvedBy: string): Promise<void> {
    const { data: elevation, error } = await supabaseAdmin
      .from("advanced_jit_role_elevations" as any)
      .select("*")
      .eq("id", elevationId)
      .eq("status", "pending")
      .single();
    if (error || !elevation) throw new Error("Elevation request not found or already processed");
    const e = elevation as any;

    await supabaseAdmin.from("advanced_role_assignments" as any).insert({
      role_id: e.target_role_id,
      user_id: e.user_id,
      tenant_id: e.tenant_id,
      assigned_by: approvedBy,
      expires_at: e.expires_at,
      is_active: true,
      is_temporary: true,
    });

    await supabaseAdmin
      .from("advanced_jit_role_elevations" as any)
      .update({ status: "approved", approved_at: new Date().toISOString(), approved_by: approvedBy })
      .eq("id", elevationId);
  }

  static async rejectElevation(elevationId: string, rejectedBy: string): Promise<void> {
    await supabaseAdmin
      .from("advanced_jit_role_elevations" as any)
      .update({ status: "rejected", approved_by: rejectedBy, approved_at: new Date().toISOString() })
      .eq("id", elevationId)
      .eq("status", "pending");
  }

  static async expireElevation(elevationId: string): Promise<void> {
    const { data: elevation } = await supabaseAdmin
      .from("advanced_jit_role_elevations" as any)
      .select("*")
      .eq("id", elevationId)
      .maybeSingle();
    if (!elevation) return;
    const e = elevation as any;
    await supabaseAdmin
      .from("advanced_role_assignments" as any)
      .update({ is_active: false })
      .eq("role_id", e.target_role_id)
      .eq("user_id", e.user_id)
      .eq("tenant_id", e.tenant_id)
      .eq("is_temporary", true);
    await supabaseAdmin
      .from("advanced_jit_role_elevations" as any)
      .update({ status: "expired" })
      .eq("id", elevationId);
  }

  static async listPending(tenantId: string): Promise<JITRoleElevation[]> {
    const { data } = await supabaseAdmin
      .from("advanced_jit_role_elevations" as any)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("status", "pending")
      .order("requested_at", { ascending: false });
    return (data ?? []).map(mapRow);
  }
}