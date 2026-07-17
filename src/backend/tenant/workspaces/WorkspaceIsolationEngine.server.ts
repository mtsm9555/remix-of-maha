import { WorkspaceManager } from "./WorkspaceManager.server";
import type { WorkspaceContext, WorkspaceRole } from "./WorkspaceTypes";

const RESOURCE_TABLE_MAP: Record<string, { table: string; column: string }> = {
  memory: { table: "memories", column: "workspace_id" },
  agent: { table: "agent_instances_registry", column: "workspace_id" },
  conversation: { table: "conversations", column: "workspace_id" },
  task: { table: "tasks", column: "workspace_id" },
};

export class WorkspaceIsolationEngine {
  static async validateAccess(
    context: WorkspaceContext,
    resourceType: string,
    resourceId: string,
    action: "read" | "write" | "admin",
  ): Promise<{ allowed: boolean; reason?: string }> {
    const hasAccess = await WorkspaceManager.hasAccess(context.workspaceId, context.userId);
    if (!hasAccess) return { allowed: false, reason: "User does not have access to this workspace" };

    const resourceWorkspaceId = await this.getResourceWorkspaceId(resourceType, resourceId);
    if (resourceWorkspaceId && resourceWorkspaceId !== context.workspaceId) {
      const cross = await this.checkCrossWorkspaceAccess(context.workspaceId, resourceWorkspaceId, action);
      if (!cross) return { allowed: false, reason: "Cross-workspace access not allowed" };
    }

    const role = await WorkspaceManager.getUserRole(context.workspaceId, context.userId);
    if (!this.hasPermissionForAction(role, action))
      return { allowed: false, reason: `Role '${role ?? "none"}' cannot '${action}'` };
    return { allowed: true };
  }

  static async checkCrossWorkspaceAccess(
    sourceWorkspaceId: string,
    targetWorkspaceId: string,
    action: "read" | "write" | "admin",
  ): Promise<boolean> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("cross_workspace_access" as never)
      .select("*")
      .eq("source_workspace_id", sourceWorkspaceId)
      .eq("target_workspace_id", targetWorkspaceId)
      .eq("is_active", true)
      .maybeSingle();
    if (!data) return false;
    const d = data as { access_type: "read" | "write" | "admin"; expires_at: string | null };
    if (d.expires_at && new Date() > new Date(d.expires_at)) return false;
    const rank = { read: 1, write: 2, admin: 3 } as const;
    return rank[d.access_type] >= rank[action];
  }

  private static hasPermissionForAction(role: WorkspaceRole | null, action: "read" | "write" | "admin"): boolean {
    if (!role) return false;
    if (action === "admin") return role === "owner" || role === "admin";
    if (action === "write") return role !== "viewer";
    return true;
  }

  private static async getResourceWorkspaceId(resourceType: string, resourceId: string): Promise<string | null> {
    const target = RESOURCE_TABLE_MAP[resourceType];
    if (!target) return null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from(target.table as never)
      .select(target.column).eq("id", resourceId).maybeSingle();
    return data ? ((data as Record<string, string | null>)[target.column] ?? null) : null;
  }

  static async grantCrossWorkspaceAccess(
    sourceWorkspaceId: string,
    targetWorkspaceId: string,
    accessType: "read" | "write" | "admin",
    grantedBy: string,
    expiresAt?: Date,
  ) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = `cwa_${crypto.randomUUID()}`;
    const { data, error } = await supabaseAdmin.from("cross_workspace_access" as never).upsert({
      id, source_workspace_id: sourceWorkspaceId, target_workspace_id: targetWorkspaceId,
      access_type: accessType, granted_by: grantedBy,
      expires_at: expiresAt?.toISOString() ?? null, is_active: true,
    } as never, { onConflict: "source_workspace_id,target_workspace_id" })
      .select().single();
    if (error) throw new Error(error.message);
    return data;
  }
}