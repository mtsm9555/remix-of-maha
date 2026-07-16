import type { BlackboardArtifact } from "./CollaborationTypes";

type PostArtifactInput = Omit<BlackboardArtifact, "version" | "updatedAt">;

function toArtifact(row: Record<string, unknown>): BlackboardArtifact {
  return {
    id: row.id as string,
    collaborationId: row.collaboration_id as string,
    ownerAgentId: row.owner_agent_id as string,
    content: (row.content as Record<string, unknown>) ?? {},
    version: row.version as number,
    lockedBy: (row.locked_by as string | null) ?? undefined,
    updatedAt: new Date(row.updated_at as string),
  };
}

export class SharedBlackboard {
  static async createSessionBlackboard(collaborationId: string): Promise<string> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("collaboration_blackboards")
      .insert({ id: collaborationId })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  static async postArtifact(artifact: PostArtifactInput): Promise<BlackboardArtifact> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("blackboard_artifacts")
      .select("locked_by, version")
      .eq("id", artifact.id)
      .maybeSingle();

    if (existing && existing.locked_by && existing.locked_by !== artifact.ownerAgentId) {
      throw new Error(`Artifact ${artifact.id} is locked by ${existing.locked_by}`);
    }

    const newVersion = existing ? (existing.version ?? 0) + 1 : 1;

    const { data, error } = await supabaseAdmin
      .from("blackboard_artifacts")
      .upsert({
        id: artifact.id,
        collaboration_id: artifact.collaborationId,
        owner_agent_id: artifact.ownerAgentId,
        content: artifact.content as never,
        version: newVersion,
        locked_by: null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return toArtifact(data as Record<string, unknown>);
  }

  static async getArtifact(artifactId: string): Promise<BlackboardArtifact | null> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("blackboard_artifacts")
      .select("*")
      .eq("id", artifactId)
      .maybeSingle();
    return data ? toArtifact(data as Record<string, unknown>) : null;
  }

  static async acquireLock(artifactId: string, agentId: string): Promise<boolean> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("blackboard_artifacts")
      .update({ locked_by: agentId, updated_at: new Date().toISOString() })
      .eq("id", artifactId)
      .is("locked_by", null)
      .select()
      .maybeSingle();
    return !!data;
  }
}