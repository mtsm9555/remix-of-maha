import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type {
  AdvancedRole,
  ConditionalPermission,
  Permission,
  RoleChangeLog,
} from "./AdvancedRoleTypes";

function mapRow(r: any): AdvancedRole {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    description: r.description ?? "",
    parentRoleId: r.parent_role_id,
    inheritanceDepth: r.inheritance_depth ?? 0,
    directPermissions: r.direct_permissions ?? [],
    inheritedPermissions: r.inherited_permissions ?? [],
    effectivePermissions: r.effective_permissions ?? [],
    conditionalPermissions: (r.conditional_permissions ?? []) as ConditionalPermission[],
    isSystemRole: r.is_system_role ?? false,
    isTemplate: r.is_template ?? false,
    maxMembers: r.max_members ?? -1,
    currentMemberCount: r.current_member_count ?? 0,
    version: r.version ?? 1,
    createdBy: r.created_by,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export class AdvancedRoleManager {
  static async createRole(
    tenantId: string,
    name: string,
    description: string,
    permissions: Permission[],
    parentRoleId: string | null | undefined,
    conditionalPermissions: ConditionalPermission[] = [],
    createdBy: string | null = null,
  ): Promise<AdvancedRole> {
    let inheritanceDepth = 0;
    let inheritedPermissions: Permission[] = [];

    if (parentRoleId) {
      const parent = await this.getRole(tenantId, parentRoleId);
      if (!parent) throw new Error("Parent role not found");
      inheritanceDepth = parent.inheritanceDepth + 1;
      inheritedPermissions = [...parent.effectivePermissions];
    }

    const effective = Array.from(new Set([...permissions, ...inheritedPermissions]));

    const { data, error } = await supabaseAdmin
      .from("advanced_roles" as any)
      .insert({
        tenant_id: tenantId,
        name,
        description,
        parent_role_id: parentRoleId ?? null,
        inheritance_depth: inheritanceDepth,
        direct_permissions: permissions,
        inherited_permissions: inheritedPermissions,
        effective_permissions: effective,
        conditional_permissions: conditionalPermissions,
        created_by: createdBy,
      })
      .select("*")
      .single();
    if (error) throw error;
    const role = mapRow(data);
    await this.logChange(tenantId, role.id, "created", createdBy, { roleName: name });
    return role;
  }

  static async updateRole(
    tenantId: string,
    roleId: string,
    updates: Partial<Pick<AdvancedRole, "name" | "description" | "directPermissions" | "conditionalPermissions" | "maxMembers">>,
    updatedBy: string | null,
  ): Promise<AdvancedRole> {
    const role = await this.getRole(tenantId, roleId);
    if (!role) throw new Error("Role not found");

    const oldPermissions = [...role.directPermissions];
    const directPermissions = updates.directPermissions ?? role.directPermissions;

    let inheritedPermissions = role.inheritedPermissions;
    if (role.parentRoleId) {
      const parent = await this.getRole(tenantId, role.parentRoleId);
      if (parent) inheritedPermissions = [...parent.effectivePermissions];
    }
    const effective = Array.from(new Set([...directPermissions, ...inheritedPermissions]));

    const { data, error } = await supabaseAdmin
      .from("advanced_roles" as any)
      .update({
        name: updates.name ?? role.name,
        description: updates.description ?? role.description,
        direct_permissions: directPermissions,
        inherited_permissions: inheritedPermissions,
        effective_permissions: effective,
        conditional_permissions: updates.conditionalPermissions ?? role.conditionalPermissions,
        max_members: updates.maxMembers ?? role.maxMembers,
        version: role.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", roleId)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();
    if (error) throw error;

    await this.propagatePermissionChanges(tenantId, roleId);
    await this.logChange(tenantId, roleId, "updated", updatedBy, {
      oldPermissions,
      newPermissions: directPermissions,
    });
    return mapRow(data);
  }

  private static async propagatePermissionChanges(tenantId: string, parentRoleId: string) {
    const { data: children } = await supabaseAdmin
      .from("advanced_roles" as any)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("parent_role_id", parentRoleId);
    if (!children || children.length === 0) return;

    const parent = await this.getRole(tenantId, parentRoleId);
    if (!parent) return;

    for (const child of children as any[]) {
      const inherited = [...parent.effectivePermissions];
      const effective = Array.from(new Set([...(child.direct_permissions ?? []), ...inherited]));
      await supabaseAdmin
        .from("advanced_roles" as any)
        .update({
          inherited_permissions: inherited,
          effective_permissions: effective,
          updated_at: new Date().toISOString(),
        })
        .eq("id", child.id);
      await this.propagatePermissionChanges(tenantId, child.id);
    }
  }

  static async deleteRole(tenantId: string, roleId: string, deletedBy: string | null): Promise<void> {
    const role = await this.getRole(tenantId, roleId);
    if (!role) throw new Error("Role not found");
    if (role.isSystemRole) throw new Error("Cannot delete system role");

    const { count: childCount } = await supabaseAdmin
      .from("advanced_roles" as any)
      .select("*", { count: "exact", head: true })
      .eq("parent_role_id", roleId);
    if (childCount && childCount > 0)
      throw new Error("Cannot delete role with child roles. Reassign children first.");
    if (role.currentMemberCount > 0)
      throw new Error("Cannot delete role with active members. Reassign members first.");

    await supabaseAdmin.from("advanced_roles" as any).delete().eq("id", roleId);
    await this.logChange(tenantId, roleId, "deleted", deletedBy, { roleName: role.name });
  }

  static async getRole(tenantId: string, roleId: string): Promise<AdvancedRole | null> {
    const { data } = await supabaseAdmin
      .from("advanced_roles" as any)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", roleId)
      .maybeSingle();
    return data ? mapRow(data) : null;
  }

  static async getRoles(tenantId: string): Promise<AdvancedRole[]> {
    const { data } = await supabaseAdmin
      .from("advanced_roles" as any)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name");
    return (data ?? []).map(mapRow);
  }

  static async getRoleHierarchy(tenantId: string) {
    const roles = await this.getRoles(tenantId);
    const build = (parentId: string | null | undefined): any[] =>
      roles
        .filter((r) => (r.parentRoleId ?? null) === (parentId ?? null))
        .map((r) => ({ ...r, children: build(r.id) }));
    return build(null);
  }

  static async logChange(
    tenantId: string,
    roleId: string,
    changeType: RoleChangeLog["changeType"],
    changedBy: string | null,
    details: Record<string, any>,
  ) {
    await supabaseAdmin.from("advanced_role_change_logs" as any).insert({
      role_id: roleId,
      tenant_id: tenantId,
      change_type: changeType,
      changed_by: changedBy,
      details,
    });
  }
}