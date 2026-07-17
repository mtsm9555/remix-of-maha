import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Permission, PermissionAction, ResourceType } from "./RBACTypes";

function rowToPermission(r: any): Permission {
  return {
    id: r.id,
    resource: r.resource,
    action: r.action,
    description: r.description,
    isSystem: !!r.is_system,
    createdAt: new Date(r.created_at),
  };
}

export class PermissionRegistry {
  static async getAll(): Promise<Permission[]> {
    const { data } = await supabaseAdmin.from("rbac_permissions").select("*");
    return (data ?? []).map(rowToPermission);
  }

  static async getByResource(resource: ResourceType): Promise<Permission[]> {
    const { data } = await supabaseAdmin.from("rbac_permissions").select("*").eq("resource", resource);
    return (data ?? []).map(rowToPermission);
  }

  static async get(resource: ResourceType, action: PermissionAction): Promise<Permission | null> {
    const { data } = await supabaseAdmin
      .from("rbac_permissions").select("*")
      .eq("resource", resource).eq("action", action).maybeSingle();
    return data ? rowToPermission(data) : null;
  }

  static async register(
    resource: ResourceType,
    action: PermissionAction,
    description: string,
    isSystem = false
  ): Promise<Permission> {
    const existing = await this.get(resource, action);
    if (existing) return existing;
    const id = `perm_${crypto.randomUUID()}`;
    const { data, error } = await supabaseAdmin
      .from("rbac_permissions")
      .insert({ id, resource, action, description, is_system: isSystem })
      .select("*").single();
    if (error) throw error;
    return rowToPermission(data);
  }

  static async seedDefaults(): Promise<void> {
    const resources: ResourceType[] = ['agent','memory','tool','workspace','team','user','api_key','billing','settings','analytics'];
    const actions: PermissionAction[] = ['create','read','update','delete','execute','admin'];
    for (const r of resources) {
      for (const a of actions) {
        await this.register(r, a, `${a} ${r}`, true);
      }
    }
  }
}