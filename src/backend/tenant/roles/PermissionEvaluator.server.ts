import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { AdvancedRoleManager } from "./AdvancedRoleManager.server";
import type { Permission, PermissionCondition, PermissionEvaluationContext } from "./AdvancedRoleTypes";

const permissionCache = new Map<string, { permissions: Permission[]; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export class PermissionEvaluator {
  static async hasPermission(ctx: PermissionEvaluationContext): Promise<boolean> {
    const cacheKey = `${ctx.tenantId}:${ctx.userId}:${ctx.permission}`;
    const cached = permissionCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.permissions.includes(ctx.permission);

    const { data: assignments } = await supabaseAdmin
      .from("advanced_role_assignments" as any)
      .select("role_id, expires_at")
      .eq("tenant_id", ctx.tenantId)
      .eq("user_id", ctx.userId)
      .eq("is_active", true);

    if (!assignments || assignments.length === 0) return false;

    const now = Date.now();
    const active = (assignments as any[]).filter(
      (a) => !a.expires_at || new Date(a.expires_at).getTime() > now,
    );

    for (const a of active) {
      const role = await AdvancedRoleManager.getRole(ctx.tenantId, a.role_id);
      if (!role) continue;
      if (role.effectivePermissions.includes(ctx.permission)) {
        this.cache(cacheKey, role.effectivePermissions);
        return true;
      }
      for (const cp of role.conditionalPermissions) {
        if (cp.permission === ctx.permission && cp.isActive) {
          if (await this.evaluateCondition(cp.condition, ctx)) {
            this.cache(cacheKey, [...role.effectivePermissions, ctx.permission]);
            return true;
          }
        }
      }
    }
    return false;
  }

  private static async evaluateCondition(cond: PermissionCondition, ctx: PermissionEvaluationContext): Promise<boolean> {
    switch (cond.type) {
      case "resource_owner":
        return this.checkResourceOwnership(cond.config, ctx);
      case "time_based":
        return this.checkTimeBased(cond.config);
      case "ip_based":
        return this.checkIpBased(cond.config, ctx);
      case "department_based":
        return true; // placeholder; wire up when department metadata exists
      case "custom":
      default:
        return false;
    }
  }

  private static async checkResourceOwnership(config: any, ctx: PermissionEvaluationContext): Promise<boolean> {
    if (!ctx.resourceType || !ctx.resourceId) return false;
    const table = String(config.resourceType ?? ctx.resourceType);
    const field = String(config.field ?? "owner_id");
    const { data } = await supabaseAdmin.from(table as any).select(field).eq("id", ctx.resourceId).maybeSingle();
    return !!data && (data as any)[field] === ctx.userId;
  }

  private static checkTimeBased(config: any): boolean {
    const now = new Date();
    const [sh, sm] = String(config.startTime ?? "00:00").split(":").map(Number);
    const [eh, em] = String(config.endTime ?? "23:59").split(":").map(Number);
    const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
    return mins >= sh * 60 + sm && mins <= eh * 60 + em;
  }

  private static checkIpBased(config: any, ctx: PermissionEvaluationContext): boolean {
    if (!ctx.ipAddress) return false;
    const allowed: string[] = config.allowedIPs ?? [];
    return allowed.some((ip) => ctx.ipAddress === ip || ctx.ipAddress!.startsWith(ip.split("/")[0]));
  }

  private static cache(key: string, perms: Permission[]) {
    permissionCache.set(key, { permissions: perms, expiresAt: Date.now() + CACHE_TTL });
  }

  static clearCache() {
    permissionCache.clear();
  }
}