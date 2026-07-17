import type { Permission, Role } from "./OrganizationTypes";

const roleCache = new Map<string, { role: Role; at: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export class PermissionEngine {
  static async hasPermission(
    tenantId: string,
    userId: string,
    permission: Permission,
  ): Promise<boolean> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: member } = await supabaseAdmin
      .from("organization_members" as never)
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .single();
    if (!member) return false;
    const role = await this.getRole(tenantId, (member as { role: string }).role);
    if (!role) return false;
    return role.permissions.includes(permission);
  }

  static async enforcePermission(
    tenantId: string,
    userId: string,
    permission: Permission,
  ): Promise<void> {
    if (!(await this.hasPermission(tenantId, userId, permission))) {
      throw new Error(`Permission denied: ${permission}`);
    }
  }

  static async getRole(tenantId: string, roleId: string): Promise<Role | null> {
    const cacheKey = `${tenantId}:${roleId}`;
    const cached = roleCache.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL) return cached.role;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("organization_roles" as never)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", roleId)
      .single();
    if (data) {
      const role = data as unknown as Role;
      roleCache.set(cacheKey, { role, at: Date.now() });
      return role;
    }
    return null;
  }

  static async createRole(
    tenantId: string,
    name: string,
    description: string,
    permissions: Permission[],
  ): Promise<Role> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = `role_${crypto.randomUUID()}`;
    const { data, error } = await supabaseAdmin
      .from("organization_roles" as never)
      .insert({
        id,
        tenant_id: tenantId,
        name,
        description,
        permissions,
        is_system_role: false,
      } as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as Role;
  }

  static async getRoles(tenantId: string): Promise<Role[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("organization_roles" as never)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name");
    return ((data ?? []) as unknown as Role[]);
  }

  static async seedDefaultRoles(tenantId: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const defaults: Array<{ name: string; description: string; permissions: Permission[] }> = [
      {
        name: "owner",
        description: "Full access to all organization features",
        permissions: [
          "org:manage","org:members:invite","org:members:remove","org:roles:manage",
          "agents:deploy","agents:execute","data:read","data:write","data:admin",
          "tools:install","tools:manage","analytics:view","billing:manage","api:keys:manage",
        ],
      },
      {
        name: "admin",
        description: "Administrative access without billing management",
        permissions: [
          "org:members:invite","org:members:remove","org:roles:manage",
          "agents:deploy","agents:execute","data:read","data:write","data:admin",
          "tools:install","tools:manage","analytics:view","api:keys:manage",
        ],
      },
      {
        name: "member",
        description: "Standard member access",
        permissions: ["agents:execute","data:read","data:write","analytics:view"],
      },
      {
        name: "viewer",
        description: "Read-only access",
        permissions: ["data:read","analytics:view"],
      },
    ];
    for (const r of defaults) {
      await supabaseAdmin.from("organization_roles" as never).insert({
        id: `role_${r.name}_${tenantId}`,
        tenant_id: tenantId,
        name: r.name,
        description: r.description,
        permissions: r.permissions,
        is_system_role: true,
      } as never);
    }
  }
}