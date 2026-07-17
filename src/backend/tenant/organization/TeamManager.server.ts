import type { Team } from "./OrganizationTypes";

export class TeamManager {
  static async createTeam(
    tenantId: string,
    name: string,
    description: string,
    departmentId?: string,
  ): Promise<Team> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = `team_${crypto.randomUUID()}`;
    const { error } = await supabaseAdmin.from("organization_teams" as never).insert({
      id, tenant_id: tenantId, name, description, department_id: departmentId ?? null,
    } as never);
    if (error) throw new Error(error.message);
    return {
      id, tenantId, name, description, departmentId,
      memberCount: 0, createdAt: new Date(),
    };
  }

  static async addMemberToTeam(tenantId: string, memberId: string, teamId: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: member } = await supabaseAdmin
      .from("organization_members" as never)
      .select("team_ids")
      .eq("id", memberId)
      .eq("tenant_id", tenantId)
      .single();
    if (!member) throw new Error("Member not found");
    const teamIds = ((member as { team_ids: string[] | null }).team_ids ?? []).slice();
    if (!teamIds.includes(teamId)) {
      teamIds.push(teamId);
      await supabaseAdmin
        .from("organization_members" as never)
        .update({ team_ids: teamIds } as never)
        .eq("id", memberId);
    }
    await this.updateTeamMemberCount(teamId);
  }

  static async removeMemberFromTeam(tenantId: string, memberId: string, teamId: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: member } = await supabaseAdmin
      .from("organization_members" as never)
      .select("team_ids")
      .eq("id", memberId)
      .eq("tenant_id", tenantId)
      .single();
    if (!member) throw new Error("Member not found");
    const teamIds = ((member as { team_ids: string[] | null }).team_ids ?? []).filter((t) => t !== teamId);
    await supabaseAdmin
      .from("organization_members" as never)
      .update({ team_ids: teamIds } as never)
      .eq("id", memberId);
    await this.updateTeamMemberCount(teamId);
  }

  static async getTeams(tenantId: string): Promise<Team[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("organization_teams" as never)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name");
    return ((data ?? []) as unknown as Team[]);
  }

  private static async updateTeamMemberCount(teamId: string): Promise<void> {
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