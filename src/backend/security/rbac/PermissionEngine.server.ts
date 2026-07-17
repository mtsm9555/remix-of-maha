import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { PermissionCheck, PermissionResult } from "./RBACTypes";
import { PermissionRegistry } from "./PermissionRegistry.server";
import { RoleManager } from "./RoleManager.server";

export class PermissionEngine {
  static async check(input: PermissionCheck): Promise<PermissionResult> {
    const start = Date.now();
    const permission = await PermissionRegistry.get(input.resource, input.action);
    if (!permission) {
      return { allowed: false, reason: "Permission not found", evaluationTimeMs: Date.now() - start };
    }
    const { data: assignments } = await supabaseAdmin
      .from("rbac_role_assignments").select("role_id")
      .eq("user_id", input.userId).eq("tenant_id", input.tenantId).eq("is_active", true);
    const roleIds = (assignments ?? []).map((a: any) => a.role_id as string);
    if (roleIds.length === 0) {
      await this.log(input, false, undefined, permission.id, "no roles");
      return { allowed: false, reason: "User has no roles assigned", evaluationTimeMs: Date.now() - start };
    }
    for (const rid of roleIds) {
      const role = await RoleManager.get(rid);
      if (role?.isActive && role.effectivePermissions.includes(permission.id)) {
        await this.log(input, true, role.id, permission.id);
        return { allowed: true, roleId: role.id, permissionId: permission.id, evaluationTimeMs: Date.now() - start };
      }
    }
    await this.log(input, false, undefined, permission.id, "no matching role");
    return { allowed: false, reason: "No role has the required permission", evaluationTimeMs: Date.now() - start };
  }

  private static async log(check: PermissionCheck, allowed: boolean, roleId?: string, permissionId?: string, reason?: string): Promise<void> {
    await supabaseAdmin.from("rbac_audit_logs").insert({
      id: `audit_${crypto.randomUUID()}`,
      user_id: check.userId,
      tenant_id: check.tenantId,
      action: "permission_check",
      details: { resource: check.resource, action: check.action, allowed, roleId, permissionId, reason } as any,
      timestamp: new Date().toISOString(),
    });
  }
}