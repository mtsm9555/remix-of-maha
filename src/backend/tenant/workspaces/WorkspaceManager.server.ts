import type {
  Workspace,
  WorkspaceIsolationPolicy,
  WorkspaceMembership,
  WorkspaceResourceQuota,
  WorkspaceRole,
  WorkspaceType,
  IsolationLevel,
} from "./WorkspaceTypes";

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 50);
}

function defaultIsolationPolicy(level: IsolationLevel): WorkspaceIsolationPolicy {
  const base: WorkspaceIsolationPolicy = {
    memoryIsolation: true,
    fileIsolation: true,
    conversationIsolation: true,
    agentIsolation: true,
    agentSharing: false,
    toolIsolation: false,
    allowedTools: ["*"],
    messageIsolation: true,
    allowCrossWorkspaceRead: false,
    allowCrossWorkspaceWrite: false,
    allowedCrossWorkspaceIds: [],
  };
  if (level === "moderate") return { ...base, agentSharing: true, allowCrossWorkspaceRead: true };
  if (level === "open") return { ...base, agentSharing: true, allowCrossWorkspaceRead: true, allowCrossWorkspaceWrite: true };
  return base;
}

type WsRow = {
  id: string; tenant_id: string; name: string; slug: string; description: string | null;
  type: WorkspaceType; isolation_level: IsolationLevel; isolation_policy: WorkspaceIsolationPolicy;
  owner_id: string; member_ids: string[]; max_members: number; resource_quota: WorkspaceResourceQuota;
  status: Workspace["status"]; archived_at: string | null; tags: string[] | null;
  metadata: Record<string, unknown> | null; created_at: string; updated_at: string;
};

function mapWorkspace(r: WsRow): Workspace {
  return {
    id: r.id, tenantId: r.tenant_id, name: r.name, slug: r.slug,
    description: r.description ?? undefined, type: r.type,
    isolationLevel: r.isolation_level, isolationPolicy: r.isolation_policy,
    ownerId: r.owner_id, memberIds: r.member_ids ?? [], maxMembers: r.max_members,
    resourceQuota: r.resource_quota, status: r.status,
    archivedAt: r.archived_at ? new Date(r.archived_at) : undefined,
    tags: r.tags ?? [], metadata: r.metadata ?? {},
    createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at),
  };
}

export class WorkspaceManager {
  static async createWorkspace(
    tenantId: string,
    name: string,
    type: WorkspaceType,
    ownerId: string,
    options: {
      description?: string;
      isolationLevel?: IsolationLevel;
      isolationPolicy?: Partial<WorkspaceIsolationPolicy>;
      resourceQuota?: Partial<WorkspaceResourceQuota>;
      tags?: string[];
    } = {},
  ): Promise<Workspace> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const slug = generateSlug(name);

    const { data: existing } = await supabaseAdmin
      .from("workspaces" as never).select("id")
      .eq("tenant_id", tenantId).eq("slug", slug).maybeSingle();
    if (existing) throw new Error(`Workspace with slug '${slug}' already exists`);

    const level: IsolationLevel = options.isolationLevel ?? "strict";
    const isolationPolicy = { ...defaultIsolationPolicy(level), ...options.isolationPolicy };
    const defaultQuota: WorkspaceResourceQuota = {
      maxAgents: 10, maxMemoryRecords: 5000, maxStorageGB: 10,
      maxConcurrentTasks: 5, monthlyBudgetUSD: 500,
      allowedModels: ["google/gemini-2.5-flash", "google/gemini-2.5-pro"],
    };
    const resourceQuota = { ...defaultQuota, ...options.resourceQuota };

    const id = `ws_${crypto.randomUUID()}`;
    const { data, error } = await supabaseAdmin.from("workspaces" as never).insert({
      id, tenant_id: tenantId, name, slug, description: options.description ?? null,
      type, isolation_level: level, isolation_policy: isolationPolicy,
      owner_id: ownerId, member_ids: [ownerId], max_members: 50,
      resource_quota: resourceQuota, status: "active",
      tags: options.tags ?? [], metadata: {},
    } as never).select().single();
    if (error) throw new Error(error.message);

    await this.addMember(id, ownerId, "owner");
    return mapWorkspace(data as unknown as WsRow);
  }

  static async addMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole = "member",
    permissions: string[] = [],
  ): Promise<WorkspaceMembership> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ws } = await supabaseAdmin.from("workspaces" as never)
      .select("max_members, member_ids").eq("id", workspaceId).single();
    if (!ws) throw new Error("Workspace not found");
    const w = ws as { max_members: number; member_ids: string[] };
    if ((w.member_ids ?? []).length >= w.max_members)
      throw new Error("Workspace has reached maximum member capacity");

    const id = `wsm_${crypto.randomUUID()}`;
    const joinedAt = new Date();
    const { error } = await supabaseAdmin.from("workspace_memberships" as never).insert({
      id, workspace_id: workspaceId, user_id: userId, role, permissions,
      joined_at: joinedAt.toISOString(),
    } as never);
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);

    const newIds = Array.from(new Set([...(w.member_ids ?? []), userId]));
    await supabaseAdmin.from("workspaces" as never)
      .update({ member_ids: newIds, updated_at: new Date().toISOString() } as never)
      .eq("id", workspaceId);

    return { id, workspaceId, userId, role, permissions, joinedAt };
  }

  static async removeMember(workspaceId: string, userId: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ws } = await supabaseAdmin.from("workspaces" as never)
      .select("owner_id, member_ids").eq("id", workspaceId).single();
    if (!ws) throw new Error("Workspace not found");
    const w = ws as { owner_id: string; member_ids: string[] };
    if (w.owner_id === userId) throw new Error("Cannot remove the workspace owner");

    await supabaseAdmin.from("workspace_memberships" as never).delete()
      .eq("workspace_id", workspaceId).eq("user_id", userId);
    await supabaseAdmin.from("workspaces" as never)
      .update({
        member_ids: (w.member_ids ?? []).filter((u) => u !== userId),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", workspaceId);
  }

  static async archiveWorkspace(workspaceId: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("workspaces" as never).update({
      status: "archived",
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never).eq("id", workspaceId);
  }

  static async getWorkspaces(tenantId: string, userId?: string): Promise<Workspace[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("workspaces" as never).select("*")
      .eq("tenant_id", tenantId).eq("status", "active")
      .order("created_at", { ascending: false });
    if (userId) q = q.contains("member_ids", JSON.stringify([userId]));
    const { data } = await q;
    return ((data ?? []) as unknown as WsRow[]).map(mapWorkspace);
  }

  static async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("workspaces" as never)
      .select("*").eq("id", workspaceId).maybeSingle();
    return data ? mapWorkspace(data as unknown as WsRow) : null;
  }

  static async hasAccess(workspaceId: string, userId: string): Promise<boolean> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("workspace_memberships" as never)
      .select("id").eq("workspace_id", workspaceId).eq("user_id", userId).maybeSingle();
    return !!data;
  }

  static async getUserRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("workspace_memberships" as never)
      .select("role").eq("workspace_id", workspaceId).eq("user_id", userId).maybeSingle();
    return data ? ((data as { role: WorkspaceRole }).role) : null;
  }

  static async listMembers(workspaceId: string): Promise<WorkspaceMembership[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("workspace_memberships" as never)
      .select("*").eq("workspace_id", workspaceId).order("joined_at", { ascending: false });
    return ((data ?? []) as unknown as Array<{
      id: string; workspace_id: string; user_id: string; role: WorkspaceRole;
      permissions: string[] | null; joined_at: string; last_active_at: string | null;
    }>).map((r) => ({
      id: r.id, workspaceId: r.workspace_id, userId: r.user_id, role: r.role,
      permissions: r.permissions ?? [], joinedAt: new Date(r.joined_at),
      lastActiveAt: r.last_active_at ? new Date(r.last_active_at) : undefined,
    }));
  }
}