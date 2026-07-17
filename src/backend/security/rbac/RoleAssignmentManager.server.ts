import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { RoleAssignment } from "./RBACTypes";
import { RoleManager } from "./RoleManager.server";

function rowToAssignment(r: any): RoleAssignment {
  return {
    id: r.id,
    userId: r.user_id,
    roleId: r.role_id,
    tenantId: r.tenant_id,
    workspaceId: r.workspace_id ?? undefined,
    assignedBy: r.assigned_by,
    assignedAt: new Date(r.assigned_at),
    expiresAt: r.expires_at ? new Date(r.expires_at) : undefined,
    isActive: !!r.is_active,
    metadata: r.metadata ?? {},
  };
}

export class RoleAssignmentManager {
  static async assign(
    userId: string,
    roleId: string,
    tenantId: string,
    assignedBy: string,
    options: { workspaceId?: string; expiresAt?: Date; metadata?: Record<string, unknown> } = {}
  ): Promise<RoleAssignment> {
    const role = await RoleManager.get(roleId);
    if (!role) throw new Error(`Role ${roleId} not found`);
    if (role.tenantId !== tenantId) throw new Error("Role does not belong to this tenant");
    if (role.maxMembers && role.currentMemberCount >= role.maxMembers) {
      throw new Error(`Role has reached maximum member limit (${role.maxMembers})`);
    }
    const id = `assign_${crypto.randomUUID()}`;
    const { data, error } = await supabaseAdmin.from("rbac_role_assignments").insert({
      id,
      user_id: userId,
      role_id: roleId,
      tenant_id: tenantId,
      workspace_id: options.workspaceId ?? null,
      assigned_by: assignedBy,
      assigned_at: new Date().toISOString(),
      expires_at: options.expiresAt?.toISOString() ?? null,
      metadata: (options.metadata ?? {}) as any,
    }).select("*").single();
    if (error) throw error;
    await supabaseAdmin.from("rbac_roles").update({
      current_member_count: (role.currentMemberCount ?? 0) + 1,
    }).eq("id", roleId);
    return rowToAssignment(data);
  }

  static async revoke(assignmentId: string): Promise<void> {
    const { data } = await supabaseAdmin.from("rbac_role_assignments").select("role_id").eq("id", assignmentId).maybeSingle();
    const { error } = await supabaseAdmin.from("rbac_role_assignments").update({ is_active: false }).eq("id", assignmentId);
    if (error) throw error;
    if (data?.role_id) {
      const role = await RoleManager.get(String(data.role_id));
      if (role) {
        await supabaseAdmin.from("rbac_roles").update({
          current_member_count: Math.max(0, (role.currentMemberCount ?? 1) - 1),
        }).eq("id", role.id);
      }
    }
  }

  static async listForUser(userId: string, tenantId: string): Promise<RoleAssignment[]> {
    const { data } = await supabaseAdmin
      .from("rbac_role_assignments").select("*")
      .eq("user_id", userId).eq("tenant_id", tenantId).eq("is_active", true);
    return (data ?? []).map(rowToAssignment);
  }

  static async listForRole(roleId: string): Promise<RoleAssignment[]> {
    const { data } = await supabaseAdmin
      .from("rbac_role_assignments").select("*")
      .eq("role_id", roleId).eq("is_active", true);
    return (data ?? []).map(rowToAssignment);
  }
}