import type { TeamHierarchy, TeamResourceQuota, TeamSettings } from "./AdvancedTeamTypes";

const DEFAULT_SETTINGS: TeamSettings = {
  allowMemberInvites: true,
  requireApprovalForJoin: false,
  defaultAgentModel: "google/gemini-3-flash-preview",
  maxConcurrentTasks: 10,
  notificationPreferences: { email: true, slack: false, inApp: true },
};
const DEFAULT_QUOTA: TeamResourceQuota = {
  maxAgents: 5,
  monthlyBudgetUSD: 1000,
  maxMemoryRecords: 5000,
  maxStorageGB: 10,
  allowedTools: ["*"],
};

export class AdvancedTeamManager {
  static async createTeam(
    tenantId: string,
    name: string,
    description: string,
    parentTeamId?: string,
    departmentId?: string,
    settings?: Partial<TeamSettings>,
    quota?: Partial<TeamResourceQuota>,
  ): Promise<TeamHierarchy> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let level = 0;
    let path = `/${name.toLowerCase().replace(/\s+/g, "-")}`;
    if (parentTeamId) {
      const { data: parent } = await supabaseAdmin
        .from("organization_teams" as never)
        .select("level, path")
        .eq("id", parentTeamId)
        .single();
      if (!parent) throw new Error("Parent team not found");
      const p = parent as { level: number; path: string };
      level = p.level + 1;
      path = `${p.path}/${name.toLowerCase().replace(/\s+/g, "-")}`;
    }
    const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
    const mergedQuota = { ...DEFAULT_QUOTA, ...quota };
    const id = `team_${crypto.randomUUID()}`;

    const { error } = await supabaseAdmin.from("organization_teams" as never).insert({
      id,
      tenant_id: tenantId,
      name,
      description,
      parent_team_id: parentTeamId ?? null,
      department_id: departmentId ?? null,
      level,
      path,
      settings: mergedSettings,
      resource_quota: mergedQuota,
    } as never);
    if (error) throw new Error(error.message);

    if (parentTeamId) {
      await supabaseAdmin.rpc("increment_team_child_count" as never, { _team_id: parentTeamId } as never);
    }
    await this.createDefaultChannels(id);

    return {
      id, tenantId, name, description, parentTeamId, level, path,
      departmentId, memberCount: 0, childTeamCount: 0,
      settings: mergedSettings, resourceQuota: mergedQuota,
      createdAt: new Date(), updatedAt: new Date(),
    };
  }

  static async mergeTeams(
    tenantId: string,
    sourceTeamId: string,
    targetTeamId: string,
    mergedBy: string,
  ): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sourceMembers } = await supabaseAdmin
      .from("organization_members" as never)
      .select("id, team_ids")
      .eq("tenant_id", tenantId)
      .contains("team_ids", [sourceTeamId]);
    for (const m of (sourceMembers ?? []) as Array<{ id: string; team_ids: string[] | null }>) {
      const newIds = (m.team_ids ?? []).filter((t) => t !== sourceTeamId);
      if (!newIds.includes(targetTeamId)) newIds.push(targetTeamId);
      await supabaseAdmin
        .from("organization_members" as never)
        .update({ team_ids: newIds } as never)
        .eq("id", m.id);
    }
    await supabaseAdmin
      .from("organization_teams" as never)
      .update({ parent_team_id: targetTeamId } as never)
      .eq("parent_team_id", sourceTeamId);
    const { data: src } = await supabaseAdmin
      .from("organization_teams" as never)
      .select("metadata")
      .eq("id", sourceTeamId)
      .single();
    const meta = { ...(((src as { metadata?: Record<string, unknown> } | null)?.metadata) ?? {}),
      mergedInto: targetTeamId, mergedBy };
    await supabaseAdmin
      .from("organization_teams" as never)
      .update({ status: "archived", metadata: meta } as never)
      .eq("id", sourceTeamId);
    await this.recalculateMemberCounts(targetTeamId);
  }

  static async archiveTeam(tenantId: string, teamId: string, archivedBy: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("organization_members" as never)
      .select("*", { count: "exact", head: true })
      .contains("team_ids", [teamId]);
    if (count && count > 0) {
      throw new Error("Cannot archive team with active members. Remove members first.");
    }
    const { data: cur } = await supabaseAdmin
      .from("organization_teams" as never)
      .select("metadata")
      .eq("id", teamId)
      .single();
    const meta = { ...(((cur as { metadata?: Record<string, unknown> } | null)?.metadata) ?? {}),
      archivedBy, archivedAt: new Date().toISOString() };
    await supabaseAdmin
      .from("organization_teams" as never)
      .update({ status: "archived", metadata: meta } as never)
      .eq("id", teamId)
      .eq("tenant_id", tenantId);
  }

  static async getTeamTree(tenantId: string): Promise<Array<Record<string, unknown>>> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("organization_teams" as never)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .order("path");
    return this.buildTree((data ?? []) as Array<Record<string, unknown>>, null);
  }

  private static buildTree(
    teams: Array<Record<string, unknown>>,
    parentId: string | null,
  ): Array<Record<string, unknown>> {
    return teams
      .filter((t) => (t.parent_team_id ?? null) === parentId)
      .map((t) => ({ ...t, children: this.buildTree(teams, t.id as string) }));
  }

  private static async createDefaultChannels(teamId: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const defaults = [
      { name: "general", type: "general", description: "General team discussions" },
      { name: "announcements", type: "announcement", description: "Important team announcements" },
    ];
    for (const c of defaults) {
      await supabaseAdmin.from("team_channels" as never).insert({
        id: `chan_${crypto.randomUUID()}`,
        team_id: teamId,
        name: c.name,
        type: c.type,
        description: c.description,
      } as never);
    }
  }

  private static async recalculateMemberCounts(teamId: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("organization_members" as never)
      .select("*", { count: "exact", head: true })
      .contains("team_ids", [teamId]);
    await supabaseAdmin
      .from("organization_teams" as never)
      .update({ member_count: count ?? 0 } as never)
      .eq("id", teamId);
  }
}