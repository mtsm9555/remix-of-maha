import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Role, RoleType } from "./RBACTypes";

function rowToRole(r: any): Role {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    description: r.description ?? undefined,
    type: r.type,
    parentRoleId: r.parent_role_id ?? undefined,
    inheritsPermissions: !!r.inherits_permissions,
    permissions: r.permissions ?? [],
    effectivePermissions: r.effective_permissions ?? [],
    maxMembers: r.max_members ?? undefined,
    currentMemberCount: r.current_member_count ?? 0,
    isSystemRole: !!r.is_system_role,
    isActive: !!r.is_active,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export class RoleManager {
  static async get(roleId: string): Promise<Role | null> {
    const { data } = await supabaseAdmin.from("rbac_roles").select("*").eq("id", roleId).maybeSingle();
    return data ? rowToRole(data) : null;
  }

  static async listForTenant(tenantId: string): Promise<Role[]> {
    const { data } = await supabaseAdmin.from("rbac_roles").select("*").eq("tenant_id", tenantId);
    return (data ?? []).map(rowToRole);
  }

  static async create(
    tenantId: string,
    name: string,
    permissions: string[],
    options: { description?: string; type?: RoleType; parentRoleId?: string; inheritsPermissions?: boolean; maxMembers?: number } = {}
  ): Promise<Role> {
    let effective = [...permissions];
    if (options.parentRoleId && options.inheritsPermissions !== false) {
      const parent = await this.get(options.parentRoleId);
      if (parent) effective = Array.from(new Set([...effective, ...parent.effectivePermissions]));
    }
    const id = `role_${crypto.randomUUID()}`;
    const { data, error } = await supabaseAdmin.from("rbac_roles").insert({
      id,
      tenant_id: tenantId,
      name,
      description: options.description ?? null,
      type: options.type ?? 'custom',
      parent_role_id: options.parentRoleId ?? null,
      inherits_permissions: options.inheritsPermissions !== false,
      permissions,
      effective_permissions: effective,
      max_members: options.maxMembers ?? null,
    }).select("*").single();
    if (error) throw error;
    return rowToRole(data);
  }

  static async update(roleId: string, updates: Partial<{ name: string; description: string; permissions: string[]; maxMembers: number; isActive: boolean }>): Promise<Role> {
    const patch: Record<string, unknown> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.maxMembers !== undefined) patch.max_members = updates.maxMembers;
    if (updates.isActive !== undefined) patch.is_active = updates.isActive;
    if (updates.permissions !== undefined) {
      patch.permissions = updates.permissions;
      patch.effective_permissions = updates.permissions;
    }
    const { data, error } = await supabaseAdmin.from("rbac_roles").update(patch).eq("id", roleId).select("*").single();
    if (error) throw error;
    return rowToRole(data);
  }

  static async remove(roleId: string): Promise<void> {
    const { error } = await supabaseAdmin.from("rbac_roles").delete().eq("id", roleId);
    if (error) throw error;
  }
}