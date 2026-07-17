import { supabaseAdmin } from "@/integrations/supabase/client.server";

export class ProjectAccessControl {
  /** Verifies if an agent/user has access to a specific project. */
  static async verifyAccess(userId: string, projectId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle();
    return !!data && !error;
  }

  /** Grants an agent access to a project (e.g., when assigned to a task). */
  static async grantAgentAccess(
    agentId: string,
    projectId: string,
    role: string = "contributor",
  ) {
    const { error } = await supabaseAdmin
      .from("project_members")
      .upsert(
        { project_id: projectId, user_id: agentId, role },
        { onConflict: "project_id,user_id" },
      );
    if (error) throw new Error(`grantAgentAccess failed: ${error.message}`);
  }

  static async revokeAccess(userId: string, projectId: string) {
    await supabaseAdmin
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId);
  }
}